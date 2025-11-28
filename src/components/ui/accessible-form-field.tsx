'use client';

import React, { forwardRef, ReactNode, useId } from 'react';
import { cn } from '@/lib/utils';

interface AccessibleFormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}

/**
 * Accessible form field wrapper with proper labels, hints, and error messages
 * Improves accessibility and UX for all form inputs
 */
export const AccessibleFormField = forwardRef<HTMLDivElement, AccessibleFormFieldProps>(
  ({ label, error, hint, required, disabled, children, className, htmlFor }, ref) => {
    // Sanitize htmlFor to prevent XSS in ID generation
    const sanitizedHtmlFor = htmlFor ? htmlFor.replace(/[^a-zA-Z0-9_-]/g, '') : 'field';
    const errorId = error ? `${sanitizedHtmlFor}-error` : undefined;
    const hintId = hint ? `${sanitizedHtmlFor}-hint` : undefined;
    const ariaDescribedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

    return (
      <div ref={ref} className={cn('space-y-2', disabled && 'opacity-60', className)}>
        {label && (
          <label
            htmlFor={htmlFor}
            className={cn('block text-sm font-medium text-slate-900', disabled && 'text-slate-500')}
          >
            {label}
            {required && (
              <span
                className="ml-1 text-red-600"
                aria-label="required field"
                title="This field is required"
              >
                *
              </span>
            )}
          </label>
        )}

        <div
          role="group"
          aria-describedby={ariaDescribedBy}
          aria-invalid={!!error}
          aria-disabled={disabled}
        >
          {children}
        </div>

        {hint && !error && (
          <p id={hintId} className="text-xs text-slate-500">
            {hint}
          </p>
        )}

        {error && (
          <p id={errorId} className="text-xs text-red-600 font-medium" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

AccessibleFormField.displayName = 'AccessibleFormField';

interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
  ({ label, error, hint, className, id, required, disabled, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || `input-${generatedId}`;

    if (label) {
      return (
        <AccessibleFormField
          label={label}
          error={error}
          hint={hint}
          required={required}
          disabled={disabled}
          htmlFor={inputId}
        >
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-disabled={disabled}
            className={cn(
              'w-full px-3 py-2 border border-slate-300 rounded-lg',
              'text-sm transition-colors duration-200',
              'bg-white text-slate-900 placeholder:text-slate-400',
              'focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500',
              'hover:border-slate-400',
              error && 'border-red-600 focus:ring-red-500/50 focus:border-red-600',
              disabled &&
                'bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed hover:border-slate-200',
              className
            )}
            disabled={disabled}
            {...props}
          />
        </AccessibleFormField>
      );
    }

    return (
      <input
        ref={ref}
        id={inputId}
        aria-invalid={!!error}
        aria-disabled={disabled}
        className={cn(
          'w-full px-3 py-2 border border-slate-300 rounded-lg',
          'text-sm transition-colors duration-200',
          'bg-white text-slate-900 placeholder:text-slate-400',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500',
          'hover:border-slate-400',
          error && 'border-red-600 focus:ring-red-500/50 focus:border-red-600',
          disabled &&
            'bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed hover:border-slate-200',
          className
        )}
        disabled={disabled}
        {...props}
      />
    );
  }
);

AccessibleInput.displayName = 'AccessibleInput';

interface AccessibleSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: Array<{ value: string; label: string }>;
}

export const AccessibleSelect = forwardRef<HTMLSelectElement, AccessibleSelectProps>(
  ({ label, error, hint, options, className, id, required, disabled, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id || `select-${generatedId}`;

    if (label) {
      return (
        <AccessibleFormField
          label={label}
          error={error}
          hint={hint}
          required={required}
          disabled={disabled}
          htmlFor={selectId}
        >
          <select
            ref={ref}
            id={selectId}
            aria-invalid={!!error}
            aria-disabled={disabled}
            className={cn(
              'w-full px-3 py-2 border border-slate-300 rounded-lg',
              'text-sm transition-colors duration-200',
              'bg-white text-slate-900',
              'focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500',
              'hover:border-slate-400',
              error && 'border-red-600 focus:ring-red-500/50 focus:border-red-600',
              disabled &&
                'bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed hover:border-slate-200',
              className
            )}
            disabled={disabled}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </AccessibleFormField>
      );
    }

    return (
      <select
        ref={ref}
        id={selectId}
        aria-invalid={!!error}
        aria-disabled={disabled}
        className={cn(
          'w-full px-3 py-2 border border-slate-300 rounded-lg',
          'text-sm transition-colors duration-200',
          'bg-white text-slate-900',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500',
          'hover:border-slate-400',
          error && 'border-red-600 focus:ring-red-500/50 focus:border-red-600',
          disabled &&
            'bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed hover:border-slate-200',
          className
        )}
        disabled={disabled}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }
);

AccessibleSelect.displayName = 'AccessibleSelect';
