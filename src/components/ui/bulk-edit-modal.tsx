'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Loader2, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BulkEditField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'checkbox' | 'date' | 'number';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface BulkEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  fields: BulkEditField[];
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
  title?: string;
  description?: string;
}

export function BulkEditModal({
  open,
  onOpenChange,
  selectedCount,
  fields,
  onSubmit,
  title = 'Toplu Düzenleme',
  description,
}: BulkEditModalProps) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [enabledFields, setEnabledFields] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFieldToggle = (key: string) => {
    const newEnabled = new Set(enabledFields);
    if (newEnabled.has(key)) {
      newEnabled.delete(key);
      const newValues = { ...values };
      delete newValues[key];
      setValues(newValues);
    } else {
      newEnabled.add(key);
    }
    setEnabledFields(newEnabled);
  };

  const handleValueChange = (key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (enabledFields.size === 0) return;

    setIsLoading(true);
    setError(null);
    setSuccess(false);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      await onSubmit(values);

      clearInterval(progressInterval);
      setProgress(100);
      setSuccess(true);

      // Close after success
      setTimeout(() => {
        onOpenChange(false);
        resetForm();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
      setProgress(0);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = useCallback(() => {
    setValues({});
    setEnabledFields(new Set());
    setProgress(0);
    setError(null);
    setSuccess(false);
  }, []);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  const enabledCount = enabledFields.size;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {title}
            <span className="text-sm font-normal text-muted-foreground">
              ({selectedCount} öğe)
            </span>
          </DialogTitle>
          <DialogDescription>
            {description || `${selectedCount} öğe için değişiklik yapılacak. Güncellemek istediğiniz alanları seçin.`}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Warning */}
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">Dikkat</p>
              <p className="mt-1">
                Bu işlem seçili tüm kayıtları etkileyecektir. Devam etmeden önce seçimlerinizi kontrol edin.
              </p>
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-4">
            {fields.map((field) => (
              <div
                key={field.key}
                className={cn(
                  'p-3 border rounded-lg transition-colors',
                  enabledFields.has(field.key)
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border'
                )}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={`enable-${field.key}`}
                    checked={enabledFields.has(field.key)}
                    onCheckedChange={() => handleFieldToggle(field.key)}
                  />
                  <Label
                    htmlFor={`enable-${field.key}`}
                    className="flex-1 cursor-pointer font-medium"
                  >
                    {field.label}
                  </Label>
                </div>

                {enabledFields.has(field.key) && (
                  <div className="mt-3 pl-7">
                    {field.type === 'text' && (
                      <Input
                        placeholder={field.placeholder}
                        value={(values[field.key] as string) || ''}
                        onChange={(e) => handleValueChange(field.key, e.target.value)}
                      />
                    )}

                    {field.type === 'number' && (
                      <Input
                        type="number"
                        placeholder={field.placeholder}
                        value={(values[field.key] as number) || ''}
                        onChange={(e) => handleValueChange(field.key, parseFloat(e.target.value))}
                      />
                    )}

                    {field.type === 'date' && (
                      <Input
                        type="date"
                        value={(values[field.key] as string) || ''}
                        onChange={(e) => handleValueChange(field.key, e.target.value)}
                      />
                    )}

                    {field.type === 'select' && (
                      <Select
                        value={(values[field.key] as string) || ''}
                        onValueChange={(v) => handleValueChange(field.key, v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={field.placeholder || 'Seçiniz...'} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {field.type === 'checkbox' && (
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`value-${field.key}`}
                          checked={(values[field.key] as boolean) || false}
                          onCheckedChange={(checked) => handleValueChange(field.key, checked)}
                        />
                        <Label htmlFor={`value-${field.key}`}>
                          {field.placeholder || 'Evet'}
                        </Label>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Progress */}
          {isLoading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">İşleniyor...</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Tüm kayıtlar başarıyla güncellendi!</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
              <XCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            İptal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || enabledCount === 0 || success}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                İşleniyor...
              </>
            ) : (
              `${selectedCount} Öğeyi Güncelle`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

