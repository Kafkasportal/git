import { NextRequest } from 'next/server';
import { buildApiRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, parseBody } from '@/lib/api/route-helpers';
import { verifyCsrfToken, requireAuthenticatedUser } from '@/lib/api/auth-utils';
import {
  WorkflowEngine,
  WorkflowAction,
  WorkflowStage,
  STAGE_LABELS,
  ACTION_LABELS,
  type WorkflowLogEntry,
} from '@/lib/beneficiary/workflow-engine';
import { appwriteBeneficiaries } from '@/lib/appwrite/api';
import { getDatabases } from '@/lib/appwrite/api/base';
import { appwriteConfig } from '@/lib/appwrite/config';
import type { RouteContext } from '@/lib/api/middleware';

/**
 * GET /api/beneficiaries/[id]/workflow
 * Kayıt için workflow durumunu ve geçmişini döndürür
 */
export const GET = buildApiRoute({
  requireModule: 'beneficiaries',
  allowedMethods: ['GET'],
  rateLimit: { maxRequests: 100, windowMs: 60000 },
})(async (_request: NextRequest, context?: RouteContext) => {
  await requireAuthenticatedUser();

  const params = context?.params ? await context.params : {};
  const id = params.id as string;

  if (!id) {
    return errorResponse('Kayıt ID gereklidir', 400);
  }

  try {
    // Get beneficiary
    const beneficiary = await appwriteBeneficiaries.get(id) as Record<string, unknown> | null;

    if (!beneficiary) {
      return errorResponse('Kayıt bulunamadı', 404);
    }

    const currentStage = (beneficiary.workflowStage as WorkflowStage) || WorkflowStage.DRAFT;

    // Get workflow logs (if collection exists)
    let logs: WorkflowLogEntry[] = [];
    try {
      const databases = getDatabases();
      const logsResult = await databases.listDocuments(
        appwriteConfig.databaseId,
        'workflow_logs',
        []
      );
      logs = logsResult.documents
        .filter((doc: Record<string, unknown>) => doc.entityId === id)
        .map((doc: Record<string, unknown>) => ({
          id: doc.$id,
          entityId: doc.entityId,
          entityType: doc.entityType || 'beneficiary',
          action: doc.action,
          fromStage: doc.fromStage,
          toStage: doc.toStage,
          performedBy: doc.performedBy,
          performedByName: doc.performedByName,
          comment: doc.comment,
          metadata: doc.metadata,
          createdAt: doc.$createdAt,
        })) as WorkflowLogEntry[];
    } catch {
      // Collection might not exist yet, continue without logs
    }

    return successResponse({
      id,
      currentStage,
      stageInfo: STAGE_LABELS[currentStage],
      logs,
      assignedTo: beneficiary.assignedTo as string | undefined,
      dueDate: beneficiary.dueDate as string | undefined,
      priority: beneficiary.priority as string | undefined,
    });
  } catch (_error) {
    return errorResponse('Workflow bilgisi alınamadı', 500);
  }
});

/**
 * PATCH /api/beneficiaries/[id]/workflow
 * Workflow aksiyonu gerçekleştirir
 */
export const PATCH = buildApiRoute({
  requireModule: 'beneficiaries',
  allowedMethods: ['PATCH'],
  rateLimit: { maxRequests: 50, windowMs: 60000 },
})(async (request: NextRequest, context?: RouteContext) => {
  await verifyCsrfToken(request);
  const { session, user } = await requireAuthenticatedUser();

  const params = context?.params ? await context.params : {};
  const id = params.id as string;

  if (!id) {
    return errorResponse('Kayıt ID gereklidir', 400);
  }

  const { data, error } = await parseBody(request);

  if (error) {
    return errorResponse(error, 400);
  }

  const { action, comment, assignTo, dueDate, priority } = data as {
    action: WorkflowAction;
    comment?: string;
    assignTo?: string;
    dueDate?: string;
    priority?: string;
  };

  if (!action) {
    return errorResponse('Aksiyon belirtilmelidir', 400);
  }

  // Validate action
  if (!Object.values(WorkflowAction).includes(action)) {
    return errorResponse('Geçersiz workflow aksiyonu', 400);
  }

  try {
    // Get current beneficiary state
    const beneficiary = await appwriteBeneficiaries.get(id) as Record<string, unknown> | null;

    if (!beneficiary) {
      return errorResponse('Kayıt bulunamadı', 404);
    }

    const currentStage = (beneficiary.workflowStage as WorkflowStage) || WorkflowStage.DRAFT;

    // Get user roles
    const userRoles = user?.role ? [user.role, 'user'] : ['user'];

    // Perform workflow transition
    const result = WorkflowEngine.performTransition(
      currentStage,
      action,
      userRoles,
      comment
    );

    const transitionResult = await result;

    if (!transitionResult.success) {
      return errorResponse(transitionResult.error || 'İşlem başarısız', 400);
    }

    // Update beneficiary with new workflow state
    const updateData: Record<string, unknown> = {
      workflowStage: transitionResult.newStage,
      lastWorkflowAction: action,
      lastWorkflowActionBy: user.id,
      lastWorkflowActionAt: new Date().toISOString(),
    };

    if (assignTo) updateData.assignedTo = assignTo;
    if (dueDate) updateData.dueDate = dueDate;
    if (priority) updateData.priority = priority;

    await appwriteBeneficiaries.update(id, updateData as never, { auth: { userId: session.userId, role: user.role || 'user' } });

    // Log the workflow action
    try {
      const databases = getDatabases();
      await databases.createDocument(
        appwriteConfig.databaseId,
        'workflow_logs',
        'unique()',
        {
          entityId: id,
          entityType: 'beneficiary',
          action,
          fromStage: currentStage,
          toStage: transitionResult.newStage,
          performedBy: user.id,
          performedByName: user.name,
          comment,
          metadata: JSON.stringify({ assignTo, dueDate, priority }),
        }
      );
    } catch {
      // Log creation failed, but don't fail the whole operation
    }

    return successResponse({
      id,
      previousStage: currentStage,
      newStage: transitionResult.newStage,
      action,
      actionLabel: ACTION_LABELS[action].label,
      stageInfo: STAGE_LABELS[transitionResult.newStage!],
    }, `Başvuru durumu "${STAGE_LABELS[transitionResult.newStage!].label}" olarak güncellendi`);
  } catch (_error) {
    return errorResponse('Workflow güncellenemedi', 500);
  }
});
