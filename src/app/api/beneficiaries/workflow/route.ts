import { NextRequest } from 'next/server';
import { buildApiRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, parseBody } from '@/lib/api/route-helpers';
import { requireAuthenticatedUser } from '@/lib/api/auth-utils';
import {
  WorkflowEngine,
  WorkflowAction,
  WorkflowStage,
  STAGE_LABELS,
  ACTION_LABELS,
} from '@/lib/beneficiary/workflow-engine';

/**
 * GET /api/beneficiaries/workflow/config
 * Workflow konfigürasyonunu döndürür
 */
export const GET = buildApiRoute({
  requireModule: 'beneficiaries',
  allowedMethods: ['GET'],
  rateLimit: { maxRequests: 100, windowMs: 60000 },
})(async () => {
  await requireAuthenticatedUser();

  const stages = Object.entries(STAGE_LABELS).map(([key, value]) => ({
    value: key,
    ...value,
  }));

  const actions = Object.entries(ACTION_LABELS).map(([key, value]) => ({
    value: key,
    ...value,
  }));

  const steps = WorkflowEngine.getWorkflowSteps();

  return successResponse({
    stages,
    actions,
    steps,
  });
});

/**
 * POST /api/beneficiaries/workflow/available-actions
 * Mevcut durum için kullanılabilir aksiyonları döndürür
 */
export const POST = buildApiRoute({
  requireModule: 'beneficiaries',
  allowedMethods: ['POST'],
  rateLimit: { maxRequests: 100, windowMs: 60000 },
})(async (request: NextRequest) => {
  const { user } = await requireAuthenticatedUser();

  const { data, error } = await parseBody(request);

  if (error) {
    return errorResponse(error, 400);
  }

  const { currentStage } = data as { currentStage?: string };

  if (!currentStage) {
    return errorResponse('currentStage alanı gereklidir', 400);
  }

  // Validate stage
  if (!Object.values(WorkflowStage).includes(currentStage as WorkflowStage)) {
    return errorResponse('Geçersiz workflow aşaması', 400);
  }

  // Get user roles from session
  const userRoles = user?.role ? [user.role, 'user'] : ['user'];

  const availableActions = WorkflowEngine.getAvailableActions(
    currentStage as WorkflowStage,
    userRoles as string[]
  );

  const actionsWithLabels = availableActions.map((action) => ({
    action,
    ...ACTION_LABELS[action],
    targetStage: getTargetStage(currentStage as WorkflowStage, action),
  }));

  return successResponse({
    currentStage,
    currentStageInfo: STAGE_LABELS[currentStage as WorkflowStage],
    availableActions: actionsWithLabels,
  });
});

// Helper to get target stage for an action
function getTargetStage(from: WorkflowStage, action: WorkflowAction): WorkflowStage | null {
  const transitions: Record<string, WorkflowStage> = {
    [`${WorkflowStage.DRAFT}-${WorkflowAction.SUBMIT}`]: WorkflowStage.SUBMITTED,
    [`${WorkflowStage.SUBMITTED}-${WorkflowAction.START_REVIEW}`]: WorkflowStage.UNDER_REVIEW,
    [`${WorkflowStage.UNDER_REVIEW}-${WorkflowAction.REQUEST_INFO}`]: WorkflowStage.NEEDS_INFO,
    [`${WorkflowStage.UNDER_REVIEW}-${WorkflowAction.APPROVE}`]: WorkflowStage.APPROVED,
    [`${WorkflowStage.UNDER_REVIEW}-${WorkflowAction.REJECT}`]: WorkflowStage.REJECTED,
    [`${WorkflowStage.NEEDS_INFO}-${WorkflowAction.PROVIDE_INFO}`]: WorkflowStage.UNDER_REVIEW,
    [`${WorkflowStage.APPROVED}-${WorkflowAction.START_DISTRIBUTION}`]: WorkflowStage.IN_DISTRIBUTION,
    [`${WorkflowStage.IN_DISTRIBUTION}-${WorkflowAction.COMPLETE}`]: WorkflowStage.COMPLETED,
    [`${WorkflowStage.REJECTED}-${WorkflowAction.REOPEN}`]: WorkflowStage.UNDER_REVIEW,
  };

  return transitions[`${from}-${action}`] || null;
}
