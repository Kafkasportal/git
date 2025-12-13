import { subDays, subMonths, startOfYear } from 'date-fns';

export type TimeRange = '7d' | '30d' | '90d' | '12m' | 'ytd' | 'custom';

export interface DateRange {
  from: Date;
  to: Date;
}

export function getDateRangeFromPreset(range: TimeRange): DateRange {
  const now = new Date();
  now.setHours(23, 59, 59, 999);

  switch (range) {
    case '7d':
      return { from: subDays(now, 7), to: now };
    case '30d':
      return { from: subDays(now, 30), to: now };
    case '90d':
      return { from: subDays(now, 90), to: now };
    case '12m':
      return { from: subMonths(now, 12), to: now };
    case 'ytd':
      return { from: startOfYear(now), to: now };
    default:
      return { from: subDays(now, 30), to: now };
  }
}

export function getComparisonRange(range: DateRange): DateRange {
  const daysDiff = Math.ceil((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24));
  return {
    from: subDays(range.from, daysDiff),
    to: subDays(range.from, 1),
  };
}

