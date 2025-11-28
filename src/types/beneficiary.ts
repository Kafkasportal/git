// KafkasDer İhtiyaç Sahipleri Form Types
// KafkasDer sistemindeki form yapısının birebir kopyası

// === ENUMS ===

export enum BeneficiaryCategory {
  YETIM_AILESI = 'YETIM_AILESI',
  MULTECI_AILE = 'MULTECI_AILE',
  IHTIYAC_SAHIBI_AILE = 'IHTIYAC_SAHIBI_AILE',
  YETIM_COCUK = 'YETIM_COCUK',
  MULTECI_COCUK = 'MULTECI_COCUK',
  IHTIYAC_SAHIBI_COCUK = 'IHTIYAC_SAHIBI_COCUK',
  YETIM_GENCLIK = 'YETIM_GENCLIK',
  MULTECI_GENCLIK = 'MULTECI_GENCLIK',
  IHTIYAC_SAHIBI_GENCLIK = 'IHTIYAC_SAHIBI_GENCLIK',
}

export enum FundRegion {
  AVRUPA = 'AVRUPA',
  SERBEST = 'SERBEST',
}

export enum FileConnection {
  BAGIMSIZ = 'BAGIMSIZ',
  PARTNER_KURUM = 'PARTNER_KURUM',
  CALISMA_SAHASI = 'CALISMA_SAHASI',
}

export enum IdentityDocumentType {
  NUFUS_CUZDANI = 'NUFUS_CUZDANI',
  TC_KIMLIK_BELGESI = 'TC_KIMLIK_BELGESI',
  PASAPORT = 'PASAPORT',
  SURUCU_BELGESI = 'SURUCU_BELGESI',
  DIGER = 'DIGER',
}

export enum PassportType {
  DIPLOMATIK = 'DIPLOMATIK',
  GECICI = 'GECICI',
  UMUMI = 'UMUMI',
  HIZMET = 'HIZMET',
}

export enum Gender {
  ERKEK = 'ERKEK',
  KADIN = 'KADIN',
}

export enum MaritalStatus {
  BEKAR = 'BEKAR',
  EVLI = 'EVLI',
  BOŞANMIŞ = 'BOŞANMIŞ',
  DUL = 'DUL',
}

export enum EducationStatus {
  OKUMA_YAZMA_BILMIYOR = 'OKUMA_YAZMA_BILMIYOR',
  OKUMA_YAZMA_BILIYOR = 'OKUMA_YAZMA_BILIYOR',
  ILKOKUL = 'ILKOKUL',
  ORTAOKUL = 'ORTAOKUL',
  LISE = 'LISE',
  UNIVERSITE = 'UNIVERSITE',
  YUKSEK_LISANS = 'YUKSEK_LISANS',
  DOKTORA = 'DOKTORA',
}

export enum Religion {
  MUSLUMAN = 'MUSLUMAN',
  HRISTIYAN = 'HRISTIYAN',
  YAHUDI = 'YAHUDI',
  BUDIST = 'BUDIST',
  HINDU = 'HINDU',
  ATEIST = 'ATEIST',
  DIGER = 'DIGER',
}

export enum BloodType {
  A_POZITIF = 'A_POZITIF',
  A_NEGATIF = 'A_NEGATIF',
  B_POZITIF = 'B_POZITIF',
  B_NEGATIF = 'B_NEGATIF',
  AB_POZITIF = 'AB_POZITIF',
  AB_NEGATIF = 'AB_NEGATIF',
  O_POZITIF = 'O_POZITIF',
  O_NEGATIF = 'O_NEGATIF',
}

export enum SmokingStatus {
  ICER = 'ICER',
  ICMEZ = 'ICMEZ',
  BIRAKTI = 'BIRAKTI',
}

export enum DisabilityStatus {
  YOK = 'YOK',
  VAR = 'VAR',
}

export enum SocialSecurityStatus {
  VAR = 'VAR',
  YOK = 'YOK',
}

