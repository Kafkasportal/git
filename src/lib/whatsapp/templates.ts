export type TemplateCategory = 'yardim' | 'burs' | 'bagis' | 'toplanti' | 'genel';

export interface MessageTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  content: string;
  variables: string[];
  description: string;
}

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  // Yardim Bildirimleri
  {
    id: 'yardim_onay',
    name: 'Yardim Basvurusu Onay',
    category: 'yardim',
    content: `Sayin {{isim}},

{{dernek_adi}} olarak yardim basvurunuz onaylanmistir.

Yardim Turu: {{yardim_turu}}
Tarih: {{tarih}}

Detaylar icin dernegimizle iletisime gecebilirsiniz.

Saygilarimizla,
{{dernek_adi}}`,
    variables: ['isim', 'dernek_adi', 'yardim_turu', 'tarih'],
    description: 'Yardim basvurusu onaylandiginda gonderilir',
  },
  {
    id: 'yardim_red',
    name: 'Yardim Basvurusu Red',
    category: 'yardim',
    content: `Sayin {{isim}},

{{dernek_adi}} olarak yardim basvurunuzu degerlendirdik.

Maalesef bu donemde basvurunuz kabul edilememistir. Sonraki donemlerde tekrar basvuru yapabilirsiniz.

Saygilarimizla,
{{dernek_adi}}`,
    variables: ['isim', 'dernek_adi'],
    description: 'Yardim basvurusu reddedildiginde gonderilir',
  },
  {
    id: 'yardim_teslim',
    name: 'Yardim Teslim Bildirimi',
    category: 'yardim',
    content: `Sayin {{isim}},

{{dernek_adi}} olarak size yardim teslim edilecektir.

Teslim Tarihi: {{tarih}}
Teslim Yeri: {{adres}}
Yardim Icerigi: {{icerik}}

Lutfen belirtilen tarih ve saatte hazir bulununuz.

Saygilarimizla,
{{dernek_adi}}`,
    variables: ['isim', 'dernek_adi', 'tarih', 'adres', 'icerik'],
    description: 'Yardim teslim edileceginde gonderilir',
  },

  // Burs Bildirimleri
  {
    id: 'burs_onay',
    name: 'Burs Basvurusu Onay',
    category: 'burs',
    content: `Sayin {{isim}},

{{dernek_adi}} burs basvurunuz kabul edilmistir.

Burs Turu: {{burs_turu}}
Aylik Miktar: {{miktar}} TL
Baslangic Tarihi: {{tarih}}

Burs odemeniz her ayin {{odeme_gunu}}. gununde hesabiniza yatirilacaktir.

Saygilarimizla,
{{dernek_adi}}`,
    variables: ['isim', 'dernek_adi', 'burs_turu', 'miktar', 'tarih', 'odeme_gunu'],
    description: 'Burs basvurusu kabul edildiginde gonderilir',
  },
  {
    id: 'burs_odeme',
    name: 'Burs Odeme Bildirimi',
    category: 'burs',
    content: `Sayin {{isim}},

{{ay}} ayi burs odemeniz hesabiniza yatirilmistir.

Miktar: {{miktar}} TL
Tarih: {{tarih}}

Hayirli olsun.

Saygilarimizla,
{{dernek_adi}}`,
    variables: ['isim', 'dernek_adi', 'ay', 'miktar', 'tarih'],
    description: 'Burs odemesi yapildiginda gonderilir',
  },

  // Bagis Bildirimleri
  {
    id: 'bagis_tesekkur',
    name: 'Bagis Tesekkur',
    category: 'bagis',
    content: `Sayin {{isim}},

{{dernek_adi}} olarak yaptiginiz bagis icin tesekkur ederiz.

Bagis Miktari: {{miktar}} TL
Bagis Tarihi: {{tarih}}
Bagis No: {{bagis_no}}

Allah kabul etsin.

Saygilarimizla,
{{dernek_adi}}`,
    variables: ['isim', 'dernek_adi', 'miktar', 'tarih', 'bagis_no'],
    description: 'Bagis yapildiginda tesekkur mesaji',
  },
  {
    id: 'kumbara_hatirlatma',
    name: 'Kumbara Toplama Hatirlatma',
    category: 'bagis',
    content: `Sayin {{isim}},

{{dernek_adi}} kumbara toplama zamani gelmistir.

Kumbaranizi {{tarih}} tarihinde adresinizden alacagiz.

Sorulariniz icin: {{telefon}}

Saygilarimizla,
{{dernek_adi}}`,
    variables: ['isim', 'dernek_adi', 'tarih', 'telefon'],
    description: 'Kumbara toplama hatirlatmasi',
  },

  // Toplanti Bildirimleri
  {
    id: 'toplanti_davet',
    name: 'Toplanti Daveti',
    category: 'toplanti',
    content: `Sayin {{isim}},

{{dernek_adi}} {{toplanti_turu}} toplantisina davetlisiniz.

Tarih: {{tarih}}
Saat: {{saat}}
Yer: {{yer}}

Gundem:
{{gundem}}

Katiliminizi bekliyoruz.

Saygilarimizla,
{{dernek_adi}}`,
    variables: ['isim', 'dernek_adi', 'toplanti_turu', 'tarih', 'saat', 'yer', 'gundem'],
    description: 'Toplanti daveti',
  },
  {
    id: 'toplanti_hatirlatma',
    name: 'Toplanti Hatirlatma',
    category: 'toplanti',
    content: `Sayin {{isim}},

Hatirlatma: {{dernek_adi}} toplantisi yarin gerceklesecektir.

Tarih: {{tarih}}
Saat: {{saat}}
Yer: {{yer}}

Katiliminizi bekliyoruz.

Saygilarimizla,
{{dernek_adi}}`,
    variables: ['isim', 'dernek_adi', 'tarih', 'saat', 'yer'],
    description: 'Toplanti oncesi hatirlatma',
  },

  // Genel Bildirimler
  {
    id: 'genel_duyuru',
    name: 'Genel Duyuru',
    category: 'genel',
    content: `Sayin {{isim}},

{{dernek_adi}} duyurusu:

{{duyuru_metni}}

Saygilarimizla,
{{dernek_adi}}`,
    variables: ['isim', 'dernek_adi', 'duyuru_metni'],
    description: 'Genel duyuru mesaji',
  },
  {
    id: 'iyi_dilekler',
    name: 'Bayram/Ozel Gun Tebrik',
    category: 'genel',
    content: `Sayin {{isim}},

{{dernek_adi}} olarak {{ozel_gun}} kutlu olsun dileriz.

{{mesaj}}

Saygilarimizla,
{{dernek_adi}}`,
    variables: ['isim', 'dernek_adi', 'ozel_gun', 'mesaj'],
    description: 'Bayram ve ozel gun mesajlari',
  },
];

export function getTemplatesByCategory(category: TemplateCategory): MessageTemplate[] {
  return MESSAGE_TEMPLATES.filter((t) => t.category === category);
}

export function getTemplateById(id: string): MessageTemplate | undefined {
  return MESSAGE_TEMPLATES.find((t) => t.id === id);
}

export function fillTemplate(
  template: MessageTemplate,
  values: Record<string, string>
): string {
  let content = template.content;

  for (const variable of template.variables) {
    const value = values[variable] || `{{${variable}}}`;
    content = content.replace(new RegExp(`{{${variable}}}`, 'g'), value);
  }

  return content;
}
