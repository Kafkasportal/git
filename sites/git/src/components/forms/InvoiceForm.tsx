'use client';

import React, { useState } from 'react';
import logger from '@/lib/logger';
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
import { Invoice, CreateInvoiceInput, InvoiceStatus } from '@/types/financial';
import { Loader2, CheckCircle, FileText, Plus, Trash2 } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Taslak' },
  { value: 'sent', label: 'Gönderildi' },
  { value: 'paid', label: 'Ödendi' },
  { value: 'overdue', label: 'Gecikmiş' },
  { value: 'cancelled', label: 'İptal' },
];

interface InvoiceFormProps {
  invoice?: Invoice | null;
  onSubmit: (data: CreateInvoiceInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  className?: string;
  mode?: 'create' | 'edit';
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export default function InvoiceForm({
  invoice,
  onSubmit,
  onCancel,
  loading = false,
  className = '',
  mode = 'create',
}: InvoiceFormProps) {
  const [formData, setFormData] = useState<{
    clientName: string;
    clientEmail: string;
    clientAddress?: string;
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
    issueDate: string;
    dueDate: string;
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    notes?: string;
  }>(() => {
    if (invoice && mode === 'edit') {
      return {
        clientName: invoice.clientName,
        clientEmail: invoice.clientEmail,
        clientAddress: invoice.clientAddress || '',
        items: invoice.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
        issueDate: invoice.issueDate.toISOString().split('T')[0],
        dueDate: invoice.dueDate.toISOString().split('T')[0],
        status: invoice.status,
        notes: invoice.notes || '',
      };
    }
    const today = new Date();
    const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    return {
      clientName: '',
      clientEmail: '',
      clientAddress: '',
      items: [],
      issueDate: today.toISOString().split('T')[0],
      dueDate: thirtyDaysLater.toISOString().split('T')[0],
      status: 'draft',
      notes: '',
    };
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [items, setItems] = useState<InvoiceItem[]>(() => {
    if (invoice && mode === 'edit') {
      return invoice.items.map((item, index) => ({
        id: (index + 1).toString(),
        ...item,
      }));
    }
    return [{ id: '1', description: '', quantity: 1, unitPrice: 0, total: 0 }];
  });

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Müşteri adı gereklidir';
    }

    if (!formData.clientEmail.trim()) {
      newErrors.clientEmail = 'E-posta adresi gereklidir';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clientEmail)) {
      newErrors.clientEmail = 'Geçerli bir e-posta adresi giriniz';
    }

    if (
      items.length === 0 ||
      !items.some((item) => item.description.trim() && item.quantity > 0 && item.unitPrice > 0)
    ) {
      newErrors.items = 'En az bir geçerli kalem ekleyiniz';
    }

    if (!formData.issueDate) {
      newErrors.issueDate = 'Fatura tarihi gereklidir';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Vade tarihi gereklidir';
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

    // Update form data with items
    const updatedFormData: CreateInvoiceInput = {
      ...formData,
      issueDate: new Date(formData.issueDate),
      dueDate: new Date(formData.dueDate),
      items: items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      })),
    };

    try {
      await onSubmit(updatedFormData);
    } catch (_error) {
      logger.error('Invoice form submission error', { error: _error });
    }
  };

  // Handle field changes
  const handleFieldChange = (
    field: keyof CreateInvoiceInput,
    value: CreateInvoiceInput[keyof CreateInvoiceInput]
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

  // Add new item
  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Remove item
  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Update item
  const updateItem = (
    id: string,
    field: keyof InvoiceItem,
    value: InvoiceItem[keyof InvoiceItem]
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };

          // Recalculate total when quantity or unitPrice changes
          if (field === 'quantity' || field === 'unitPrice') {
            updated.total = updated.quantity * updated.unitPrice;
          }

          return updated;
        }
        return item;
      })
    );
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.18; // %18 KDV
  const total = subtotal + tax;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          {mode === 'create' ? 'Yeni Fatura' : 'Faturayı Düzenle'}
        </CardTitle>
        <CardDescription>
          {mode === 'create' ? 'Yeni bir fatura oluşturun' : 'Mevcut fatura bilgilerini düzenleyin'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Müşteri Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clientName">Müşteri Adı *</Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) => handleFieldChange('clientName', e.target.value)}
                  placeholder="Müşteri adı veya kurum adı"
                />
                {errors.clientName && (
                  <p className="text-sm text-red-500 mt-1">{errors.clientName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="clientEmail">E-posta *</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => handleFieldChange('clientEmail', e.target.value)}
                  placeholder="ornek@email.com"
                />
                {errors.clientEmail && (
                  <p className="text-sm text-red-500 mt-1">{errors.clientEmail}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="clientAddress">Adres</Label>
              <Textarea
                id="clientAddress"
                value={formData.clientAddress}
                onChange={(e) => handleFieldChange('clientAddress', e.target.value)}
                placeholder="Müşteri adresi..."
                rows={2}
              />
            </div>
          </div>

          {/* Invoice Items */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Fatura Kalemleri</h3>
              <Button type="button" variant="outline" onClick={addItem}>
                <Plus className="w-4 h-4 mr-2" />
                Kalem Ekle
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, _index) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 p-3 border rounded-lg">
                  <div className="col-span-4">
                    <Input
                      placeholder="Açıklama"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Adet"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)
                      }
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Birim Fiyat"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) =>
                        updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="text-sm font-medium">
                      {item.total.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                    </span>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {errors.items && <p className="text-sm text-red-500">{errors.items}</p>}
          </div>

          {/* Invoice Summary */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span>Ara Toplam:</span>
              <span className="font-medium">
                {subtotal.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
              </span>
            </div>
            <div className="flex justify-between">
              <span>KDV (%18):</span>
              <span className="font-medium">
                {tax.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Toplam:</span>
              <span>{total.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
            </div>
          </div>

          {/* Invoice Dates and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="issueDate">Fatura Tarihi</Label>
              <Input
                id="issueDate"
                type="date"
                value={formData.issueDate || ''}
                onChange={(e) => handleFieldChange('issueDate', e.target.value)}
              />
              {errors.issueDate && <p className="text-sm text-red-500 mt-1">{errors.issueDate}</p>}
            </div>

            <div>
              <Label htmlFor="dueDate">Vade Tarihi</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate || ''}
                onChange={(e) => handleFieldChange('dueDate', e.target.value)}
              />
              {errors.dueDate && <p className="text-sm text-red-500 mt-1">{errors.dueDate}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="status">Durum</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleFieldChange('status', value as InvoiceStatus)}
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

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notlar</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              placeholder="Fatura notları..."
              rows={3}
            />
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