export enum WorkStatus {
  CALISMIYOR = 'CALISMIYOR',
  CALISIYOR = 'CALISIYOR',
  EMEKLI = 'EMEKLI',
  OGRENCI = 'OGRENCI',
}

export enum LivingPlace {
  EV = 'EV',
  KIRALIK = 'KIRALIK',
  YURT = 'YURT',
  BARINMA_MERKEZI = 'BARINMA_MERKEZI',
  DIGER = 'DIGER',
}

export enum IncomeSource {
  IS = 'IS',
  SOSYAL_YARDIM = 'SOSYAL_YARDIM',
  AILE_DESTEGI = 'AILE_DESTEGI',
  BURS = 'BURS',
  DIGER = 'DIGER',
}

export enum Sector {
  TARIM = 'TARIM',
  SANAYI = 'SANAYI',
  HIZMET = 'HIZMET',
  TICARET = 'TICARET',
  EGITIM = 'EGITIM',
  SAGLIK = 'SAGLIK',
  DEVLET = 'DEVLET',
  DIGER = 'DIGER',
}

export enum JobGroup {
  YONETICI = 'YONETICI',
  MEMUR = 'MEMUR',
  ISCI = 'ISCI',
  ESNAF = 'ESNAF',
  CALISAN = 'CALISAN',
  SERBEST_MESLEK = 'SERBEST_MESLEK',
  DIGER = 'DIGER',
}

export enum VisaType {
  TURIST = 'TURIST',
  CALISMA = 'CALISMA',
  EGITIM = 'EGITIM',
  AILE_BIRLESIMI = 'AILE_BIRLESIMI',
  INSANI = 'INSANI',
  DIGER = 'DIGER',
}

export enum EntryType {
  HAVAYOLU = 'HAVAYOLU',
  KARAYOLU = 'KARAYOLU',
  DENIZYOLU = 'DENIZYOLU',
  DIGER = 'DIGER',
}

export enum ReturnInfo {
  DONECEK = 'DONECEK',
  DONMEYECEK = 'DONMEYECEK',
  BELIRSIZ = 'BELIRSIZ',
}

export enum BeneficiaryStatus {
  TASLAK = 'TASLAK',
  AKTIF = 'AKTIF',
  PASIF = 'PASIF',
  SILINDI = 'SILINDI',
}

export enum SponsorType {
  BIREYSEL = 'BIREYSEL',
  KURUMSAL = 'KURUMSAL',
}

// === COUNTRIES ===
export enum Country {
  TURKIYE = 'TURKIYE',
  AFGANISTAN = 'AFGANISTAN',
  ALMANYA = 'ALMANYA',
  AMERIKA_BIRLESIK_DEVLETLERI = 'AMERIKA_BIRLESIK_DEVLETLERI',
  ARNAVUTLUK = 'ARNAVUTLUK',
  AVUSTRALYA = 'AVUSTRALYA',
  AZERBAYCAN = 'AZERBAYCAN',
  BANGLADES = 'BANGLADES',
  BELCIKA = 'BELCIKA',
  BOSNA_HERSEK = 'BOSNA_HERSEK',
  BULGARISTAN = 'BULGARISTAN',
  CIN = 'CIN',
  DANIMARKA = 'DANIMARKA',
  ERMENISTAN = 'ERMENISTAN',
  ESTONYA = 'ESTONYA',
  FINLANDIYA = 'FINLANDIYA',
  FRANSA = 'FRANSA',
  GURCISTAN = 'GURCISTAN',
  HINDISTAN = 'HINDISTAN',
  HOLLANDA = 'HOLLANDA',
  IRAK = 'IRAK',
  IRAN = 'IRAN',
  ISVEC = 'ISVEC',
  ISVICRE = 'ISVICRE',
  ITALYA = 'ITALYA',
  JAPONYA = 'JAPONYA',
  KANADA = 'KANADA',
  KAZAKISTAN = 'KAZAKISTAN',
  KIRGIZISTAN = 'KIRGIZISTAN',
  KUZEY_KIBRIS = 'KUZEY_KIBRIS',
  LIBYA = 'LIBYA',
  LITVANYA = 'LITVANYA',
  LUKSEMBURG = 'LUKSEMBURG',
  MACARISTAN = 'MACARISTAN',
  MAKEDONYA = 'MAKEDONYA',
  MISIR = 'MISIR',
  MOLDOVA = 'MOLDOVA',
  NORVEC = 'NORVEC',
  OZBEKISTAN = 'OZBEKISTAN',
  PAKISTAN = 'PAKISTAN',
  POLONYA = 'POLONYA',
  PORTEKIZ = 'PORTEKIZ',
  ROMANYA = 'ROMANYA',
  RUSYA = 'RUSYA',
  SIRBISTAN = 'SIRBISTAN',
  SLOVAKYA = 'SLOVAKYA',
  SLOVENYA = 'SLOVENYA',
  SOMALI = 'SOMALI',
  SURIYE = 'SURIYE',
  TACIKISTAN = 'TACIKISTAN',
  TUNUS = 'TUNUS',
  UKRAYNA = 'UKRAYNA',
  YEMEN = 'YEMEN',
  YUNANISTAN = 'YUNANISTAN',
  DIGER = 'DIGER',
}

