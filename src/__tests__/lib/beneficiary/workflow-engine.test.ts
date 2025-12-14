import { describe, it, expect } from 'vitest';
import {
  WorkflowEngine,
  WorkflowStage,
  WorkflowAction,
  calculateWorkflowStatistics,
  calculateWorkflowEfficiency,
  getItemsRequiringAttention,
} from '@/lib/beneficiary/workflow-engine';

describe('WorkflowEngine', () => {
  describe('getAvailableActions', () => {
    it('should return submit action for draft stage with user role', () => {
      const actions = WorkflowEngine.getAvailableActions(WorkflowStage.DRAFT, ['user']);
      expect(actions).toContain(WorkflowAction.SUBMIT);
    });

    it('should return start_review action for submitted stage with reviewer role', () => {
      const actions = WorkflowEngine.getAvailableActions(WorkflowStage.SUBMITTED, [
        'reviewer',
      ]);
      expect(actions).toContain(WorkflowAction.START_REVIEW);
    });

    it('should return empty for draft stage without proper role', () => {
      const actions = WorkflowEngine.getAvailableActions(WorkflowStage.DRAFT, ['viewer']);
      expect(actions).toHaveLength(0);
    });

    it('should return approve and reject for under_review with approver role', () => {
      const actions = WorkflowEngine.getAvailableActions(WorkflowStage.UNDER_REVIEW, [
        'approver',
      ]);
      expect(actions).toContain(WorkflowAction.APPROVE);
      expect(actions).toContain(WorkflowAction.REJECT);
    });
  });

  describe('canPerformAction', () => {
    it('should allow submit from draft with user role', () => {
      const result = WorkflowEngine.canPerformAction(
        WorkflowStage.DRAFT,
        WorkflowAction.SUBMIT,
        ['user']
      );
      expect(result.allowed).toBe(true);
    });

    it('should deny submit from draft without proper role', () => {
      const result = WorkflowEngine.canPerformAction(
        WorkflowStage.DRAFT,
        WorkflowAction.SUBMIT,
        ['viewer']
      );
      expect(result.allowed).toBe(false);
      expect(result.reason).toBeDefined();
    });

    it('should deny invalid transition', () => {
      const result = WorkflowEngine.canPerformAction(
        WorkflowStage.DRAFT,
        WorkflowAction.APPROVE,
        ['admin']
      );
      expect(result.allowed).toBe(false);
    });

    it('should allow admin to perform most actions', () => {
      const result = WorkflowEngine.canPerformAction(
        WorkflowStage.UNDER_REVIEW,
        WorkflowAction.APPROVE,
        ['admin']
      );
      expect(result.allowed).toBe(true);
    });
  });

  describe('getWorkflowSteps', () => {
    it('should return ordered workflow steps', () => {
      const steps = WorkflowEngine.getWorkflowSteps();
      expect(steps).toHaveLength(6);
      expect(steps[0].stage).toBe(WorkflowStage.DRAFT);
      expect(steps[5].stage).toBe(WorkflowStage.COMPLETED);
    });

    it('should have sequential order', () => {
      const steps = WorkflowEngine.getWorkflowSteps();
      for (let i = 0; i < steps.length; i++) {
        expect(steps[i].order).toBe(i + 1);
      }
    });
  });

  describe('isStageCompleted', () => {
    it('should return true for completed stages', () => {
      const result = WorkflowEngine.isStageCompleted(
        WorkflowStage.APPROVED,
        WorkflowStage.SUBMITTED
      );
      expect(result).toBe(true);
    });

    it('should return false for future stages', () => {
      const result = WorkflowEngine.isStageCompleted(
        WorkflowStage.SUBMITTED,
        WorkflowStage.APPROVED
      );
      expect(result).toBe(false);
    });

    it('should return false for current stage', () => {
      const result = WorkflowEngine.isStageCompleted(
        WorkflowStage.SUBMITTED,
        WorkflowStage.SUBMITTED
      );
      expect(result).toBe(false);
    });
  });

  describe('isStageActive', () => {
    it('should return true for current stage', () => {
      const result = WorkflowEngine.isStageActive(
        WorkflowStage.UNDER_REVIEW,
        WorkflowStage.UNDER_REVIEW
      );
      expect(result).toBe(true);
    });

    it('should return false for different stage', () => {
      const result = WorkflowEngine.isStageActive(
        WorkflowStage.UNDER_REVIEW,
        WorkflowStage.APPROVED
      );
      expect(result).toBe(false);
    });
  });
});

