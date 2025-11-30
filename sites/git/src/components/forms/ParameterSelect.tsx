'use client';

import { useQuery } from '@tanstack/react-query';
import { parametersApi } from '@/lib/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { ParameterDocument } from '@/types/database';

interface ParameterSelectProps {
  category?: string;
  parameter?: string;
  value?: string;
  onChange?: (value: string) => void;
  onValueChange?: (value: string) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function ParameterSelect({
  category,
  parameter,
  value,
  onChange,
  onValueChange,
  label,
  required = false,
  placeholder,
  error,
  disabled = false,
  className,
}: ParameterSelectProps) {
  const resolvedCategory = category ?? parameter ?? '';
  const handleChange = onValueChange ?? onChange ?? (() => {});

  const { data, isLoading } = useQuery({
    queryKey: ['parameters', resolvedCategory],
    queryFn: () => parametersApi.getParametersByCategory(resolvedCategory),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const parameters: ParameterDocument[] = (data?.data as ParameterDocument[]) || [];

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={resolvedCategory}>
          {label} {required && <span className="text-red-600">*</span>}
        </Label>
      )}
      <Select value={value} onValueChange={handleChange} disabled={disabled || isLoading}>
        <SelectTrigger id={resolvedCategory} className={className}>
          <SelectValue placeholder={placeholder || (label ? `${label} seçin` : 'Seçin')} />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <SelectItem value="loading" disabled>
              Yükleniyor...
            </SelectItem>
          ) : parameters.length === 0 ? (
            <SelectItem value="empty" disabled>
              Parametre bulunamadı
            </SelectItem>
          ) : (
            parameters.map((param) => (
              <SelectItem key={param._id} value={param.value}>
                {param.name_tr}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
