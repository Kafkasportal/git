'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Budget, BudgetPeriod, CreateBudgetInput } from '@/types/financial';
import { Loader2, CheckCircle, Target } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  // Income Categories
  donation: 'Bağış',
  membership_fee: 'Üyelik Aidatı',
  sponsorship: 'Sponsorluk',
  event_revenue: 'Etkinlik Geliri',
  grant: 'Hibe',
  other_income: 'Diğer Gelir',

  // Expense Categories
  administrative: 'İdari',
  program_expenses: 'Program Giderleri',
  scholarship: 'Burs',
  assistance: 'Yardım',
  marketing: 'Pazarlama',
  office_supplies: 'Ofis Malzemeleri',
  utilities: 'Faturalar',
  transportation: 'Ulaşım',
  other_expense: 'Diğer Gider',
};

const PERIOD_OPTIONS = [
  { value: 'monthly', label: 'Aylık' },
  { value: 'quarterly', label: 'Üç Aylık' },
  { value: 'yearly', label: 'Yıllık' },
];

interface BudgetFormProps {
  budget?: Budget | null;
  onSubmit: (data: CreateBudgetInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  className?: string;
  mode?: 'create' | 'edit';
}

export default function BudgetForm({
  budget,
  onSubmit,
  onCancel,
  loading = false,
  className = '',
  mode = 'create',
}: BudgetFormProps) {
  // Initialize form data - use budget data directly if in edit mode
  const initialFormData: CreateBudgetInput =
    budget && mode === 'edit'
      ? {
          name: budget.name,
          period: budget.period,
          year: budget.year,
          month: budget.month,
          categories: budget.categories,
          status: budget.status,
        }
      : {
          name: '',
          period: 'monthly',
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
          categories: {},
          status: 'draft',
        };

  const [formData, setFormData] = useState<CreateBudgetInput>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Bütçe adı gereklidir';
    }

    if (formData.period === 'monthly' && !formData.month) {
      newErrors.month = 'Ay seçiniz';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (_error) {
      // Error handled by mutation's onError callback
    }
  };

  // Handle field changes
  const handleFieldChange = (
    field: keyof CreateBudgetInput,
    value: CreateBudgetInput[keyof CreateBudgetInput]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  // Handle category amount changes
  const handleCategoryChange = (category: string, planned: number) => {
    setFormData((prev) => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: {
          ...prev.categories[category],
          planned: planned || 0,
        },
      },
    }));
  };

  // Calculate total planned amount
  const totalPlanned = Object.values(formData.categories).reduce(
    (sum, cat) => sum + (cat.planned || 0),
    0
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          {mode === 'create' ? 'Yeni Bütçe' : 'Bütçeyi Düzenle'}
        </CardTitle>
        <CardDescription>
          {mode === 'create' ? 'Yeni bir bütçe planı oluşturun' : 'Mevcut bütçe planını düzenleyin'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Bütçe Adı</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  handleFieldChange('name', e.target.value);
                }}
                placeholder="Örn: 2024 Yıllık Bütçe"
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="period">Dönem</Label>
              <Select
                value={formData.period}
                onValueChange={(value) => {
                  handleFieldChange('period', value as BudgetPeriod);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Year and Month */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="year">Yıl</Label>
              <Input
                id="year"
                type="number"
                min="2020"
                max="2100"
                value={formData.year}
                onChange={(e) =>
                  handleFieldChange('year', parseInt(e.target.value) || new Date().getFullYear())
                }
              />
            </div>

            {formData.period === 'monthly' && (
              <div>
                <Label htmlFor="month">Ay</Label>
                <Select
                  value={formData.month?.toString() || ''}
                  onValueChange={(value) => handleFieldChange('month', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {new Date(2024, i).toLocaleDateString('tr-TR', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.month && <p className="text-sm text-red-500 mt-1">{errors.month}</p>}
              </div>
            )}
          </div>

          {/* Categories and Planned Amounts */}
          <div>
            <Label>Kategoriler ve Planlanan Tutarlar</Label>
            <div className="grid gap-4 mt-2">
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <div
                  key={key}
                  className="grid grid-cols-3 gap-4 items-center p-3 border rounded-lg"
                >
                  <div>
                    <Label className="text-sm font-medium">{label}</Label>
                  </div>
                  <div>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.categories[key]?.planned || ''}
                        onChange={(e) => handleCategoryChange(key, parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formData.categories[key]?.planned
                      ? `${(formData.categories[key]?.planned || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}`
                      : 'Planlanmamış'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total Summary */}
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">Toplam Planlanan:</span>
              <span className="text-xl font-bold text-primary">
                {totalPlanned.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
              </span>
            </div>
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="status">Durum</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleFieldChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Taslak</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="completed">Tamamlandı</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              İptal
            </Button>
            <Button type="submit" disabled={loading} className="min-w-24">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {mode === 'create' ? 'Oluşturuluyor...' : 'Güncelleniyor...'}
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {mode === 'create' ? 'Oluştur' : 'Güncelle'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
