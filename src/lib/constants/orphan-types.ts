/**
 * Orphan type constants and labels
 */

export const ORPHAN_TYPES = {
  FULL_ORPHAN: 'FULL_ORPHAN',
  PARTIAL_ORPHAN: 'PARTIAL_ORPHAN',
  ABANDONED: 'ABANDONED',
  PROTECTED: 'PROTECTED',
} as const;

export const ORPHAN_TYPE_LABELS: Record<string, string> = {
  [ORPHAN_TYPES.FULL_ORPHAN]: 'Tam Yetim',
  [ORPHAN_TYPES.PARTIAL_ORPHAN]: 'Kısmi Yetim',
  [ORPHAN_TYPES.ABANDONED]: 'Terk Edilmiş',
  [ORPHAN_TYPES.PROTECTED]: 'Koruma Altında',
};

export const ORPHAN_TYPE_OPTIONS = Object.entries(ORPHAN_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));
