'use client';

import * as React from 'react';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, subMonths } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange) => void;
  placeholder?: string;
  className?: string;
  align?: 'start' | 'center' | 'end';
  disabled?: boolean;
}

// Preset date ranges
const presets = [
  {
    label: 'Bugün',
    getValue: () => ({ from: new Date(), to: new Date() }),
  },
  {
    label: 'Son 7 gün',
    getValue: () => ({ from: subDays(new Date(), 7), to: new Date() }),
  },
  {
    label: 'Son 30 gün',
    getValue: () => ({ from: subDays(new Date(), 30), to: new Date() }),
  },
  {
    label: 'Bu ay',
    getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }),
  },
  {
    label: 'Geçen ay',
    getValue: () => ({
      from: startOfMonth(subMonths(new Date(), 1)),
      to: endOfMonth(subMonths(new Date(), 1)),
    }),
  },
  {
    label: 'Bu yıl',
    getValue: () => ({ from: startOfYear(new Date()), to: new Date() }),
  },
];

export function DateRangePicker({
  value,
  onChange,
  placeholder = 'Tarih aralığı seçin',
  className,
  align = 'start',
  disabled = false,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [tempRange, setTempRange] = React.useState<DateRange>(value || { from: undefined, to: undefined });

  // Sync tempRange with value
  React.useEffect(() => {
    if (value) {
      setTempRange(value);
    }
  }, [value]);

  const handleSelect = (range: DateRange | undefined) => {
    if (range) {
      setTempRange(range);
      // If both dates are selected, apply immediately
      if (range.from && range.to) {
        onChange(range);
        setIsOpen(false);
      }
    }
  };

  const handlePresetClick = (preset: typeof presets[0]) => {
    const range = preset.getValue();
    setTempRange(range);
    onChange(range);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    const emptyRange = { from: undefined, to: undefined };
    setTempRange(emptyRange);
    onChange(emptyRange);
  };

  const formatDateRange = () => {
    if (!value?.from) return placeholder;
    if (!value?.to) return format(value.from, 'dd MMM yyyy', { locale: tr });
    return `${format(value.from, 'dd MMM yyyy', { locale: tr })} - ${format(value.to, 'dd MMM yyyy', { locale: tr })}`;
  };

  const hasValue = value?.from || value?.to;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-between text-left font-normal',
            !hasValue && 'text-muted-foreground',
            className
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <CalendarIcon className="h-4 w-4 shrink-0" />
            <span className="truncate">{formatDateRange()}</span>
          </div>
          <div className="flex items-center gap-1">
            {hasValue && (
              <button
                onClick={handleClear}
                className="p-0.5 hover:bg-slate-200 rounded transition-colors"
                aria-label="Tarihi temizle"
              >
                <X className="h-3 w-3" />
              </button>
            )}
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <div className="flex">
          {/* Presets */}
          <div className="border-r p-2 space-y-1 w-36">
            <p className="text-xs font-medium text-muted-foreground px-2 pb-2">
              Hızlı Seçim
            </p>
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePresetClick(preset)}
                className="w-full px-2 py-1.5 text-sm text-left rounded-md hover:bg-slate-100 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Calendar */}
          <div className="p-3">
            <Calendar
              mode="range"
              defaultMonth={tempRange.from}
              selected={tempRange.from ? tempRange : undefined}
              onSelect={(range) => handleSelect(range as DateRange | undefined)}
              numberOfMonths={2}
              locale={tr}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-3 flex justify-between items-center bg-slate-50">
          <div className="text-xs text-muted-foreground">
            {tempRange.from && !tempRange.to && 'Bitiş tarihini seçin'}
            {tempRange.from && tempRange.to && (
              <span>
                {format(tempRange.from, 'dd/MM/yyyy', { locale: tr })} -{' '}
                {format(tempRange.to, 'dd/MM/yyyy', { locale: tr })}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const emptyRange = { from: undefined, to: undefined };
                setTempRange(emptyRange);
              }}
            >
              Temizle
            </Button>
            <Button
              size="sm"
              disabled={!tempRange.from || !tempRange.to}
              onClick={() => {
                onChange(tempRange);
                setIsOpen(false);
              }}
            >
              Uygula
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Simple date picker (single date)
 */
interface SimpleDatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SimpleDatePicker({
  value,
  onChange,
  placeholder = 'Tarih seçin',
  className,
  disabled = false,
}: SimpleDatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, 'dd MMMM yyyy', { locale: tr }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange(date);
            setIsOpen(false);
          }}
          locale={tr}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

