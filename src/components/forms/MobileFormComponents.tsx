'use client';

import React, { forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Eye,
  EyeOff,
  X,
  ChevronDown,
  Search,
  Check,
  AlertCircle,
} from 'lucide-react';

/**
 * Mobil dostu form alanı wrapper'ı
 * Touch hedef boyutlarını artırır ve daha iyi erişilebilirlik sağlar
 */
interface MobileFormFieldProps {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function MobileFormField({
  label,
  description,
  error,
  required,
  children,
  className,
}: MobileFormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label className="text-base font-medium flex items-center gap-1">
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {children}
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Büyük dokunmatik hedefli input
 */
interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClear?: () => void;
}

export const MobileInput = forwardRef<HTMLInputElement, MobileInputProps>(
  ({ className, error, leftIcon, rightIcon, onClear, value, ...props }, ref) => {
    return (
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {leftIcon}
          </div>
        )}
        <Input
          ref={ref}
          value={value}
          className={cn(
            // Mobil için büyük dokunmatik hedef (min 44px)
            'h-12 text-base px-4',
            leftIcon && 'pl-10',
            (rightIcon || (value && onClear)) && 'pr-10',
            error && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          {...props}
        />
        {value && onClear ? (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted text-muted-foreground"
            aria-label="Temizle"
          >
            <X className="h-4 w-4" />
          </button>
        ) : rightIcon ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {rightIcon}
          </div>
        ) : null}
      </div>
    );
  }
);
MobileInput.displayName = 'MobileInput';

/**
 * Şifre göster/gizle özellikli input
 */
interface MobilePasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  error?: boolean;
}

export const MobilePasswordInput = forwardRef<
  HTMLInputElement,
  MobilePasswordInputProps
>(({ className, error, ...props }, ref) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Input
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        className={cn(
          'h-12 text-base px-4 pr-12',
          error && 'border-destructive focus-visible:ring-destructive',
          className
        )}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-muted text-muted-foreground"
        aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
      >
        {showPassword ? (
          <EyeOff className="h-5 w-5" />
        ) : (
          <Eye className="h-5 w-5" />
        )}
      </button>
    </div>
  );
});
MobilePasswordInput.displayName = 'MobilePasswordInput';

/**
 * Mobil dostu arama inputu
 */
interface MobileSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSearch?: () => void;
  className?: string;
}

export function MobileSearchInput({
  value,
  onChange,
  placeholder = 'Ara...',
  onSearch,
  className,
}: MobileSearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 text-base pl-10 pr-12"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onSearch) {
            onSearch();
          }
        }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted text-muted-foreground"
          aria-label="Aramayı temizle"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/**
 * Büyük dokunmatik textarea
 */
interface MobileTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  maxLength?: number;
  showCount?: boolean;
}

export const MobileTextarea = forwardRef<
  HTMLTextAreaElement,
  MobileTextareaProps
>(({ className, error, maxLength, showCount, value, ...props }, ref) => {
  const charCount = typeof value === 'string' ? value.length : 0;

  return (
    <div className="space-y-1">
      <Textarea
        ref={ref}
        value={value}
        maxLength={maxLength}
        className={cn(
          'min-h-[120px] text-base p-4 resize-none',
          error && 'border-destructive focus-visible:ring-destructive',
          className
        )}
        {...props}
      />
      {showCount && maxLength && (
        <p className="text-xs text-muted-foreground text-right">
          {charCount}/{maxLength}
        </p>
      )}
    </div>
  );
});
MobileTextarea.displayName = 'MobileTextarea';

/**
 * Mobil dostu select - full-screen modal görünümü
 */
interface MobileSelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface MobileSelectProps {
  value?: string;
  onChange: (value: string) => void;
  options: MobileSelectOption[];
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
  className?: string;
  searchable?: boolean;
}

