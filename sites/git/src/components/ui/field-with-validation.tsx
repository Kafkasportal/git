'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/**
 * Validation state for form fields
 */
export type FieldValidationState = 'valid' | 'invalid' | 'pending' | undefined;

export interface FieldWithValidationProps {
  /** Label text for the field */
  label: string;
  /** Error message to display */
  error?: string;
  /** Current validation state of the field */
  validation?: FieldValidationState;
  /** Whether the field is required */
  required?: boolean;
  /** Child elements (usually form input) */
  children: React.ReactNode;
  /** ID for the error message element (for aria-describedby) */
  errorId?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Field wrapper component that displays validation state with icons
 * Used to wrap form inputs and show real-time validation feedback
 * 
 * @example
 * ```tsx
 * <FieldWithValidation
 *   label="Email"
 *   error={errors.email?.message}
 *   validation={fieldValidation.email}
 *   required
 *   errorId="email-error"
 * >
 *   <Input {...register('email')} />
 * </FieldWithValidation>
 * ```
 */
export function FieldWithValidation({
  label,
  error,
  validation,
  required,
  children,
  errorId,
  className,
}: FieldWithValidationProps) {
  const getValidationIcon = () => {
    switch (validation) {
      case 'valid':
        return <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden="true" />;
      case 'invalid':
        return <XCircle className="h-4 w-4 text-red-600" aria-hidden="true" />;
      default:
        return null;
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Label
        className={cn(
          required && "after:content-['*'] after:text-red-500 after:ml-1"
        )}
      >
        {label}
      </Label>
      <div className="relative">
        {children}
        <div 
          className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"
          aria-hidden="true"
        >
          {getValidationIcon()}
        </div>
      </div>
      {error && (
        <p
          id={errorId}
          className="text-sm text-red-600 flex items-center gap-1"
          role="alert"
        >
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
