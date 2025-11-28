'use client';

import { useState } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Filter, Search } from 'lucide-react';
import { toast } from 'sonner';
import {
  ALL_CATEGORIES,
  DATE_FILTER_OPTIONS,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
} from '@/lib/financial/constants';
import { validateDateRange } from '@/lib/financial/calculations';

interface FinancialFiltersProps {
  search: string;
  recordTypeFilter: string;
  categoryFilter: string;
  statusFilter: string;
  dateFilter: string;
  customStartDate: string;
  customEndDate: string;
  onSearchChange: (value: string) => void;
  onRecordTypeChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onDateFilterChange: (value: string) => void;
  onCustomStartDateChange: (value: string) => void;
  onCustomEndDateChange: (value: string) => void;
  onPageChange?: (page: number) => void;
}

export function FinancialFilters({
  search,
  recordTypeFilter,
  categoryFilter,
  statusFilter,
  dateFilter,
  customStartDate,
  customEndDate,
  onSearchChange,
  onRecordTypeChange,
  onCategoryChange,
  onStatusChange,
  onDateFilterChange,
  onCustomStartDateChange,
  onCustomEndDateChange,
  onPageChange,
}: FinancialFiltersProps) {
  const [dateError, setDateError] = useState('');

  const handleDateFilterChange = (value: string) => {
    onDateFilterChange(value);
    if (value !== 'custom') {
      onCustomStartDateChange('');
      onCustomEndDateChange('');
      setDateError('');
    }
  };

  const handleStartDateChange = (value: string) => {
    onCustomStartDateChange(value);
    if (value && customEndDate) {
      const error = validateDateRange(value, customEndDate);
      setDateError(error);
    } else {
      setDateError('');
    }
  };

  const handleEndDateChange = (value: string) => {
    onCustomEndDateChange(value);
    if (customStartDate && value) {
      const error = validateDateRange(customStartDate, value);
      setDateError(error);
    } else {
      setDateError('');
    }
  };

  const handleApplyFilter = () => {
    if (!customStartDate || !customEndDate) {
      setDateError('Başlangıç ve bitiş tarihleri gereklidir');
      toast.error('Lütfen başlangıç ve bitiş tarihlerini seçin');
      return;
    }

    const error = validateDateRange(customStartDate, customEndDate);
    if (error) {
      setDateError(error);
      toast.error(error);
      return;
    }

    setDateError('');
    onPageChange?.(1);
    toast.success('Tarih filtresi uygulandı');
  };

  const getAvailableCategories = () => {
    if (recordTypeFilter === 'income') {
      return INCOME_CATEGORIES;
    }
    if (recordTypeFilter === 'expense') {
      return EXPENSE_CATEGORIES;
    }
    return ALL_CATEGORIES;
  };

  const availableCategories = getAvailableCategories();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Arama ve Filtreleme
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search and Basic Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search Input */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Açıklama, kategori veya makbuz no"
                className="pl-10"
                value={search}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  onPageChange?.(1);
                }}
              />
            </div>

            {/* Record Type Filter */}
            <Select value={recordTypeFilter} onValueChange={onRecordTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Tür" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="income">Gelir</SelectItem>
                <SelectItem value="expense">Gider</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select
              value={categoryFilter}
              onValueChange={onCategoryChange}
              disabled={recordTypeFilter !== 'all' && (availableCategories.length as number) === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Kategoriler</SelectItem>
                {availableCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={onStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="pending">Beklemede</SelectItem>
                <SelectItem value="approved">Onaylandı</SelectItem>
                <SelectItem value="rejected">Reddedildi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Filter */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Tarih Filtresi
            </Label>
            <Select value={dateFilter} onValueChange={handleDateFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="Tarih aralığı seçin" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DATE_FILTER_OPTIONS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Custom Date Inputs */}
            {dateFilter === 'custom' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="customStartDate">
                    Başlangıç Tarihi <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="customStartDate"
                    type="date"
                    value={customStartDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    max={customEndDate || undefined}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customEndDate">
                    Bitiş Tarihi <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="customEndDate"
                    type="date"
                    value={customEndDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    min={customStartDate || undefined}
                  />
                </div>
              </div>
            )}

            {/* Date Validation Error */}
            {dateError && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {dateError}
              </p>
            )}

            {/* Apply Filter Button for Custom Dates */}
            {dateFilter === 'custom' && (
              <Button
                onClick={handleApplyFilter}
                className="w-full md:w-auto"
                disabled={!customStartDate || !customEndDate || !!dateError}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtrele
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
