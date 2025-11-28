export const STATUS_LABELS = {
  pending: { label: 'Beklemede', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Onaylandı', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Reddedildi', color: 'bg-red-100 text-red-700' },
} as const;

export const INCOME_CATEGORIES = [
  'Bağış Gelirleri',
  'Kurs Gelirleri',
  'Etkinlik Gelirleri',
] as const;

export const EXPENSE_CATEGORIES = [
  'Burs Ödemeleri',
  'İhtiyaç Sahibi Yardımları',
  'Ofis Giderleri',
  'Personel Giderleri',
] as const;

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES] as const;

export const PAYMENT_METHODS = [
  'Banka Transferi',
  'Nakit',
  'Kredi Kartı',
  'Otomatik Ödeme',
] as const;

export const DATE_FILTER_OPTIONS = {
  all: 'Tüm Tarihler',
  today: 'Bugün',
  thisMonth: 'Bu Ay',
  custom: 'Özel Tarih Aralığı',
} as const;