export function MobileSelect({
  value,
  onChange,
  options,
  placeholder = 'Seçiniz...',
  error,
  disabled,
  className,
  searchable,
}: MobileSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = searchable
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        className={cn(
          'flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-4 text-base ring-offset-background',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-destructive',
          className
        )}
      >
        <span className={cn(!selectedOption && 'text-muted-foreground')}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown className="h-5 w-5 opacity-50" />
      </button>

      {/* Full-screen modal for mobile */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-background">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-background border-b">
            <div className="flex items-center justify-between p-4">
              <h2 className="text-lg font-semibold">{placeholder}</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsOpen(false);
                  setSearchQuery('');
                }}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            {searchable && (
              <div className="px-4 pb-4">
                <MobileSearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Ara..."
                />
              </div>
            )}
          </div>

          {/* Options */}
          <div className="overflow-y-auto pb-safe">
            {filteredOptions.length === 0 ? (
              <p className="p-4 text-center text-muted-foreground">
                Sonuç bulunamadı
              </p>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  disabled={option.disabled}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                  className={cn(
                    'flex w-full items-center justify-between p-4 border-b text-left',
                    'hover:bg-muted active:bg-muted/80',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    option.value === value && 'bg-primary/5'
                  )}
                >
                  <div>
                    <p className="text-base font-medium">{option.label}</p>
                    {option.description && (
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
                    )}
                  </div>
                  {option.value === value && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Mobil dostu çoklu seçim
 */
interface MobileMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: MobileSelectOption[];
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
  className?: string;
  maxSelections?: number;
}

export function MobileMultiSelect({
  value,
  onChange,
  options,
  placeholder = 'Seçiniz...',
  error,
  disabled,
  className,
  maxSelections,
}: MobileMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedOptions = options.filter((opt) => value.includes(opt.value));

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleOption = (optValue: string) => {
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue));
    } else if (!maxSelections || value.length < maxSelections) {
      onChange([...value, optValue]);
    }
  };

  const removeOption = (optValue: string) => {
    onChange(value.filter((v) => v !== optValue));
  };

  return (
    <>
      {/* Trigger */}
      <div
        onClick={() => !disabled && setIsOpen(true)}
        className={cn(
          'min-h-12 w-full rounded-md border border-input bg-background px-4 py-2',
          'focus-within:ring-2 focus-within:ring-ring',
          disabled && 'cursor-not-allowed opacity-50',
          error && 'border-destructive',
          className
        )}
      >
        {selectedOptions.length === 0 ? (
          <span className="text-muted-foreground leading-8">{placeholder}</span>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedOptions.map((opt) => (
              <Badge key={opt.value} variant="secondary" className="gap-1 py-1">
                {opt.label}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeOption(opt.value);
                  }}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Full-screen modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-background">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-background border-b">
            <div className="flex items-center justify-between p-4">
              <div>
                <h2 className="text-lg font-semibold">{placeholder}</h2>
                <p className="text-sm text-muted-foreground">
                  {value.length} seçili
                  {maxSelections && ` / max ${maxSelections}`}
                </p>
              </div>
              <Button
                onClick={() => {
                  setIsOpen(false);
                  setSearchQuery('');
                }}
              >
                Tamam
              </Button>
            </div>
            <div className="px-4 pb-4">
              <MobileSearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Ara..."
              />
            </div>
          </div>

          {/* Options */}
          <div className="overflow-y-auto pb-safe">
            {filteredOptions.map((option) => {
              const isSelected = value.includes(option.value);
              const isDisabled =
                option.disabled ||
                (!isSelected && !!maxSelections && value.length >= maxSelections);

              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => toggleOption(option.value)}
                  className={cn(
                    'flex w-full items-center gap-3 p-4 border-b text-left',
                    'hover:bg-muted active:bg-muted/80',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    isSelected && 'bg-primary/5'
                  )}
                >
                  <Checkbox checked={isSelected} disabled={isDisabled} />
                  <div className="flex-1">
                    <p className="text-base font-medium">{option.label}</p>
                    {option.description && (
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Mobil dostu on/off switch
 */
interface MobileSwitchFieldProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export function MobileSwitchField({
  checked,
  onChange,
  label,
  description,
  disabled,
  className,
}: MobileSwitchFieldProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 rounded-lg border',
        disabled && 'opacity-50',
        className
      )}
    >
      <div className="space-y-0.5 flex-1 mr-4">
        <Label className="text-base font-medium">{label}</Label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}

/**
 * Mobil dostu tarih seçici (native input kullanır)
 */
interface MobileDateInputProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  error?: boolean;
  min?: string;
  max?: string;
  disabled?: boolean;
  className?: string;
}

export function MobileDateInput({
  value,
  onChange,
  label,
  error,
  min,
  max,
  disabled,
  className,
}: MobileDateInputProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {label && <Label className="text-base font-medium">{label}</Label>}
      <Input
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        disabled={disabled}
        className={cn(
          'h-12 text-base px-4',
          error && 'border-destructive',
          // iOS/Safari için özel stil
          '[&::-webkit-calendar-picker-indicator]:p-2',
          '[&::-webkit-date-and-time-value]:text-left'
        )}
      />
    </div>
  );
}

/**
 * Mobil dostu telefon numarası inputu
 */
interface MobilePhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  placeholder?: string;
  className?: string;
}

export function MobilePhoneInput({
  value,
  onChange,
  error,
  placeholder = '5XX XXX XX XX',
  className,
}: MobilePhoneInputProps) {
  const formatPhone = (input: string) => {
    // Sadece rakamları al
    const digits = input.replace(/\D/g, '');
    
    // Türkiye formatı: 5XX XXX XX XX
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    if (digits.length <= 8)
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
  };

  return (
    <div className={cn('relative', className)}>
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
        +90
      </span>
      <Input
        type="tel"
        inputMode="numeric"
        value={formatPhone(value)}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, '');
          onChange(digits.slice(0, 10));
        }}
        placeholder={placeholder}
        className={cn(
          'h-12 text-base pl-14 pr-4',
          error && 'border-destructive'
        )}
        maxLength={14} // Formatted length with spaces
      />
    </div>
  );
}

/**
 * Mobil dostu TC Kimlik No inputu
 */
interface MobileTcKimlikInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  className?: string;
}

export function MobileTcKimlikInput({
  value,
  onChange,
  error,
  className,
}: MobileTcKimlikInputProps) {
  return (
    <Input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={value}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, '');
        onChange(digits.slice(0, 11));
      }}
      placeholder="XXXXXXXXXXX"
      maxLength={11}
      className={cn(
        'h-12 text-base px-4 tracking-widest',
        error && 'border-destructive',
        className
      )}
    />
  );
}

/**
 * Form action bar (sticky bottom)
 */
interface MobileFormActionsProps {
  onSubmit?: () => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  isValid?: boolean;
  className?: string;
}

export function MobileFormActions({
  onSubmit,
  onCancel,
  submitLabel = 'Kaydet',
  cancelLabel = 'İptal',
  isSubmitting,
  isValid = true,
  className,
}: MobileFormActionsProps) {
  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 bg-background border-t p-4 pb-safe',
        'flex gap-3',
        className
      )}
    >
      {onCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 h-12 text-base"
        >
          {cancelLabel}
        </Button>
      )}
      <Button
        type="submit"
        onClick={onSubmit}
        disabled={isSubmitting || !isValid}
        className="flex-1 h-12 text-base"
      >
        {isSubmitting ? 'Kaydediliyor...' : submitLabel}
      </Button>
    </div>
  );
}
