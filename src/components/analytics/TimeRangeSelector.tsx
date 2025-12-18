'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getDateRangeFromPreset, type TimeRange, type DateRange } from './time-range-utils';

export type { TimeRange, DateRange };

interface TimeRangeSelectorProps {
  value: TimeRange;
  customRange?: DateRange;
  onChange: (range: TimeRange, dates?: DateRange) => void;
  className?: string;
  showComparison?: boolean;
  onComparisonChange?: (enabled: boolean) => void;
  comparisonEnabled?: boolean;
}

const rangeOptions: { value: TimeRange; label: string }[] = [
  { value: '7d', label: 'Son 7 gün' },
  { value: '30d', label: 'Son 30 gün' },
  { value: '90d', label: 'Son 90 gün' },
  { value: '12m', label: 'Son 12 ay' },
  { value: 'ytd', label: 'Bu yıl' },
  { value: 'custom', label: 'Özel tarih' },
];

export { getDateRangeFromPreset, getComparisonRange } from './time-range-utils';

export function TimeRangeSelector({
  value,
  customRange,
  onChange,
  className,
  showComparison = false,
  onComparisonChange,
  comparisonEnabled = false,
}: TimeRangeSelectorProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [tempRange, setTempRange] = useState<Partial<DateRange>>({});

  const currentRange = value === 'custom' && customRange
    ? customRange
    : getDateRangeFromPreset(value);

  const handlePresetChange = (newValue: TimeRange) => {
    if (newValue === 'custom') {
      setIsCalendarOpen(true);
    } else {
      onChange(newValue, getDateRangeFromPreset(newValue));
    }
  };

  const handleCalendarSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (!range) return;

    setTempRange(range);

    if (range.from && range.to) {
      onChange('custom', { from: range.from, to: range.to });
      setIsCalendarOpen(false);
      setTempRange({});
    }
  };

  const formatRangeLabel = () => {
    if (value !== 'custom') {
      return rangeOptions.find((o) => o.value === value)?.label;
    }
    if (customRange) {
      return `${format(customRange.from, 'dd MMM', { locale: tr })} - ${format(customRange.to, 'dd MMM', { locale: tr })}`;
    }
    return 'Tarih seçin';
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Preset Selector */}
      <Select value={value} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-40">
          <SelectValue>{formatRangeLabel()}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {rangeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Custom Date Picker */}
      {value === 'custom' && (
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="h-10 w-10">
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              defaultMonth={currentRange.from}
              selected={tempRange.from && tempRange.to ? { from: tempRange.from, to: tempRange.to } : { from: currentRange.from, to: currentRange.to }}
              onSelect={handleCalendarSelect as (range: { from?: Date; to?: Date } | undefined) => void}
              numberOfMonths={2}
              locale={tr}
            />
            <div className="p-3 border-t text-xs text-muted-foreground">
              {tempRange.from && !tempRange.to
                ? 'Bitiş tarihini seçin'
                : 'Başlangıç ve bitiş tarihlerini seçin'}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Comparison Toggle */}
      {showComparison && (
        <Button
          variant={comparisonEnabled ? 'default' : 'outline'}
          size="sm"
          onClick={() => onComparisonChange?.(!comparisonEnabled)}
          className="gap-1"
        >
          <span className="text-xs">vs Önceki</span>
        </Button>
      )}

      {/* Date Range Display */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <span>{format(currentRange.from, 'dd MMM yyyy', { locale: tr })}</span>
        <span>-</span>
        <span>{format(currentRange.to, 'dd MMM yyyy', { locale: tr })}</span>
      </div>
    </div>
  );
}

export default TimeRangeSelector;

