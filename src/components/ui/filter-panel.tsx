'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ChevronDown, X } from 'lucide-react';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'checkbox' | 'daterange';
  placeholder?: string;
  options?: FilterOption[];
}

interface FilterPanelProps {
  fields: FilterField[];
  onFiltersChange: (filters: Record<string, string | string[] | unknown>) => void;
  onReset: () => void;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
}

/**
 * Reusable filter panel for list views
 */
export function FilterPanel({
  fields,
  onFiltersChange,
  onReset,
  isOpen: _isOpen = true,
  onToggle: _onToggle,
}: FilterPanelProps) {
  const [filters, setFilters] = useState<Record<string, string | string[]>>({});
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(fields.map((f) => f.key))
  );

  const handleFilterChange = (key: string, value: string | string[]) => {
    const newFilters = { ...filters, [key]: value };
    if (!value || (Array.isArray(value) && value.length === 0)) {
      delete newFilters[key];
    }
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleReset = () => {
    setFilters({});
    onReset();
  };

  const toggleSection = (key: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedSections(newExpanded);
  };

  const activeFilterCount = Object.keys(filters).length;

  return (
    <Card className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">Filtreler</h3>
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          disabled={activeFilterCount === 0}
          className="text-xs"
        >
          Temizle
        </Button>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.key} className="border-b last:border-b-0 pb-4 last:pb-0">
            {/* Section Header */}
            <button
              onClick={() => toggleSection(field.key)}
              aria-label={`${field.label} filtresi ${expandedSections.has(field.key) ? 'gizle' : 'göster'}`}
              aria-expanded={expandedSections.has(field.key)}
              className="flex items-center justify-between w-full mb-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              {field.label}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  expandedSections.has(field.key) ? '' : '-rotate-90'
                }`}
              />
            </button>

            {/* Filter Input */}
            {expandedSections.has(field.key) && (
              <div>
                {field.type === 'text' && (
                  <Input
                    placeholder={field.placeholder || `${field.label}'de ara...`}
                    value={filters[field.key] || ''}
                    onChange={(e) => handleFilterChange(field.key, e.target.value)}
                    className="h-8 text-sm"
                  />
                )}

                {field.type === 'select' && (
                  <select
                    value={filters[field.key] || ''}
                    onChange={(e) => handleFilterChange(field.key, e.target.value)}
                    className="w-full h-8 px-2 border border-border rounded-md text-sm bg-background"
                  >
                    <option value="">Tümü</option>
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}

                {field.type === 'checkbox' && (
                  <div className="space-y-2">
                    {field.options?.map((option) => (
                      <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={
                            Array.isArray(filters[field.key])
                              ? filters[field.key].includes(option.value)
                              : false
                          }
                          onChange={(e) => {
                            const current = Array.isArray(filters[field.key])
                              ? (filters[field.key] as string[])
                              : [];
                            const updated = e.target.checked
                              ? [...current, option.value]
                              : current.filter((v) => v !== option.value);
                            handleFilterChange(field.key, updated);
                          }}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                )}

                {field.type === 'daterange' && (
                  <div className="space-y-2">
                    <Input type="date" placeholder="Başlangıç tarihi" className="h-8 text-sm" />
                    <Input type="date" placeholder="Bitiş tarihi" className="h-8 text-sm" />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

/**
 * Quick filter bar component
 */
interface QuickFiltersProps {
  options: FilterOption[];
  selectedValue?: string;
  onChange: (value: string) => void;
  label?: string;
}

export function QuickFilters({
  options,
  selectedValue,
  onChange,
  label = 'Filtrele:',
}: QuickFiltersProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      <Button
        variant={!selectedValue ? 'default' : 'outline'}
        size="sm"
        onClick={() => {
          onChange('');
        }}
        className="h-8 text-xs"
      >
        Tümü
      </Button>
      {options.map((option) => (
        <Button
          key={option.value}
          variant={selectedValue === option.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            onChange(option.value);
          }}
          className="h-8 text-xs"
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

/**
 * Active filters display
 */
interface ActiveFiltersProps {
  filters: Record<string, string | string[]>;
  filterLabels: Record<string, string>;
  onRemove: (key: string, value?: string) => void;
}

export function ActiveFilters({ filters, filterLabels, onRemove }: ActiveFiltersProps) {
  if (Object.keys(filters).length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(filters).map(([key, value]) => {
        const label = filterLabels[key] || key;
        if (Array.isArray(value)) {
          return value.map((v) => (
            <div
              key={`${key}-${v}`}
              className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              <span>{value}</span>
              <button
                onClick={() => {
                  onRemove(key, v);
                }}
                aria-label={`${v} filtresini kaldır`}
                className="hover:text-blue-900"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ));
        }
        return (
          <div
            key={key}
            className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
          >
            <span>
              {label}: {value}
            </span>
            <button
              onClick={() => {
                onRemove(key);
              }}
              aria-label={`${label} filtresini kaldır`}
              className="hover:text-blue-900"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
