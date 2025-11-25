'use client';

import React, { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Transaction, TransactionType, CreateTransactionInput } from '@/types/financial';
import { Loader2, CheckCircle, DollarSign } from 'lucide-react';

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

const CURRENCIES = [
  { value: 'TRY', label: 'TRY - Türk Lirası' },
  { value: 'USD', label: 'USD - Amerikan Doları' },
  { value: 'EUR', label: 'EUR - Euro' },
];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Bekliyor' },
  { value: 'completed', label: 'Tamamlandı' },
  { value: 'cancelled', label: 'İptal' },
];

interface TransactionFormProps {
  transaction?: Transaction | null;
  onSubmit: (data: CreateTransactionInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  className?: string;
  mode?: 'create' | 'edit';
}

export default function TransactionForm({
  transaction,
  onSubmit,
  onCancel,
  loading = false,
  className = '',
  mode = 'create',
}: TransactionFormProps) {
  const [formData, setFormData] = useState<CreateTransactionInput>({
    type: 'income',
    category: 'donation',
    amount: 0,
    currency: 'TRY',
    description: '',
    date: new Date(),
    status: 'pending',
    tags: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tagInput, setTagInput] = useState('');

  // Initialize form data when transaction changes
  useEffect(() => {
    if (transaction && mode === 'edit') {
      // Use setTimeout to defer the state update
      setTimeout(() => {
        setFormData({
          type: transaction.type,
          category: transaction.category,
          amount: transaction.amount,
          currency: transaction.currency,
          description: transaction.description,
          date: transaction.date,
          status: transaction.status,
          tags: transaction.tags || [],
        });
      }, 0);
    }
  }, [transaction, mode]);

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Açıklama gereklidir';
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Geçerli bir tutar giriniz';
    }

    if (!formData.category) {
      newErrors.category = 'Kategori seçiniz';
    }

    if (!formData.date) {
      newErrors.date = 'Tarih gereklidir';
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
    field: keyof CreateTransactionInput,
    value: string | number | Date | string[]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when field is changed
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  // Add tag
  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  // Remove tag
  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((tag) => tag !== tagToRemove) || [],
    }));
  };

  // Handle tag input key press
  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Get categories based on transaction type
  const getCategories = () => {
    if (formData.type === 'income') {
      return Object.entries(CATEGORY_LABELS)
        .filter(([key]) =>
          [
            'donation',
            'membership_fee',
            'sponsorship',
            'event_revenue',
            'grant',
            'other_income',
          ].includes(key)
        )
        .map(([key, label]) => ({ value: key, label }));
    } else {
      return Object.entries(CATEGORY_LABELS)
        .filter(([key]) =>
          [
            'administrative',
            'program_expenses',
            'scholarship',
            'assistance',
            'marketing',
            'office_supplies',
            'utilities',
            'transportation',
            'other_expense',
          ].includes(key)
        )
        .map(([key, label]) => ({ value: key, label }));
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          {mode === 'create' ? 'Yeni İşlem' : 'İşlemi Düzenle'}
        </CardTitle>
        <CardDescription>
          {mode === 'create'
            ? 'Yeni bir gelir veya gider işlemi oluşturun'
            : 'Mevcut işlem bilgilerini düzenleyin'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transaction Type and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">İşlem Türü</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => {
                  handleFieldChange('type', value);
                  // Reset category when type changes
                  setFormData((prev) => ({
                    ...prev,
                    type: value as TransactionType,
                    category: value === 'income' ? 'donation' : 'administrative',
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Gelir</SelectItem>
                  <SelectItem value="expense">Gider</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">Kategori</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => {
                  handleFieldChange('category', value);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getCategories().map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-red-500 mt-1">{errors.category}</p>}
            </div>
          </div>

          {/* Amount and Currency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Tutar</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => {
                    handleFieldChange('amount', parseFloat(e.target.value) || 0);
                  }}
                  className="pl-10"
                  placeholder="0.00"
                />
              </div>
              {errors.amount && <p className="text-sm text-red-500 mt-1">{errors.amount}</p>}
            </div>

            <div>
              <Label htmlFor="currency">Para Birimi</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => {
                  handleFieldChange('currency', value);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="İşlem hakkında detaylı açıklama..."
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-500 mt-1">{errors.description}</p>
            )}
          </div>

          {/* Date and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Tarih</Label>
              <Input
                id="date"
                type="date"
                value={formData.date ? formData.date.toISOString().split('T')[0] : ''}
                onChange={(e) => handleFieldChange('date', new Date(e.target.value))}
              />
              {errors.date && <p className="text-sm text-red-500 mt-1">{errors.date}</p>}
            </div>

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
                  {STATUS_OPTIONS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags">Etiketler</Label>
            <div className="space-y-3">
              {/* Tag Input */}
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => {
                    setTagInput(e.target.value);
                  }}
                  onKeyPress={handleTagKeyPress}
                  placeholder="Etiket ekle..."
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim()}
                >
                  Ekle
                </Button>
              </div>

              {/* Tag List */}
              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => {
                          handleRemoveTag(tag);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