// === TURKISH CITIES ===
export enum City {
  ADANA = 'ADANA',
  ADIYAMAN = 'ADIYAMAN',
  AFYONKARAHISAR = 'AFYONKARAHISAR',
  AGRI = 'AGRI',
  AKSARAY = 'AKSARAY',
  AMASYA = 'AMASYA',
  ANKARA = 'ANKARA',
  ANTALYA = 'ANTALYA',
  ARDAHAN = 'ARDAHAN',
  ARTVIN = 'ARTVIN',
  AYDIN = 'AYDIN',
  BALIKESIR = 'BALIKESIR',
  BARTIN = 'BARTIN',
  BATMAN = 'BATMAN',
  BAYBURT = 'BAYBURT',
  BILECIK = 'BILECIK',
  BINGOL = 'BINGOL',
  BITLIS = 'BITLIS',
  BOLU = 'BOLU',
  BURDUR = 'BURDUR',
  BURSA = 'BURSA',
  CANAKKALE = 'CANAKKALE',
  CANKIRI = 'CANKIRI',
  CORUM = 'CORUM',
  DENIZLI = 'DENIZLI',
  DIYARBAKIR = 'DIYARBAKIR',
  DUZCE = 'DUZCE',
  EDIRNE = 'EDIRNE',
  ELAZIG = 'ELAZIG',
  ERZINCAN = 'ERZINCAN',
  ERZURUM = 'ERZURUM',
  ESKISEHIR = 'ESKISEHIR',
  GAZIANTEP = 'GAZIANTEP',
  GIRESUN = 'GIRESUN',
  GUMUSHANE = 'GUMUSHANE',
  HAKKARI = 'HAKKARI',
  HATAY = 'HATAY',
  IGDIR = 'IGDIR',
  ISPARTA = 'ISPARTA',
  ISTANBUL = 'ISTANBUL',
  IZMIR = 'IZMIR',
  KAHRAMANMARAS = 'KAHRAMANMARAS',
  KARABUK = 'KARABUK',
  KARAMAN = 'KARAMAN',
  KARS = 'KARS',
  KASTAMONU = 'KASTAMONU',
  KAYSERI = 'KAYSERI',
  KILIS = 'KILIS',
  KIRIKKALE = 'KIRIKKALE',
  KIRKLARELI = 'KIRKLARELI',
  KIRSEHIR = 'KIRSEHIR',
  KOCAELI = 'KOCAELI',
  KONYA = 'KONYA',
  KUTAHYA = 'KUTAHYA',
  MALATYA = 'MALATYA',
  MANISA = 'MANISA',
  MARDIN = 'MARDIN',
  MERSIN = 'MERSIN',
  MUGLA = 'MUGLA',
  MUS = 'MUS',
  NEVSEHIR = 'NEVSEHIR',
  NIGDE = 'NIGDE',
  ORDU = 'ORDU',
  OSMANIYE = 'OSMANIYE',
  RIZE = 'RIZE',
  SAKARYA = 'SAKARYA',
  SAMSUN = 'SAMSUN',
  SANLIURFA = 'SANLIURFA',
  SIIRT = 'SIIRT',
  SINOP = 'SINOP',
  SIRNAK = 'SIRNAK',
  SIVAS = 'SIVAS',
  TEKIRDAG = 'TEKIRDAG',
  TOKAT = 'TOKAT',
  TRABZON = 'TRABZON',
  TUNCELI = 'TUNCELI',
  USAK = 'USAK',
  VAN = 'VAN',
  YALOVA = 'YALOVA',
  YOZGAT = 'YOZGAT',
  ZONGULDAK = 'ZONGULDAK',
}

