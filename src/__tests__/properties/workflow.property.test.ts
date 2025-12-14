/**
 * Workflow Property Tests
 * Property-based tests for workflow state machine
 * 
 * @module properties/workflow
 */

import { describe, it, expect } from 'vitest';
import { test, fc } from '@fast-check/vitest';
import {
  WorkflowEngine,
  WorkflowStage,
  WorkflowAction,
  WORKFLOW_TRANSITIONS,
  calculateWorkflowStatistics,
  calculateWorkflowEfficiency,
} from '@/lib/beneficiary/workflow-engine';

// Generators for workflow testing
const validWorkflowStage = fc.constantFrom(
  WorkflowStage.DRAFT,
  WorkflowStage.SUBMITTED,
  WorkflowStage.UNDER_REVIEW,
  WorkflowStage.NEEDS_INFO,
  WorkflowStage.APPROVED,
  WorkflowStage.REJECTED,
  WorkflowStage.IN_DISTRIBUTION,
  WorkflowStage.COMPLETED,
  WorkflowStage.CANCELLED
);

const validWorkflowAction = fc.constantFrom(
  WorkflowAction.SUBMIT,
  WorkflowAction.START_REVIEW,
  WorkflowAction.REQUEST_INFO,
  WorkflowAction.PROVIDE_INFO,
  WorkflowAction.APPROVE,
  WorkflowAction.REJECT,
  WorkflowAction.START_DISTRIBUTION,
  WorkflowAction.COMPLETE,
  WorkflowAction.CANCEL,
  WorkflowAction.REOPEN
);

const validUserRoles = fc.uniqueArray(
  fc.constantFrom('user', 'editor', 'reviewer', 'approver', 'distributor', 'admin'),
  { minLength: 1, maxLength: 3 }
);

