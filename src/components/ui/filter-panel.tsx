'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, X, Filter, Save, Trash2, Check } from 'lucide-react';
import { DateRangePicker, DateRange } from './date-range-picker';
import { cn } from '@/lib/utils';

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

export interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'checkbox' | 'daterange';
  placeholder?: string;
  options?: FilterOption[];
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: Record<string, unknown>;
}

interface FilterPanelProps {
  fields: FilterField[];
  onFiltersChange: (filters: Record<string, unknown>) => void;
  onReset: () => void;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  presets?: FilterPreset[];
  onSavePreset?: (name: string, filters: Record<string, unknown>) => void;
  onDeletePreset?: (id: string) => void;
  onApplyPreset?: (preset: FilterPreset) => void;
  showPresets?: boolean;
}

/**
 * Enhanced filter panel with multi-select and date range support
 */
export function FilterPanel({
  fields,
  onFiltersChange,
  onReset,
  isOpen: _isOpen = true,
  onToggle: _onToggle,
  presets = [],
  onSavePreset,
  onDeletePreset,
  onApplyPreset,
  showPresets = true,
}: FilterPanelProps) {
  const [filters, setFilters] = useState<Record<string, string | string[] | DateRange>>({});
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(fields.map((f) => f.key))
  );
  const [presetName, setPresetName] = useState('');

  const handleFilterChange = useCallback((key: string, value: string | string[] | DateRange) => {
    const newFilters = { ...filters, [key]: value };
    if (
      !value ||
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === 'object' && 'from' in value && !value.from && !value.to)
    ) {
      delete newFilters[key];
    }
    setFilters(newFilters);
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

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

  const handleSavePreset = () => {
    if (presetName.trim() && onSavePreset) {
      onSavePreset(presetName.trim(), filters);
      setPresetName('');
    }
  };

  const activeFilterCount = Object.keys(filters).length;

  return (
    <Card className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Filtreler</h3>
          {activeFilterCount > 0 && (
            <Badge variant="default" className="h-5 px-1.5 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Presets Dropdown */}
          {showPresets && presets.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                  <Save className="h-3 w-3" />
                  Şablonlar
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Kayıtlı Şablonlar</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {presets.map((preset) => (
                  <DropdownMenuItem
                    key={preset.id}
                    className="flex items-center justify-between"
                  >
                    <button
                      onClick={() => onApplyPreset?.(preset)}
                      className="flex-1 text-left"
                    >
                      {preset.name}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePreset?.(preset.id);
                      }}
                      className="p-1 hover:bg-destructive/10 rounded"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </button>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={activeFilterCount === 0}
            className="h-7 text-xs"
          >
            Temizle
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.key} className="border-b border-border/50 last:border-b-0 pb-4 last:pb-0">
            {/* Section Header */}
            <button
              onClick={() => toggleSection(field.key)}
              aria-label={`${field.label} filtresi ${expandedSections.has(field.key) ? 'gizle' : 'göster'}`}
              aria-expanded={expandedSections.has(field.key)}
              className="flex items-center justify-between w-full mb-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              <span className="flex items-center gap-2">
                {field.label}
                {filters[field.key] && (
                  <span className="w-2 h-2 rounded-full bg-primary" />
                )}
              </span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform',
                  !expandedSections.has(field.key) && '-rotate-90'
                )}
              />
            </button>

            {/* Filter Input */}
            {expandedSections.has(field.key) && (
              <div className="animate-in fade-in-50 slide-in-from-top-1">
                {field.type === 'text' && (
                  <Input
                    placeholder={field.placeholder || `${field.label} ara...`}
                    value={(filters[field.key] as string) || ''}
                    onChange={(e) => handleFilterChange(field.key, e.target.value)}
                    className="h-8 text-sm"
                  />
                )}

                {field.type === 'select' && (
                  <select
                    value={(filters[field.key] as string) || ''}
                    onChange={(e) => handleFilterChange(field.key, e.target.value)}
                    className="w-full h-8 px-2 border border-input rounded-md text-sm bg-background focus:ring-2 focus:ring-ring focus:ring-offset-1"
                  >
                    <option value="">Tümü</option>
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                        {option.count !== undefined && ` (${option.count})`}
                      </option>
                    ))}
                  </select>
                )}

                {field.type === 'multiselect' && (
                  <MultiSelectFilter
                    options={field.options || []}
                    value={(filters[field.key] as string[]) || []}
                    onChange={(value) => handleFilterChange(field.key, value)}
                    placeholder={field.placeholder || 'Seçiniz...'}
                  />
                )}

                {field.type === 'checkbox' && (
                  <div className="space-y-2">
                    {field.options?.map((option) => {
                      const isChecked = Array.isArray(filters[field.key])
                        ? (filters[field.key] as string[]).includes(option.value)
                        : false;
                      return (
                        <label
                          key={option.value}
                          className="flex items-center gap-2 cursor-pointer group"
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              const current = Array.isArray(filters[field.key])
                                ? (filters[field.key] as string[])
                                : [];
                              const updated = checked
                                ? [...current, option.value]
                                : current.filter((v) => v !== option.value);
                              handleFilterChange(field.key, updated);
                            }}
                          />
                          <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                            {option.label}
                            {option.count !== undefined && (
                              <span className="ml-1 text-xs text-muted-foreground">
                                ({option.count})
                              </span>
                            )}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {field.type === 'daterange' && (
                  <DateRangePicker
                    value={filters[field.key] as DateRange}
                    onChange={(range) => handleFilterChange(field.key, range)}
                    placeholder="Tarih aralığı seçin"
                    className="w-full"
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Save Preset */}
      {showPresets && onSavePreset && activeFilterCount > 0 && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex gap-2">
            <Input
              placeholder="Şablon adı..."
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              className="h-8 text-sm flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleSavePreset}
              disabled={!presetName.trim()}
              className="h-8"
            >
              <Save className="h-3 w-3 mr-1" />
              Kaydet
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

/**
 * Multi-select filter component
 */
interface MultiSelectFilterProps {
  options: FilterOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

function MultiSelectFilter({
  options,
  value,
  onChange,
  placeholder = 'Seçiniz...',
}: MultiSelectFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const toggleOption = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const clearAll = () => {
    onChange([]);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between h-auto min-h-8 py-1.5"
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {value.length === 0 ? (
              <span className="text-muted-foreground text-sm">{placeholder}</span>
            ) : (
              value.map((v) => {
                const option = options.find((o) => o.value === v);
                return (
                  <Badge
                    key={v}
                    variant="secondary"
                    className="text-xs gap-1"
                  >
                    {option?.label || v}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleOption(v);
                      }}
                      className="hover:bg-secondary-foreground/10 rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <div className="p-2">
          <Input
            placeholder="Ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-48 overflow-y-auto">
          {filteredOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => { toggleOption(option.value); }}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div
                className={cn(
                  'w-4 h-4 border rounded flex items-center justify-center',
                  value.includes(option.value)
                    ? 'bg-primary border-primary'
                    : 'border-input'
                )}
              >
                {value.includes(option.value) && (
                  <Check className="h-3 w-3 text-primary-foreground" />
                )}
              </div>
              <span className="flex-1">{option.label}</span>
              {option.count !== undefined && (
                <span className="text-xs text-muted-foreground">
                  {option.count}
                </span>
              )}
            </DropdownMenuItem>
          ))}
        </div>
        {value.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="w-full h-7 text-xs"
              >
                Tümünü Temizle
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
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
        variant={!selectedValue ? 'primary' : 'outline'}
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
          variant={selectedValue === option.value ? 'primary' : 'outline'}
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
              className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
            >
              <span>{value}</span>
              <button
                onClick={() => {
                  onRemove(key, v);
                }}
                aria-label={`${v} filtresini kaldır`}
                className="hover:text-primary/80"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ));
        }
        return (
          <div
            key={key}
            className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
          >
            <span>
              {label}: {value}
            </span>
            <button
              onClick={() => {
                onRemove(key);
              }}
              aria-label={`${label} filtresini kaldır`}
              className="hover:text-primary/80"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