// === DISEASES ===
export enum Disease {
  AKDENIZ_ANEMISI = 'AKDENIZ_ANEMISI',
  ALERJI = 'ALERJI',
  ASTIM = 'ASTIM',
  BAGISIKLIK_SISTEMI = 'BAGISIKLIK_SISTEMI',
  BOBREK = 'BOBREK',
  DIABET = 'DIABET',
  EPILEPSI = 'EPILEPSI',
  GORME_PROBLEMI = 'GORME_PROBLEMI',
  HASTALIK_YOK = 'HASTALIK_YOK',
  HEMOFILI = 'HEMOFILI',
  HEPATIT = 'HEPATIT',
  HIV_AIDS = 'HIV_AIDS',
  HORMONAL = 'HORMONAL',
  ISITME_PROBLEMI = 'ISITME_PROBLEMI',
  KALP_DAMAR = 'KALP_DAMAR',
  KANSER = 'KANSER',
  KARACIGER = 'KARACIGER',
  KEMIK_EKLEM = 'KEMIK_EKLEM',
  KROMOZOMAL = 'KROMOZOMAL',
  METABOLIK = 'METABOLIK',
  NOROLOJIK = 'NOROLOJIK',
  PSIKIYATRIK = 'PSIKIYATRIK',
  ROMATIZMAL = 'ROMATIZMAL',
  SOLUNUM = 'SOLUNUM',
  TALASEMI = 'TALASEMI',
  TANSION = 'TANSION',
  TIRIOD = 'TIRIOD',
  TUBERKUOZ = 'TUBERKUOZ',
  UREME_SISTEMI = 'UREME_SISTEMI',
  YUKSEK_TANSION = 'YUKSEK_TANSION',
  DIGER = 'DIGER',
}

// === LABELS ===
export enum Label {
  DEPREMZEDE = 'DEPREMZEDE',
  SURIYE_MULTECISI = 'SURIYE_MULTECISI',
  AFGAN_MULTECISI = 'AFGAN_MULTECISI',
  DIGER_MULTECI = 'DIGER_MULTECI',
}

// === INTERFACES ===

// Hızlı Kayıt için minimal interface
export interface BeneficiaryQuickAdd {
  category: BeneficiaryCategory;
  firstName: string;
  lastName: string;
  nationality: string;
  birthDate?: Date; // Form input - Date object olarak kalır
  identityNumber?: string;
  mernisCheck?: boolean;
  fundRegion: FundRegion;
  fileConnection: FileConnection;
  fileNumber: string;
}

// Acil durum iletişim kişisi
export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

// Ana Beneficiary interface - Tüm form alanlarını içerir
export interface Beneficiary {
  // === TEMEL BİLGİLER ===
  id: string;
  photo?: string;
  sponsorType?: SponsorType;
  firstName: string;
  lastName: string;
  nationality: string;
  identityNumber?: string;
  mernisCheck?: boolean;
  category: BeneficiaryCategory;
  fundRegion: FundRegion;
  fileConnection: FileConnection;
  fileNumber: string;