describe('Workflow Property Tests', () => {
  /**
   * **Feature: code-quality-improvement, Property 8: Workflow State Machine Validity**
   * **Validates: Requirements 5.1**
   * 
   * For any beneficiary with status S, only transitions defined in the
   * state machine SHALL be allowed.
   */
  describe('Property 8: Workflow State Machine Validity', () => {
    test.prop([validWorkflowStage, validWorkflowAction, validUserRoles], { numRuns: 100 })(
      'only defined transitions are allowed',
      (currentStage, action, userRoles) => {
        const result = WorkflowEngine.canPerformAction(currentStage, action, userRoles);
        
        // Find if this transition is defined
        const transitionExists = WORKFLOW_TRANSITIONS.some(
          t => t.from === currentStage && t.action === action
        );
        
        if (!transitionExists) {
          // If transition doesn't exist, it should not be allowed
          expect(result.allowed).toBe(false);
          expect(result.reason).toBeDefined();
        }
        // If transition exists, it may or may not be allowed based on roles
      }
    );

    it('should only allow transitions from defined source stages', () => {
      // COMPLETED and CANCELLED are terminal states - no transitions out
      const terminalStages = [WorkflowStage.COMPLETED, WorkflowStage.CANCELLED];
      const allActions = Object.values(WorkflowAction);
      const adminRoles = ['admin'];

      terminalStages.forEach(stage => {
        allActions.forEach(action => {
          const result = WorkflowEngine.canPerformAction(stage, action, adminRoles);
          
          // Check if any transition is defined from this stage
          const hasTransition = WORKFLOW_TRANSITIONS.some(
            t => t.from === stage && t.action === action
          );
          
          if (!hasTransition) {
            expect(result.allowed).toBe(false);
          }
        });
      });
    });

    it('should validate all defined transitions exist in WORKFLOW_TRANSITIONS', () => {
      // Every transition should have valid from and to stages
      WORKFLOW_TRANSITIONS.forEach(transition => {
        expect(Object.values(WorkflowStage)).toContain(transition.from);
        expect(Object.values(WorkflowStage)).toContain(transition.to);
        expect(Object.values(WorkflowAction)).toContain(transition.action);
      });
    });
  });


  /**
   * **Feature: code-quality-improvement, Property 9: Workflow Transition Determinism**
   * **Validates: Requirements 5.2**
   * 
   * For any beneficiary data and transition attempt, the workflow engine
   * SHALL produce the same result for identical inputs.
   */
  describe('Property 9: Workflow Transition Determinism', () => {
    test.prop([validWorkflowStage, validWorkflowAction, validUserRoles], { numRuns: 100 })(
      'same inputs produce same results',
      (currentStage, action, userRoles) => {
        // Call canPerformAction twice with same inputs
        const result1 = WorkflowEngine.canPerformAction(currentStage, action, userRoles);
        const result2 = WorkflowEngine.canPerformAction(currentStage, action, userRoles);
        
        // Results should be identical
        expect(result1.allowed).toBe(result2.allowed);
        expect(result1.reason).toBe(result2.reason);
      }
    );

    test.prop([validWorkflowStage, validUserRoles], { numRuns: 50 })(
      'getAvailableActions is deterministic',
      (currentStage, userRoles) => {
        const actions1 = WorkflowEngine.getAvailableActions(currentStage, userRoles);
        const actions2 = WorkflowEngine.getAvailableActions(currentStage, userRoles);
        
        // Should return same actions in same order
        expect(actions1).toEqual(actions2);
      }
    );
  });

  /**
   * Additional workflow tests
   */
  describe('Role-Based Access Control', () => {
    it('should require appropriate roles for transitions', () => {
      // APPROVE action requires 'approver' or 'admin' role
      const underReview = WorkflowStage.UNDER_REVIEW;
      const approveAction = WorkflowAction.APPROVE;
      
      // User without approver role should not be able to approve
      const userRoles = ['user', 'editor'];
      const result = WorkflowEngine.canPerformAction(underReview, approveAction, userRoles);
      expect(result.allowed).toBe(false);
      
      // User with approver role should be able to approve
      const approverRoles = ['approver'];
      const approverResult = WorkflowEngine.canPerformAction(underReview, approveAction, approverRoles);
      expect(approverResult.allowed).toBe(true);
      
      // Admin should always be able to approve
      const adminRoles = ['admin'];
      const adminResult = WorkflowEngine.canPerformAction(underReview, approveAction, adminRoles);
      expect(adminResult.allowed).toBe(true);
    });

    it('should allow admin to perform most actions', () => {
      const adminRoles = ['admin'];
      
      // Admin should be able to submit from draft
      expect(
        WorkflowEngine.canPerformAction(WorkflowStage.DRAFT, WorkflowAction.SUBMIT, adminRoles).allowed
      ).toBe(true);
      
      // Admin should be able to approve from under_review
      expect(
        WorkflowEngine.canPerformAction(WorkflowStage.UNDER_REVIEW, WorkflowAction.APPROVE, adminRoles).allowed
      ).toBe(true);
      
      // Admin should be able to cancel from submitted
      expect(
        WorkflowEngine.canPerformAction(WorkflowStage.SUBMITTED, WorkflowAction.CANCEL, adminRoles).allowed
      ).toBe(true);
    });
  });

  describe('Invalid Transition Rejection', () => {
    it('should reject invalid transitions with clear error messages', () => {
      const adminRoles = ['admin'];
      
      // Cannot approve from DRAFT (must go through SUBMITTED first)
      const result = WorkflowEngine.canPerformAction(
        WorkflowStage.DRAFT,
        WorkflowAction.APPROVE,
        adminRoles
      );
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toBeDefined();
      expect(typeof result.reason).toBe('string');
      expect(result.reason!.length).toBeGreaterThan(0);
    });

    it('should not allow transitions from terminal states', () => {
      const adminRoles = ['admin'];
      
      // Cannot do anything from COMPLETED
      const completedResult = WorkflowEngine.canPerformAction(
        WorkflowStage.COMPLETED,
        WorkflowAction.SUBMIT,
        adminRoles
      );
      expect(completedResult.allowed).toBe(false);
      
      // Cannot do anything from CANCELLED (except what's defined)
      const cancelledResult = WorkflowEngine.canPerformAction(
        WorkflowStage.CANCELLED,
        WorkflowAction.APPROVE,
        adminRoles
      );
      expect(cancelledResult.allowed).toBe(false);
    });
  });

  describe('Workflow Statistics', () => {
    test.prop([
      fc.array(
        fc.record({
          workflowStage: validWorkflowStage,
          createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString()),
        }),
        { minLength: 0, maxLength: 50 }
      ),
    ], { numRuns: 50 })(
      'statistics calculation is consistent',
      (items) => {
        const stats = calculateWorkflowStatistics(items);
        
        // Total should match input length
        expect(stats.total).toBe(items.length);
        
        // Sum of all stages should equal total
        const stageSum = Object.values(stats.byStage).reduce((a, b) => a + b, 0);
        expect(stageSum).toBe(items.length);
        
        // Active + completed + rejected + cancelled should equal total
        expect(
          stats.activeCount + stats.completedCount + stats.rejectedCount + stats.cancelledCount
        ).toBe(items.length);
        
        // Completion rate should be between 0 and 100
        expect(stats.completionRate).toBeGreaterThanOrEqual(0);
        expect(stats.completionRate).toBeLessThanOrEqual(100);
      }
    );
  });

  describe('Workflow Efficiency Metrics', () => {
    it('should calculate rejection and cancellation rates correctly', () => {
      const items = [
        { workflowStage: WorkflowStage.COMPLETED },
        { workflowStage: WorkflowStage.COMPLETED },
        { workflowStage: WorkflowStage.REJECTED },
        { workflowStage: WorkflowStage.CANCELLED },
        { workflowStage: WorkflowStage.UNDER_REVIEW },
      ];
      
      const metrics = calculateWorkflowEfficiency(items);
      
      // 1 rejected out of 5 = 20%
      expect(metrics.rejectionRate).toBe(20);
      
      // 1 cancelled out of 5 = 20%
      expect(metrics.cancellationRate).toBe(20);
    });

    it('should handle empty items array', () => {
      const metrics = calculateWorkflowEfficiency([]);
      
      expect(metrics.rejectionRate).toBe(0);
      expect(metrics.cancellationRate).toBe(0);
    });
  });

  describe('Stage Order and Completion', () => {
    it('should correctly determine stage order', () => {
      expect(WorkflowEngine.getStageOrder(WorkflowStage.DRAFT)).toBe(1);
      expect(WorkflowEngine.getStageOrder(WorkflowStage.SUBMITTED)).toBe(2);
      expect(WorkflowEngine.getStageOrder(WorkflowStage.UNDER_REVIEW)).toBe(3);
      expect(WorkflowEngine.getStageOrder(WorkflowStage.APPROVED)).toBe(4);
      expect(WorkflowEngine.getStageOrder(WorkflowStage.IN_DISTRIBUTION)).toBe(5);
      expect(WorkflowEngine.getStageOrder(WorkflowStage.COMPLETED)).toBe(6);
    });

    it('should correctly identify completed stages', () => {
      // When current stage is APPROVED (order 4), DRAFT (order 1) should be completed
      expect(
        WorkflowEngine.isStageCompleted(WorkflowStage.APPROVED, WorkflowStage.DRAFT)
      ).toBe(true);
      
      // When current stage is APPROVED (order 4), COMPLETED (order 6) should not be completed
      expect(
        WorkflowEngine.isStageCompleted(WorkflowStage.APPROVED, WorkflowStage.COMPLETED)
      ).toBe(false);
    });

    it('should correctly identify active stage', () => {
      expect(
        WorkflowEngine.isStageActive(WorkflowStage.UNDER_REVIEW, WorkflowStage.UNDER_REVIEW)
      ).toBe(true);
      
      expect(
        WorkflowEngine.isStageActive(WorkflowStage.UNDER_REVIEW, WorkflowStage.DRAFT)
      ).toBe(false);
    });
  });
});
