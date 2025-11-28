/**
 * Form Component Types
 * Provides type-safe definitions for all form-related components in the application
 */

import type { ReactNode } from 'react';
import type { FieldValues, UseFormReturn, FieldPath } from 'react-hook-form';

/**
 * Base form field props that all form fields should extend
 */
export interface BaseFormFieldProps<
  T extends FieldValues = FieldValues,
  K extends FieldPath<T> = FieldPath<T>,
> {
  /**
   * Field name/path in the form
   */
  name: K;
  /**
   * Field label displayed to user
   */
  label?: ReactNode;
  /**
   * Field description/help text
   */
  description?: ReactNode;
  /**
   * Is field required
   */
  required?: boolean;
  /**
   * Is field disabled
   */
  disabled?: boolean;
  /**
   * Custom CSS class name
   */
  className?: string;
}

/**
 * Text input field props
 */
export interface TextFieldProps<
  T extends FieldValues = FieldValues,
  K extends FieldPath<T> = FieldPath<T>,
> extends BaseFormFieldProps<T, K> {
  /**
   * Input type (text, email, password, etc)
   */
  type?: 'text' | 'email' | 'password' | 'url' | 'number';
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Maximum length
   */
  maxLength?: number;
  /**
   * Input pattern for validation
   */
  pattern?: string;
}

/**
 * Select dropdown field props
 */
export interface SelectFieldProps<
  T extends FieldValues = FieldValues,
  K extends FieldPath<T> = FieldPath<T>,
> extends BaseFormFieldProps<T, K> {
  /**
   * Available options
   */
  options: Array<{
    value: string | number;
    label: ReactNode;
  }>;
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Allow multiple selections
   */
  multiple?: boolean;
  /**
   * Is clearable
   */
  clearable?: boolean;
}

/**
 * Textarea field props
 */
export interface TextareaFieldProps<
  T extends FieldValues = FieldValues,
  K extends FieldPath<T> = FieldPath<T>,
> extends BaseFormFieldProps<T, K> {
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Number of visible rows
   */
  rows?: number;
  /**
   * Maximum length
   */
  maxLength?: number;
}

/**
 * Date picker field props
 */
export interface DateFieldProps<
  T extends FieldValues = FieldValues,
  K extends FieldPath<T> = FieldPath<T>,
> extends BaseFormFieldProps<T, K> {
  /**
   * Minimum date
   */
  minDate?: Date;
  /**
   * Maximum date
   */
  maxDate?: Date;
  /**
   * Date format string
   */
  format?: string;
  /**
   * Allow time selection
   */
  showTime?: boolean;
}

/**
 * Checkbox field props
 */
export interface CheckboxFieldProps<
  T extends FieldValues = FieldValues,
  K extends FieldPath<T> = FieldPath<T>,
> extends BaseFormFieldProps<T, K> {
  /**
   * Checkbox label (instead of external label)
   */
  checkboxLabel?: ReactNode;
}

/**
 * Radio group field props
 */
export interface RadioFieldProps<
  T extends FieldValues = FieldValues,
  K extends FieldPath<T> = FieldPath<T>,
> extends BaseFormFieldProps<T, K> {
  /**
   * Available options
   */
  options: Array<{
    value: string | number;
    label: ReactNode;
  }>;
  /**
   * Stack options vertically
   */
  vertical?: boolean;
}

/**
 * File upload field props
 */
export interface FileFieldProps<
  T extends FieldValues = FieldValues,
  K extends FieldPath<T> = FieldPath<T>,
> extends BaseFormFieldProps<T, K> {
  /**
   * Accepted file types
   */
  accept?: string;
  /**
   * Allow multiple file selection
   */
  multiple?: boolean;
  /**
   * Maximum file size in bytes
   */
  maxSize?: number;
}

/**
 * Form container props
 */
export interface FormContainerProps<T extends FieldValues = FieldValues> {
  /**
   * React Hook Form instance
   */
  form: UseFormReturn<T>;
  /**
   * Form submission handler
   */
  onSubmit: (data: T) => void | Promise<void>;
  /**
   * Form contents
   */
  children: ReactNode;
  /**
   * Submit button label
   */
  submitLabel?: ReactNode;
  /**
   * Cancel button label
   */
  cancelLabel?: ReactNode;
  /**
   * Cancel button handler
   */
  onCancel?: () => void;
  /**
   * Is form submitting
   */
  isSubmitting?: boolean;
  /**
   * Show submit button
   */
  showSubmit?: boolean;
  /**
   * Show cancel button
   */
  showCancel?: boolean;
  /**
   * Button layout direction
   */
  buttonLayout?: 'horizontal' | 'vertical';
  /**
   * Custom CSS class name
   */
  className?: string;
}

