/**
 * Beneficiary Workflow Engine
 * Yardım başvuru süreç yönetimi için state machine
 */

import logger from '@/lib/logger';

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
    comment?: string
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

    return { success: true, newStage: transition.to };
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