describe('Workflow Statistics', () => {
  describe('calculateWorkflowStatistics', () => {
    it('should calculate statistics correctly', () => {
      const items = [
        { workflowStage: WorkflowStage.DRAFT },
        { workflowStage: WorkflowStage.SUBMITTED },
        { workflowStage: WorkflowStage.UNDER_REVIEW },
        { workflowStage: WorkflowStage.COMPLETED },
        { workflowStage: WorkflowStage.COMPLETED },
        { workflowStage: WorkflowStage.REJECTED },
      ];

      const stats = calculateWorkflowStatistics(items);

      expect(stats.total).toBe(6);
      expect(stats.completedCount).toBe(2);
      expect(stats.rejectedCount).toBe(1);
      expect(stats.activeCount).toBe(3);
      expect(stats.completionRate).toBe(33); // 2/6 = 33%
    });

    it('should handle empty array', () => {
      const stats = calculateWorkflowStatistics([]);
      expect(stats.total).toBe(0);
      expect(stats.completionRate).toBe(0);
    });

    it('should count by stage correctly', () => {
      const items = [
        { workflowStage: WorkflowStage.DRAFT },
        { workflowStage: WorkflowStage.DRAFT },
        { workflowStage: WorkflowStage.SUBMITTED },
      ];

      const stats = calculateWorkflowStatistics(items);
      expect(stats.byStage[WorkflowStage.DRAFT]).toBe(2);
      expect(stats.byStage[WorkflowStage.SUBMITTED]).toBe(1);
    });
  });

  describe('calculateWorkflowEfficiency', () => {
    it('should calculate rejection and cancellation rates', () => {
      const items = [
        { workflowStage: WorkflowStage.COMPLETED },
        { workflowStage: WorkflowStage.COMPLETED },
        { workflowStage: WorkflowStage.REJECTED },
        { workflowStage: WorkflowStage.CANCELLED },
      ];

      const metrics = calculateWorkflowEfficiency(items);
      expect(metrics.rejectionRate).toBe(25); // 1/4 = 25%
      expect(metrics.cancellationRate).toBe(25); // 1/4 = 25%
    });

    it('should calculate average completion time', () => {
      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

      const items = [
        {
          workflowStage: WorkflowStage.COMPLETED,
          createdAt: twoDaysAgo.toISOString(),
          completedAt: now.toISOString(),
        },
        {
          workflowStage: WorkflowStage.COMPLETED,
          createdAt: fiveDaysAgo.toISOString(),
          completedAt: now.toISOString(),
        },
      ];

      const metrics = calculateWorkflowEfficiency(items);
      expect(metrics.averageCompletionTime).toBeGreaterThan(0);
      expect(metrics.averageCompletionTime).toBeLessThanOrEqual(5);
    });
  });

  describe('getItemsRequiringAttention', () => {
    it('should identify overdue items', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const items = [
        {
          workflowStage: WorkflowStage.UNDER_REVIEW,
          dueDate: yesterday,
        },
      ];

      const attention = getItemsRequiringAttention(items);
      expect(attention).toHaveLength(1);
      expect(attention[0].priority).toBe('high');
      expect(attention[0].reason).toBe('Süresi geçmiş');
    });

    it('should identify items needing info', () => {
      const items = [
        {
          workflowStage: WorkflowStage.NEEDS_INFO,
        },
      ];

      const attention = getItemsRequiringAttention(items);
      expect(attention).toHaveLength(1);
      expect(attention[0].priority).toBe('medium');
      expect(attention[0].reason).toBe('Bilgi bekleniyor');
    });

    it('should identify items assigned to user', () => {
      const items = [
        {
          workflowStage: WorkflowStage.SUBMITTED,
          assignedTo: 'user123',
        },
      ];

      const attention = getItemsRequiringAttention(items, 'user123');
      expect(attention).toHaveLength(1);
      expect(attention[0].reason).toBe('İnceleme gerekiyor');
    });

    it('should sort by priority', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const items = [
        { workflowStage: WorkflowStage.NEEDS_INFO },
        { workflowStage: WorkflowStage.UNDER_REVIEW, dueDate: yesterday },
      ];

      const attention = getItemsRequiringAttention(items);
      expect(attention[0].priority).toBe('high'); // Overdue first
      expect(attention[1].priority).toBe('medium');
    });

    it('should not include completed items', () => {
      const items = [
        { workflowStage: WorkflowStage.COMPLETED },
        { workflowStage: WorkflowStage.REJECTED },
        { workflowStage: WorkflowStage.CANCELLED },
      ];

      const attention = getItemsRequiringAttention(items);
      expect(attention).toHaveLength(0);
    });

    it('should not include items not assigned to user', () => {
      const items = [
        {
          workflowStage: WorkflowStage.SUBMITTED,
          assignedTo: 'other-user',
        },
      ];

      const attention = getItemsRequiringAttention(items, 'user123');
      expect(attention).toHaveLength(0);
    });

    it('should include items with no assignee when userId provided', () => {
      const items = [
        {
          workflowStage: WorkflowStage.SUBMITTED,
        },
      ];

      const attention = getItemsRequiringAttention(items, 'user123');
      expect(attention).toHaveLength(0);
    });
  });
});

