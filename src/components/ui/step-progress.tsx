'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

export interface Step {
  id: string;
  label: string;
  icon?: LucideIcon;
}

export interface StepProgressProps {
  steps: Step[];
  currentStep: number;
  completedSteps: number[];
  variant?: 'linear' | 'circular';
  showLabels?: boolean;
  className?: string;
}

export function StepProgress({
  steps,
  currentStep,
  completedSteps,
  variant = 'linear',
  showLabels = true,
  className,
}: StepProgressProps) {
  const progress = (completedSteps.length / steps.length) * 100;

  if (variant === 'circular') {
    return (
      <div className={cn('flex flex-col items-center justify-center', className)}>
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-muted"
            />
            {/* Progress circle */}
            <motion.circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              className="text-primary"
              initial={{ strokeDashoffset: 352 }}
              animate={{
                strokeDashoffset: 352 - (352 * progress) / 100,
              }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              style={{
                strokeDasharray: 352,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <motion.p
                key={progress}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-2xl font-heading font-bold text-foreground"
              >
                {Math.round(progress)}%
              </motion.p>
              <p className="text-xs text-muted-foreground">Tamamlandı</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Progress bar */}
      <div className="mb-4">
        <Progress
          value={progress}
          variant={progress === 100 ? 'success' : 'default'}
          className="h-2"
        />
        <p className="text-xs text-muted-foreground mt-1 text-right font-body">
          {completedSteps.length} / {steps.length} adım tamamlandı
        </p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(index);
          const isCurrent = currentStep === index;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex flex-col items-center flex-1">
              {/* Connector line (not for first step) */}
              {index > 0 && (
                <div
                  className={cn(
                    'absolute h-0.5 -ml-[50%] w-full -mt-5',
                    completedSteps.includes(index - 1) || isCompleted ? 'bg-success' : 'bg-muted'
                  )}
                  style={{ zIndex: 0 }}
                />
              )}

              {/* Step circle */}
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? 1.1 : 1,
                }}
                className="relative z-10"
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300',
                    isCompleted && 'bg-success text-success-foreground',
                    isCurrent && !isCompleted && 'bg-primary text-primary-foreground animate-pulse',
                    !isCompleted && !isCurrent && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : Icon ? (
                    <Icon className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-heading font-medium">{index + 1}</span>
                  )}
                </div>
              </motion.div>

              {/* Step label */}
              {showLabels && (
                <p
                  className={cn(
                    'mt-2 text-xs font-heading font-medium text-center max-w-[80px]',
                    isCurrent && 'text-foreground font-semibold',
                    !isCurrent && 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
