export const meetingActionItemStatusLabels: Record<
  'beklemede' | 'devam' | 'hazir' | 'iptal',
  string
> = {
  beklemede: 'Beklemede',
  devam: 'Devam Ediyor',
  hazir: 'Hazır',
  iptal: 'İptal',
};

export const meetingActionItemStatusColors: Record<
  keyof typeof meetingActionItemStatusLabels,
  string
> = {
  beklemede: 'bg-yellow-100 text-yellow-800',
  devam: 'bg-blue-100 text-blue-800',
  hazir: 'bg-green-100 text-green-700',
  iptal: 'bg-gray-200 text-gray-700',
};

export const meetingDecisionStatusLabels: Record<'acik' | 'devam' | 'kapatildi', string> = {
  acik: 'Açık',
  devam: 'Takipte',
  kapatildi: 'Kapatıldı',
};

export const meetingDecisionStatusColors: Record<keyof typeof meetingDecisionStatusLabels, string> =
  {
    acik: 'bg-orange-100 text-orange-800',
    devam: 'bg-indigo-100 text-indigo-700',
    kapatildi: 'bg-emerald-100 text-emerald-700',
  };

export const workflowNotificationStatusLabels: Record<
  'beklemede' | 'gonderildi' | 'okundu',
  string
> = {
  beklemede: 'Beklemede',
  gonderildi: 'Gönderildi',
  okundu: 'Okundu',
};

export const workflowNotificationStatusColors: Record<
  keyof typeof workflowNotificationStatusLabels,
  string
> = {
  beklemede: 'bg-yellow-100 text-yellow-700',
  gonderildi: 'bg-blue-100 text-blue-700',
  okundu: 'bg-green-100 text-green-700',
};

export const workflowNotificationCategoryLabels: Record<
  'meeting' | 'gorev' | 'rapor' | 'hatirlatma',
  string
> = {
  meeting: 'Toplantı',
  gorev: 'Görev',
  rapor: 'Rapor',
  hatirlatma: 'Hatırlatma',
};
