'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  WorkflowStage,
  WorkflowEngine,
  STAGE_LABELS,
} from '@/lib/beneficiary/workflow-engine';
import { Check, Circle, Clock } from 'lucide-react';

interface WorkflowStepperProps {
  currentStage: WorkflowStage;
  className?: string;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Workflow adımlarını gösteren stepper bileşeni
 */
export function WorkflowStepper({
  currentStage,
  className,
  showLabels = true,
  size = 'md',
}: WorkflowStepperProps) {
  const steps = WorkflowEngine.getWorkflowSteps();

  const sizeClasses = {
    sm: {
      container: 'gap-1',
      circle: 'h-6 w-6',
      icon: 'h-3 w-3',
      line: 'h-0.5',
      text: 'text-xs',
    },
    md: {
      container: 'gap-2',
      circle: 'h-8 w-8',
      icon: 'h-4 w-4',
      line: 'h-0.5',
      text: 'text-sm',
    },
    lg: {
      container: 'gap-3',
      circle: 'h-10 w-10',
      icon: 'h-5 w-5',
      line: 'h-1',
      text: 'text-base',
    },
  };

  const sizes = sizeClasses[size];

  // Özel durumlar için kontrol
  const isRejected = currentStage === WorkflowStage.REJECTED;
  const isCancelled = currentStage === WorkflowStage.CANCELLED;
  const isSpecialState = isRejected || isCancelled;

  return (
    <div className={cn('w-full', className)}>
      {/* Özel durumlar için badge */}
      {isSpecialState && (
        <div className="mb-4 flex justify-center">
          <Badge
            variant="secondary"
            className={cn(
              'text-sm font-medium',
              isRejected && 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
              isCancelled && 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
            )}
          >
            {STAGE_LABELS[currentStage].label}
          </Badge>
        </div>
      )}

      {/* Normal stepper */}
      <div className={cn('flex items-center justify-between', sizes.container)}>
        {steps.map((step, index) => {
          const isCompleted = WorkflowEngine.isStageCompleted(currentStage, step.stage);
          const isActive = WorkflowEngine.isStageActive(currentStage, step.stage);
          const isPending = !isCompleted && !isActive;

          return (
            <React.Fragment key={step.stage}>
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex items-center justify-center rounded-full border-2 transition-all',
                    sizes.circle,
                    isCompleted && 'border-green-500 bg-green-500 text-white',
                    isActive && 'border-primary bg-primary text-primary-foreground',
                    isPending && 'border-muted-foreground/30 bg-background text-muted-foreground/50'
                  )}
                >
                  {isCompleted ? (
                    <Check className={sizes.icon} />
                  ) : isActive ? (
                    <Clock className={sizes.icon} />
                  ) : (
                    <Circle className={cn(sizes.icon, 'fill-current')} />
                  )}
                </div>

                {/* Step label */}
                {showLabels && (
                  <span
                    className={cn(
                      'mt-2 text-center font-medium',
                      sizes.text,
                      isCompleted && 'text-green-600 dark:text-green-400',
                      isActive && 'text-primary',
                      isPending && 'text-muted-foreground/50'
                    )}
                  >
                    {step.label}
                  </span>
                )}
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 mx-2',
                    sizes.line,
                    isCompleted || WorkflowEngine.isStageCompleted(currentStage, steps[index + 1].stage)
                      ? 'bg-green-500'
                      : 'bg-muted-foreground/20'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Kompakt workflow badge
 */
interface WorkflowBadgeProps {
  stage: WorkflowStage;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function WorkflowBadge({ stage, showIcon = false, size = 'md' }: WorkflowBadgeProps) {
  const stageInfo = STAGE_LABELS[stage];

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <Badge variant="secondary" className={cn(stageInfo.color, sizeClasses[size])}>
      {showIcon && <Circle className="mr-1 h-2 w-2 fill-current" />}
      {stageInfo.label}
    </Badge>
  );
}
