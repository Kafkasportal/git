/**
 * PDF report string constants and labels
 * All user-facing text for PDF exports in Turkish
 */

export const PDF_STRINGS = {
  // Common labels
  CREATED_DATE: 'Oluşturulma Tarihi:',
  SUMMARY_INFO: 'Özet Bilgiler',
  PAGE: 'Sayfa',

  // Report titles
  DONATION_REPORTS_TITLE: 'Bağış Raporları',
  FINANCIAL_REPORT_TITLE: 'Finans Raporu',
  AID_LIST_TITLE: 'Yardım Listesi',

  // Donation report columns
  DONOR: 'Bağışçı',
  TOTAL_AMOUNT: 'Toplam Tutar (₺)',
  DONATION_COUNT: 'Bağış Sayısı',
  AVERAGE_AMOUNT: 'Ortalama Tutar (₺)',

  // Donation report summary
  TOTAL_DONATIONS: 'Toplam Bağış Adedi',
  TOTAL_AMOUNT_LABEL: 'Toplam Tutar',
  AVERAGE_DONATION: 'Ortalama Bağış',
  COMPLETED: 'Tamamlanan',
  PENDING: 'Bekleyen',

  // Financial report columns
  CATEGORY: 'Kategori',
  TYPE: 'Tip',
  AMOUNT: 'Tutar (₺)',
  TRANSACTION_COUNT: 'İşlem Sayısı',

  // Financial report summary
  TOTAL_INCOME: 'Toplam Gelir',
  TOTAL_EXPENSE: 'Toplam Gider',
  NET_INCOME: 'Net Gelir',
  TOTAL_TRANSACTIONS: 'Toplam İşlem',

  // Financial types
  INCOME: 'Gelir',
  EXPENSE: 'Gider',

  // Aid list applicant types
  PERSON: 'Kişi',
  ORGANIZATION: 'Kurum',
  PARTNER: 'Partner',

  // Aid list stages
  DRAFT: 'Taslak',
  UNDER_REVIEW: 'İnceleme',
  APPROVED: 'Onaylandı',
  ONGOING: 'Devam Ediyor',
  COMPLETED_STAGE: 'Tamamlandı',

  // Aid list status
  OPEN: 'Açık',
  CLOSED: 'Kapalı',

  // Aid list columns
  APPLICATION_NUMBER: 'Başvuru No',
  APPLICANT: 'Başvuran',
  APPLICANT_TYPE: 'Tür',
  ONE_TIME_AID: 'Tek Seferlik (₺)',
  REGULAR_FINANCIAL_AID: 'Düzenli Finansal (₺)',
  REGULAR_FOOD_AID: 'Düzenli Gıda (Paket)',
  IN_KIND_AID: 'Ayni (Adet)',
  STAGE: 'Aşama',
  STATUS: 'Durum',
  DATE: 'Tarih',
} as const;
