/**
 * Beneficiary Workflow Engine
 * Yardım başvuru süreç yönetimi için state machine
 */

import logger from '@/lib/logger';
import { getDatabases } from '@/lib/appwrite/api/base';
import { appwriteConfig } from '@/lib/appwrite/config';
import { ID } from 'appwrite';

// === WORKFLOW TYPES ===

export enum WorkflowStage {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  NEEDS_INFO = 'needs_info',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  IN_DISTRIBUTION = 'in_distribution',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum WorkflowAction {
  SUBMIT = 'submit',
  START_REVIEW = 'start_review',
  REQUEST_INFO = 'request_info',
  PROVIDE_INFO = 'provide_info',
  APPROVE = 'approve',
  REJECT = 'reject',
  START_DISTRIBUTION = 'start_distribution',
  COMPLETE = 'complete',
  CANCEL = 'cancel',
  REOPEN = 'reopen',
}

export interface WorkflowTransition {
  from: WorkflowStage;
  to: WorkflowStage;
  action: WorkflowAction;
  requiredRoles?: string[];
  requiresComment?: boolean;
  requiresApproval?: boolean;
}

export interface WorkflowLogEntry {
  id: string;
  entityId: string;
  entityType: 'beneficiary' | 'aid_application';
  action: WorkflowAction;
  fromStage: WorkflowStage;
  toStage: WorkflowStage;
  performedBy: string;
  performedByName?: string;
  comment?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface WorkflowState {
  currentStage: WorkflowStage;
  previousStage?: WorkflowStage;
  lastAction?: WorkflowAction;
  lastActionBy?: string;
  lastActionAt?: string;
  assignedTo?: string;
  dueDate?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

// === WORKFLOW CONFIGURATION ===

export const WORKFLOW_TRANSITIONS: WorkflowTransition[] = [
  // Draft -> Submitted
  {
    from: WorkflowStage.DRAFT,
    to: WorkflowStage.SUBMITTED,
    action: WorkflowAction.SUBMIT,
    requiredRoles: ['user', 'editor', 'admin'],
  },
  // Submitted -> Under Review
  {
    from: WorkflowStage.SUBMITTED,
    to: WorkflowStage.UNDER_REVIEW,
    action: WorkflowAction.START_REVIEW,
    requiredRoles: ['reviewer', 'editor', 'admin'],
  },
  // Under Review -> Needs Info
  {
    from: WorkflowStage.UNDER_REVIEW,
    to: WorkflowStage.NEEDS_INFO,
    action: WorkflowAction.REQUEST_INFO,
    requiredRoles: ['reviewer', 'editor', 'admin'],
    requiresComment: true,
  },
  // Needs Info -> Under Review
  {
    from: WorkflowStage.NEEDS_INFO,
    to: WorkflowStage.UNDER_REVIEW,
    action: WorkflowAction.PROVIDE_INFO,
    requiredRoles: ['user', 'editor', 'admin'],
    requiresComment: true,
  },
  // Under Review -> Approved
  {
    from: WorkflowStage.UNDER_REVIEW,
    to: WorkflowStage.APPROVED,
    action: WorkflowAction.APPROVE,
    requiredRoles: ['approver', 'admin'],
    requiresComment: false,
  },
  // Under Review -> Rejected
  {
    from: WorkflowStage.UNDER_REVIEW,
    to: WorkflowStage.REJECTED,
    action: WorkflowAction.REJECT,
    requiredRoles: ['approver', 'admin'],
    requiresComment: true,
  },
  // Approved -> In Distribution
  {
    from: WorkflowStage.APPROVED,
    to: WorkflowStage.IN_DISTRIBUTION,
    action: WorkflowAction.START_DISTRIBUTION,
    requiredRoles: ['distributor', 'editor', 'admin'],
  },
  // In Distribution -> Completed
  {
    from: WorkflowStage.IN_DISTRIBUTION,
    to: WorkflowStage.COMPLETED,
    action: WorkflowAction.COMPLETE,
    requiredRoles: ['distributor', 'editor', 'admin'],
    requiresComment: false,
  },
  // Any active stage -> Cancelled
  {
    from: WorkflowStage.SUBMITTED,
    to: WorkflowStage.CANCELLED,
    action: WorkflowAction.CANCEL,
    requiredRoles: ['editor', 'admin'],
    requiresComment: true,
  },
  {
    from: WorkflowStage.UNDER_REVIEW,
    to: WorkflowStage.CANCELLED,
    action: WorkflowAction.CANCEL,
    requiredRoles: ['editor', 'admin'],
    requiresComment: true,
  },
  {
    from: WorkflowStage.NEEDS_INFO,
    to: WorkflowStage.CANCELLED,
    action: WorkflowAction.CANCEL,
    requiredRoles: ['editor', 'admin'],
    requiresComment: true,
  },
  // Rejected -> Under Review (reopen)
  {
    from: WorkflowStage.REJECTED,
    to: WorkflowStage.UNDER_REVIEW,
    action: WorkflowAction.REOPEN,
    requiredRoles: ['admin'],
    requiresComment: true,
  },
];

// Stage Labels (Turkish)
export const STAGE_LABELS: Record<WorkflowStage, { label: string; color: string; description: string }> = {
  [WorkflowStage.DRAFT]: {
    label: 'Taslak',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    description: 'Başvuru henüz tamamlanmadı',
  },
  [WorkflowStage.SUBMITTED]: {
    label: 'Gönderildi',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    description: 'Başvuru inceleme için bekliyor',
  },
  [WorkflowStage.UNDER_REVIEW]: {
    label: 'İnceleniyor',
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
    description: 'Başvuru değerlendiriliyor',
  },
  [WorkflowStage.NEEDS_INFO]: {
    label: 'Bilgi Bekleniyor',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
    description: 'Ek bilgi/belge gerekli',
  },
  [WorkflowStage.APPROVED]: {
    label: 'Onaylandı',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
    description: 'Başvuru onaylandı, dağıtım bekliyor',
  },
  [WorkflowStage.REJECTED]: {
    label: 'Reddedildi',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    description: 'Başvuru reddedildi',
  },
  [WorkflowStage.IN_DISTRIBUTION]: {
    label: 'Dağıtımda',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
    description: 'Yardım dağıtılıyor',
  },
  [WorkflowStage.COMPLETED]: {
    label: 'Tamamlandı',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
    description: 'Yardım teslim edildi',
  },
  [WorkflowStage.CANCELLED]: {
    label: 'İptal Edildi',
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
    description: 'Başvuru iptal edildi',
  },
};

// Action Labels (Turkish)
export const ACTION_LABELS: Record<WorkflowAction, { label: string; icon: string }> = {
  [WorkflowAction.SUBMIT]: { label: 'Gönder', icon: 'send' },
  [WorkflowAction.START_REVIEW]: { label: 'İncelemeye Al', icon: 'eye' },
  [WorkflowAction.REQUEST_INFO]: { label: 'Bilgi İste', icon: 'help-circle' },
  [WorkflowAction.PROVIDE_INFO]: { label: 'Bilgi Gönder', icon: 'file-plus' },
  [WorkflowAction.APPROVE]: { label: 'Onayla', icon: 'check-circle' },
  [WorkflowAction.REJECT]: { label: 'Reddet', icon: 'x-circle' },
  [WorkflowAction.START_DISTRIBUTION]: { label: 'Dağıtıma Başla', icon: 'truck' },
  [WorkflowAction.COMPLETE]: { label: 'Tamamla', icon: 'check-square' },
  [WorkflowAction.CANCEL]: { label: 'İptal Et', icon: 'ban' },
  [WorkflowAction.REOPEN]: { label: 'Yeniden Aç', icon: 'refresh-cw' },
};

// === WORKFLOW ENGINE ===

export class WorkflowEngine {
  /**
   * Mevcut durumdan geçiş yapılabilecek aksiyonları döndürür
   */
  static getAvailableActions(
    currentStage: WorkflowStage,
    userRoles: string[]
  ): WorkflowAction[] {
    const transitions = WORKFLOW_TRANSITIONS.filter((t) => {
      if (t.from !== currentStage) return false;
      if (t.requiredRoles && t.requiredRoles.length > 0) {
        return t.requiredRoles.some((role) => userRoles.includes(role));
      }
      return true;
    });

    return transitions.map((t) => t.action);
  }

  /**
   * Belirli bir aksiyonun yapılıp yapılamayacağını kontrol eder
   */
  static canPerformAction(
    currentStage: WorkflowStage,
    action: WorkflowAction,
    userRoles: string[]
  ): { allowed: boolean; reason?: string } {
    const transition = WORKFLOW_TRANSITIONS.find(
      (t) => t.from === currentStage && t.action === action
    );

    if (!transition) {
      return {
        allowed: false,
        reason: `Bu aşamada "${ACTION_LABELS[action].label}" işlemi yapılamaz`,
      };
    }

    if (transition.requiredRoles && transition.requiredRoles.length > 0) {
      const hasRole = transition.requiredRoles.some((role) => userRoles.includes(role));
      if (!hasRole) {
        return {
          allowed: false,
          reason: 'Bu işlem için yetkiniz bulunmuyor',
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Workflow geçişini gerçekleştirir
   */
  static async performTransition(
    currentStage: WorkflowStage,
    action: WorkflowAction,
    userRoles: string[],
    comment?: string,
    metadata?: {
      entityId: string;
      entityType: 'beneficiary' | 'aid_application';
      userId: string;
      userName?: string;
    }
  ): Promise<{ success: boolean; newStage?: WorkflowStage; error?: string }> {
    const canPerform = this.canPerformAction(currentStage, action, userRoles);

    if (!canPerform.allowed) {
      return { success: false, error: canPerform.reason };
    }

    const transition = WORKFLOW_TRANSITIONS.find(
      (t) => t.from === currentStage && t.action === action
    );

    if (!transition) {
      return { success: false, error: 'Geçersiz işlem' };
    }

    if (transition.requiresComment && !comment) {
      return { success: false, error: 'Bu işlem için açıklama gereklidir' };
    }

    logger.info('Workflow transition', {
      from: currentStage,
      to: transition.to,
      action,
    });

    // Persist workflow log to database if metadata provided
    if (metadata) {
      try {
        await this.createWorkflowLog({
          entityId: metadata.entityId,
          entityType: metadata.entityType,
          action,
          fromStage: currentStage,
          toStage: transition.to,
          performedBy: metadata.userId,
          performedByName: metadata.userName,
          comment,
          metadata: {
            userRoles,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        logger.error('Failed to create workflow log', { error });
        // Don't fail the transition if logging fails
      }
    }

    return { success: true, newStage: transition.to };
  }

  /**
   * Create a workflow log entry in the database
   */
  static async createWorkflowLog(
    logData: Omit<WorkflowLogEntry, 'id' | 'createdAt'>
  ): Promise<WorkflowLogEntry> {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.workflowLogs;

    const doc = await databases.createDocument(
      appwriteConfig.databaseId,
      collectionId,
      ID.unique(),
      {
        entityId: logData.entityId,
        entityType: logData.entityType,
        action: logData.action,
        fromStage: logData.fromStage,
        toStage: logData.toStage,
        performedBy: logData.performedBy,
        performedByName: logData.performedByName || '',
        comment: logData.comment || '',
        metadata: JSON.stringify(logData.metadata || {}),
      }
    );

    return {
      id: doc.$id,
      entityId: doc.entityId,
      entityType: doc.entityType,
      action: doc.action,
      fromStage: doc.fromStage,
      toStage: doc.toStage,
      performedBy: doc.performedBy,
      performedByName: doc.performedByName,
      comment: doc.comment,
      metadata: doc.metadata ? JSON.parse(doc.metadata) : undefined,
      createdAt: doc.$createdAt,
    };
  }

  /**
   * Get workflow history for an entity
   */
  static async getWorkflowHistory(
    entityId: string,
    entityType: 'beneficiary' | 'aid_application'
  ): Promise<WorkflowLogEntry[]> {
    try {
      const databases = getDatabases();
      const collectionId = appwriteConfig.collections.workflowLogs;

      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        collectionId,
        [
          // Query.equal('entityId', entityId),
          // Query.equal('entityType', entityType),
          // Query.orderDesc('$createdAt'),
          // Query.limit(100),
        ]
      );

      return response.documents.map((doc) => ({
        id: doc.$id,
        entityId: doc.entityId,
        entityType: doc.entityType,
        action: doc.action,
        fromStage: doc.fromStage,
        toStage: doc.toStage,
        performedBy: doc.performedBy,
        performedByName: doc.performedByName,
        comment: doc.comment,
        metadata: doc.metadata ? JSON.parse(doc.metadata) : undefined,
        createdAt: doc.$createdAt,
      }));
    } catch (error) {
      logger.error('Failed to get workflow history', { error, entityId, entityType });
      return [];
    }
  }

  /**
   * Workflow akışını görselleştirmek için adımları döndürür
   */
  static getWorkflowSteps(): { stage: WorkflowStage; label: string; order: number }[] {
    return [
      { stage: WorkflowStage.DRAFT, label: 'Taslak', order: 1 },
      { stage: WorkflowStage.SUBMITTED, label: 'Gönderildi', order: 2 },
      { stage: WorkflowStage.UNDER_REVIEW, label: 'İnceleme', order: 3 },
      { stage: WorkflowStage.APPROVED, label: 'Onay', order: 4 },
      { stage: WorkflowStage.IN_DISTRIBUTION, label: 'Dağıtım', order: 5 },
      { stage: WorkflowStage.COMPLETED, label: 'Tamamlandı', order: 6 },
    ];
  }

  /**
   * İstatistik için aşama sayılarını hesaplar
   */
  static getStageOrder(stage: WorkflowStage): number {
    const steps = this.getWorkflowSteps();
    const step = steps.find((s) => s.stage === stage);
    return step?.order || 0;
  }

  /**
   * Aşamanın tamamlanıp tamamlanmadığını kontrol eder
   */
  static isStageCompleted(
    currentStage: WorkflowStage,
    checkStage: WorkflowStage
  ): boolean {
    const currentOrder = this.getStageOrder(currentStage);
    const checkOrder = this.getStageOrder(checkStage);
    return checkOrder < currentOrder;
  }

  /**
   * Aşamanın aktif olup olmadığını kontrol eder
   */
  static isStageActive(
    currentStage: WorkflowStage,
    checkStage: WorkflowStage
  ): boolean {
    return currentStage === checkStage;
  }
}

// === UTILITY FUNCTIONS ===

/**
 * Workflow durumunu formatlı string olarak döndürür
 */
export function formatWorkflowStage(stage: WorkflowStage): string {
  return STAGE_LABELS[stage]?.label || stage;
}

/**
 * Workflow aksiyonunu formatlı string olarak döndürür
 */
export function formatWorkflowAction(action: WorkflowAction): string {
  return ACTION_LABELS[action]?.label || action;
}

/**
 * Bekleyen işlem sayısını hesaplar
 */
export function calculatePendingActions(
  items: Array<{ workflowStage?: WorkflowStage }>
): Record<WorkflowStage, number> {
  const counts: Record<WorkflowStage, number> = {} as Record<WorkflowStage, number>;

  for (const stage of Object.values(WorkflowStage)) {
    counts[stage] = 0;
  }

  for (const item of items) {
    if (item.workflowStage) {
      counts[item.workflowStage]++;
    }
  }

  return counts;
}

// === WORKFLOW STATISTICS ===

export interface WorkflowStatistics {
  total: number;
  byStage: Record<WorkflowStage, number>;
  activeCount: number; // Not completed, rejected, or cancelled
  completedCount: number;
  rejectedCount: number;
  cancelledCount: number;
  averageTimeInStage?: Record<WorkflowStage, number>; // Average days in each stage
  completionRate: number; // Percentage of completed vs total
}

/**
 * Calculate comprehensive workflow statistics
 */
export function calculateWorkflowStatistics(
  items: Array<{
    workflowStage?: WorkflowStage;
    createdAt?: string;
    completedAt?: string;
  }>
): WorkflowStatistics {
  const stats: WorkflowStatistics = {
    total: items.length,
    byStage: {} as Record<WorkflowStage, number>,
    activeCount: 0,
    completedCount: 0,
    rejectedCount: 0,
    cancelledCount: 0,
    completionRate: 0,
  };

  // Initialize stage counts
  for (const stage of Object.values(WorkflowStage)) {
    stats.byStage[stage] = 0;
  }

  // Count items by stage
  for (const item of items) {
    if (item.workflowStage) {
      stats.byStage[item.workflowStage]++;

      // Count specific categories
      if (item.workflowStage === WorkflowStage.COMPLETED) {
        stats.completedCount++;
      } else if (item.workflowStage === WorkflowStage.REJECTED) {
        stats.rejectedCount++;
      } else if (item.workflowStage === WorkflowStage.CANCELLED) {
        stats.cancelledCount++;
      } else {
        stats.activeCount++;
      }
    }
  }

  // Calculate completion rate
  if (stats.total > 0) {
    stats.completionRate = Math.round((stats.completedCount / stats.total) * 100);
  }

  return stats;
}

/**
 * Get items requiring attention (needs action)
 */
export function getItemsRequiringAttention(
  items: Array<{
    workflowStage?: WorkflowStage;
    assignedTo?: string;
    dueDate?: string;
  }>,
  userId?: string
): Array<{
  item: typeof items[0];
  reason: string;
  priority: 'high' | 'medium' | 'low';
}> {
  const now = new Date();
  const needsAttention: Array<{
    item: typeof items[0];
    reason: string;
    priority: 'high' | 'medium' | 'low';
  }> = [];

  for (const item of items) {
    // Overdue items
    if (item.dueDate) {
      const dueDate = new Date(item.dueDate);
      if (dueDate < now) {
        needsAttention.push({
          item,
          reason: 'Süresi geçmiş',
          priority: 'high',
        });
        continue;
      }
    }

    // Items in NEEDS_INFO stage
    if (item.workflowStage === WorkflowStage.NEEDS_INFO) {
      needsAttention.push({
        item,
        reason: 'Bilgi bekleniyor',
        priority: 'medium',
      });
      continue;
    }

    // Items assigned to user and waiting for review
    if (
      userId &&
      item.assignedTo === userId &&
      (item.workflowStage === WorkflowStage.SUBMITTED ||
        item.workflowStage === WorkflowStage.UNDER_REVIEW)
    ) {
      needsAttention.push({
        item,
        reason: 'İnceleme gerekiyor',
        priority: 'medium',
      });
    }
  }

  // Sort by priority
  return needsAttention.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Calculate workflow efficiency metrics
 */
export interface WorkflowEfficiencyMetrics {
  averageCompletionTime?: number; // Days from creation to completion
  bottleneckStage?: WorkflowStage; // Stage with longest average duration
  throughputRate?: number; // Items completed per week
  rejectionRate: number; // Percentage of rejected items
  cancellationRate: number; // Percentage of cancelled items
}

export function calculateWorkflowEfficiency(
  items: Array<{
    workflowStage?: WorkflowStage;
    createdAt?: string;
    completedAt?: string;
  }>
): WorkflowEfficiencyMetrics {
  const metrics: WorkflowEfficiencyMetrics = {
    rejectionRate: 0,
    cancellationRate: 0,
  };

  const completedItems = items.filter(
    (item) => item.workflowStage === WorkflowStage.COMPLETED && item.completedAt
  );

  // Calculate average completion time
  if (completedItems.length > 0) {
    let totalDays = 0;
    for (const item of completedItems) {
      if (item.createdAt && item.completedAt) {
        const created = new Date(item.createdAt);
        const completed = new Date(item.completedAt);
        const days = (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        totalDays += days;
      }
    }
    metrics.averageCompletionTime = Math.round(totalDays / completedItems.length);
  }

  // Calculate rejection and cancellation rates
  const total = items.length;
  if (total > 0) {
    const rejectedCount = items.filter(
      (item) => item.workflowStage === WorkflowStage.REJECTED
    ).length;
    const cancelledCount = items.filter(
      (item) => item.workflowStage === WorkflowStage.CANCELLED
    ).length;

    metrics.rejectionRate = Math.round((rejectedCount / total) * 100);
    metrics.cancellationRate = Math.round((cancelledCount / total) * 100);
  }

  // Calculate throughput rate (items completed per week)
  if (completedItems.length > 0 && completedItems[0].completedAt) {
    const oldestCompleted = completedItems.reduce((oldest, item) => {
      if (!oldest.completedAt || !item.completedAt) return oldest;
      return new Date(item.completedAt) < new Date(oldest.completedAt) ? item : oldest;
    }, completedItems[0]);

    const newestCompleted = completedItems.reduce((newest, item) => {
      if (!newest.completedAt || !item.completedAt) return newest;
      return new Date(item.completedAt) > new Date(newest.completedAt) ? item : newest;
    }, completedItems[0]);

    if (oldestCompleted.completedAt && newestCompleted.completedAt) {
      const oldest = new Date(oldestCompleted.completedAt);
      const newest = new Date(newestCompleted.completedAt);
      const weeks = (newest.getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24 * 7);

      if (weeks > 0) {
        metrics.throughputRate = Math.round((completedItems.length / weeks) * 10) / 10;
      }
    }
  }

  return metrics;
}