/**
 * Wizard step configuration
 */
export interface WizardStep<T extends FieldValues = FieldValues> {
  /**
   * Step identifier
   */
  id: string;
  /**
   * Step title
   */
  title: ReactNode;
  /**
   * Step description
   */
  description?: ReactNode;
  /**
   * Step contents
   */
  content: ReactNode;
  /**
   * Validate step before proceeding
   */
  validate?: (data: Partial<T>) => boolean | Promise<boolean>;
  /**
   * Optional callback when entering step
   */
  onEnter?: (data: Partial<T>) => void;
  /**
   * Optional callback when leaving step
   */
  onExit?: (data: Partial<T>) => void;
}

/**
 * Form wizard props
 */
export interface FormWizardProps<T extends FieldValues = FieldValues> {
  /**
   * React Hook Form instance
   */
  form: UseFormReturn<T>;
  /**
   * Wizard steps
   */
  steps: WizardStep<T>[];
  /**
   * Current active step index
   */
  activeStepIndex?: number;
  /**
   * On step change handler
   */
  onStepChange?: (stepIndex: number) => void;
  /**
   * Form submission handler
   */
  onSubmit: (data: T) => void | Promise<void>;
  /**
   * Is form submitting
   */
  isSubmitting?: boolean;
  /**
   * Allow previous step
   */
  allowPrevious?: boolean;
}

/**
 * Form field error message props
 */
export interface FormErrorProps {
  /**
   * Error message
   */
  message?: ReactNode;
  /**
   * Custom CSS class
   */
  className?: string;
}

/**
 * Form field help text props
 */
export interface FormHelpTextProps {
  /**
   * Help text content
   */
  children: ReactNode;
  /**
   * Custom CSS class
   */
  className?: string;
}

/**
 * Form field wrapper props
 */
export interface FormFieldWrapperProps {
  /**
   * Field label
   */
  label?: ReactNode;
  /**
   * Field description
   */
  description?: ReactNode;
  /**
   * Error message
   */
  error?: ReactNode;
  /**
   * Is field required
   */
  required?: boolean;
  /**
   * Field contents
   */
  children: ReactNode;
  /**
   * Custom CSS class
   */
  className?: string;
}

/**
 * Dynamic form field configuration
 */
export interface DynamicFormFieldConfig<
  T extends FieldValues = FieldValues,
  K extends FieldPath<T> = FieldPath<T>,
> {
  /**
   * Field name
   */
  name: K;
  /**
   * Field type
   */
  type:
    | 'text'
    | 'email'
    | 'password'
    | 'number'
    | 'textarea'
    | 'select'
    | 'multiselect'
    | 'date'
    | 'datetime'
    | 'checkbox'
    | 'radio'
    | 'file'
    | 'custom';
  /**
   * Field label
   */
  label?: ReactNode;
  /**
   * Field description
   */
  description?: ReactNode;
  /**
   * Is field required
   */
  required?: boolean;
  /**
   * Is field disabled
   */
  disabled?: boolean;
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Select options
   */
  options?: Array<{
    value: string | number;
    label: ReactNode;
  }>;
  /**
   * Custom validation function
   */
  validate?: (value: unknown) => boolean | string;
  /**
   * Field-specific configuration
   */
  config?: Record<string, unknown>;
}

/**
 * Dynamic form props
 */
export interface DynamicFormProps<T extends FieldValues = FieldValues> {
  /**
   * Form fields configuration
   */
  fields: DynamicFormFieldConfig<T>[];
  /**
   * Default form values
   */
  defaultValues?: Partial<T>;
  /**
   * Form submission handler
   */
  onSubmit: (data: T) => void | Promise<void>;
  /**
   * Is form submitting
   */
  isSubmitting?: boolean;
  /**
   * Submit button label
   */
  submitLabel?: ReactNode;
  /**
   * Cancel button handler
   */
  onCancel?: () => void;
}

/**
 * Form validation error details
 */
export interface FormValidationError {
  /**
   * Error field name
   */
  field: string;
  /**
   * Error message
   */
  message: string;
  /**
   * Error type
   */
  type?: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'validate' | 'min' | 'max' | 'custom';
}

/**
 * Form state
 */
export interface FormState<T extends FieldValues = FieldValues> {
  /**
   * Is form dirty
   */
  isDirty: boolean;
  /**
   * Is form valid
   */
  isValid: boolean;
  /**
   * Is form submitting
   */
  isSubmitting: boolean;
  /**
   * Validation errors
   */
  errors: Partial<Record<keyof T, FormValidationError>>;
  /**
   * Touched fields
   */
  touched: Partial<Record<keyof T, boolean>>;
}