  // İletişim Bilgileri
  mobilePhone?: string;
  mobilePhoneCode?: string;
  landlinePhone?: string;
  internationalPhone?: string;
  email?: string;

  // Bağlantılar
  linkedOrphan?: string;
  linkedCard?: string;
  familyMemberCount?: number;

  // Adres Bilgileri
  country?: Country;
  city?: City;
  district?: string;
  neighborhood?: string;
  address?: string;

  // Durum ve Rıza
  consentStatement?: string;
  deleteRecord?: boolean;
  status: BeneficiaryStatus;

  // === KİMLİK BİLGİLERİ ===
  fatherName?: string;
  motherName?: string;
  identityDocumentType?: IdentityDocumentType;
  identityIssueDate?: Date;
  identityExpiryDate?: Date;
  identitySerialNumber?: string;
  previousNationality?: string;
  previousName?: string;

  // Pasaport ve Vize
  passportType?: PassportType;
  passportNumber?: string;
  passportExpiryDate?: Date;
  visaType?: VisaType;
  visaExpiryDate?: Date;
  entryType?: EntryType;
  returnInfo?: ReturnInfo;

  // === KİŞİSEL VERİLER ===
  gender?: Gender;
  birthPlace?: string;
  birthDate?: Date;
  maritalStatus?: MaritalStatus;
  educationStatus?: EducationStatus;
  educationLevel?: string;
  religion?: Religion;
  criminalRecord?: boolean;

  // İş ve Gelir Durumu
  livingPlace?: LivingPlace;
  incomeSources?: IncomeSource[];
  monthlyIncome?: number;
  monthlyExpense?: number;
  socialSecurity?: SocialSecurityStatus;
  workStatus?: WorkStatus;
  sector?: Sector;
  jobGroup?: JobGroup;
  jobDescription?: string;

  // İlave Açıklamalar
  additionalNotesTurkish?: string;
  additionalNotesEnglish?: string;
  additionalNotesArabic?: string;

  // === SAĞLIK DURUMU ===
  bloodType?: BloodType;
  smokingStatus?: SmokingStatus;
  healthProblem?: string;
  disabilityStatus?: DisabilityStatus;
  prosthetics?: string;
  regularMedications?: string;
  surgeries?: string;
  healthNotes?: string;
  diseases?: Disease[];

  // Acil Durum İletişimi
  emergencyContacts?: EmergencyContact[];

  // Kayıt Bilgisi
  registrationTime?: Date;
  registrationIP?: string;
  registeredBy?: string;
  totalAidAmount?: number;

  // Etiketler ve Özel Durumlar
  labels?: Label[];
  earthquakeVictim?: boolean;

  // === METADATA ===
  createdAt: string; // ISO 8601 format
  updatedAt: string; // ISO 8601 format
  createdBy: string;
  updatedBy: string;
}

// Form state için yardımcı tipler
export type BeneficiaryFormData = Partial<Beneficiary>;

export interface BeneficiaryFormErrors {
  [key: string]: string | undefined;
}

// API Response tipleri
export interface BeneficiaryListResponse {
  data: Beneficiary[];
  total: number;
  page: number;
  limit: number;
}

export interface BeneficiaryResponse {
  data: Beneficiary;
  success: boolean;
  message?: string;
}

// Search ve filter tipleri
export interface BeneficiarySearchParams {
  search?: string;
  category?: BeneficiaryCategory;
  fundRegion?: FundRegion;
  status?: BeneficiaryStatus;
  country?: Country;
  city?: City;
  page?: number;
  limit?: number;
}

// File upload tipleri
export interface PhotoUploadResponse {
  success: boolean;
  photoUrl?: string;
  message?: string;
}

// Mernis kontrolü için tip
export interface MernisCheckResponse {
  isValid: boolean;
  message?: string;
  data?: {
    firstName: string;
    lastName: string;
    birthDate: Date; // Mernis API response
    nationality: string;
  };
}