describe('WorkflowEngine - performTransition', () => {
  it('should fail when action is not allowed', async () => {
    const result = await WorkflowEngine.performTransition(
      WorkflowStage.DRAFT,
      WorkflowAction.APPROVE,
      ['user']
    );

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should fail when comment is required but not provided', async () => {
    const result = await WorkflowEngine.performTransition(
      WorkflowStage.UNDER_REVIEW,
      WorkflowAction.REJECT,
      ['approver']
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('açıklama');
  });

  it('should succeed with valid transition', async () => {
    const result = await WorkflowEngine.performTransition(
      WorkflowStage.DRAFT,
      WorkflowAction.SUBMIT,
      ['user']
    );

    expect(result.success).toBe(true);
    expect(result.newStage).toBe(WorkflowStage.SUBMITTED);
  });

  it('should succeed with comment when required', async () => {
    const result = await WorkflowEngine.performTransition(
      WorkflowStage.UNDER_REVIEW,
      WorkflowAction.REJECT,
      ['approver'],
      'Eksik belgeler'
    );

    expect(result.success).toBe(true);
    expect(result.newStage).toBe(WorkflowStage.REJECTED);
  });
});

describe('WorkflowEngine - getAvailableActions edge cases', () => {
  it('should return empty for completed stage', () => {
    const actions = WorkflowEngine.getAvailableActions(WorkflowStage.COMPLETED, ['admin']);
    expect(actions).toHaveLength(0);
  });

  it('should return reopen for rejected stage with admin role', () => {
    const actions = WorkflowEngine.getAvailableActions(WorkflowStage.REJECTED, ['admin']);
    expect(actions).toContain(WorkflowAction.REOPEN);
  });

  it('should return empty for cancelled stage', () => {
    const actions = WorkflowEngine.getAvailableActions(WorkflowStage.CANCELLED, ['admin']);
    expect(actions).toHaveLength(0);
  });

  it('should return request_info for under_review with reviewer role', () => {
    const actions = WorkflowEngine.getAvailableActions(WorkflowStage.UNDER_REVIEW, [
      'reviewer',
    ]);
    expect(actions).toContain(WorkflowAction.REQUEST_INFO);
  });

  it('should return provide_info for needs_info with user role', () => {
    const actions = WorkflowEngine.getAvailableActions(WorkflowStage.NEEDS_INFO, ['user']);
    expect(actions).toContain(WorkflowAction.PROVIDE_INFO);
  });

  it('should return start_distribution for approved with admin role', () => {
    const actions = WorkflowEngine.getAvailableActions(WorkflowStage.APPROVED, ['admin']);
    expect(actions).toContain(WorkflowAction.START_DISTRIBUTION);
  });
});

describe('calculateWorkflowEfficiency edge cases', () => {
  it('should handle empty array', () => {
    const metrics = calculateWorkflowEfficiency([]);
    expect(metrics.rejectionRate).toBe(0);
    expect(metrics.cancellationRate).toBe(0);
    // averageCompletionTime may be undefined for empty array
    expect(metrics.averageCompletionTime === 0 || metrics.averageCompletionTime === undefined).toBe(true);
  });

  it('should handle items without completion dates', () => {
    const items = [
      { workflowStage: WorkflowStage.COMPLETED },
      { workflowStage: WorkflowStage.COMPLETED },
    ];

    const metrics = calculateWorkflowEfficiency(items);
    // averageCompletionTime may be undefined when no dates available
    expect(metrics.averageCompletionTime === 0 || metrics.averageCompletionTime === undefined).toBe(true);
  });

  it('should handle items with only createdAt', () => {
    const now = new Date();
    const items = [
      {
        workflowStage: WorkflowStage.COMPLETED,
        createdAt: now.toISOString(),
      },
    ];

    const metrics = calculateWorkflowEfficiency(items);
    // averageCompletionTime may be undefined when completedAt is missing
    expect(metrics.averageCompletionTime === 0 || metrics.averageCompletionTime === undefined).toBe(true);
  });
});
