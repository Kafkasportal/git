// KafkasDer İhtiyaç Sahipleri Form Validation Schemas
// Zod ile form validasyonu

import { z } from 'zod';
import {
  BeneficiaryCategory,
  FundRegion,
  FileConnection,
  IdentityDocumentType,
  PassportType,
  Gender,
  MaritalStatus,
  EducationStatus,
  Religion,
  BloodType,
  SmokingStatus,
  DisabilityStatus,
  SocialSecurityStatus,
  WorkStatus,
  LivingPlace,
  IncomeSource,
  Sector,
  JobGroup,
  VisaType,
  EntryType,
  ReturnInfo,
  BeneficiaryStatus,
  SponsorType,
  Country,
  City,
  Disease,
  Label,
} from '@/types/beneficiary';
import { phoneSchema } from './shared-validators';

// === HELPER VALIDATORS ===

// TC Kimlik No validasyonu (11 hane, algoritma kontrolü)
const tcKimlikNoSchema = z
  .string()
  .length(11, 'TC Kimlik No 11 haneli olmalıdır')
  .regex(/^\d{11}$/, 'TC Kimlik No sadece rakam içermelidir')
  .refine((value) => {
    // İlk hane 0 olamaz
    if (value[0] === '0') return false;

    // TC Kimlik No algoritma kontrolü
    const digits = value.split('').map(Number);

    // 10. hane kontrolü: (1,3,5,7,9. hanelerin toplamı * 7 - 2,4,6,8. hanelerin toplamı) % 10
    const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
    const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
    const check10 = (oddSum * 7 - evenSum) % 10;

    if (digits[9] !== check10) return false;

    // 11. hane kontrolü: (İlk 10 hanenin toplamı) % 10
    const sum10 = digits.slice(0, 10).reduce((sum, digit) => sum + digit, 0);
    const check11 = sum10 % 10;

    return digits[10] === check11;
  }, 'Geçersiz TC Kimlik No');

// phoneSchema is now imported from shared-validators

// Email validasyonu
const emailSchema = z
  .string()
  .email('Geçerli bir email adresi giriniz')
  .optional()
  .or(z.literal(''));

// Tarih validasyonu (geçmiş tarih kontrolü)
const pastDateSchema = z
  .date()
  .refine((date) => date <= new Date(), 'Geçmiş bir tarih seçiniz')
  .optional();

// Yaş hesaplama (doğum tarihinden)
const calculateAge = (birthDate: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

// === HIZLI KAYIT SCHEMA ===
export const quickAddBeneficiarySchema = z.object({
  category: z.nativeEnum(BeneficiaryCategory, {
    message: 'Kategori seçiniz',
  }),
  firstName: z
    .string()
    .min(2, 'Ad en az 2 karakter olmalıdır')
    .max(50, 'Ad en fazla 50 karakter olmalıdır')
    .regex(/^[a-zA-ZçğıöşüÇĞIİÖŞÜ\s]+$/, 'Ad sadece harf içerebilir'),
  lastName: z
    .string()
    .min(2, 'Soyad en az 2 karakter olmalıdır')
    .max(50, 'Soyad en fazla 50 karakter olmalıdır')
    .regex(/^[a-zA-ZçğıöşüÇĞIİÖŞÜ\s]+$/, 'Soyad sadece harf içerebilir'),
  nationality: z
    .string()
    .min(2, 'Uyruk en az 2 karakter olmalıdır')
    .max(50, 'Uyruk en fazla 50 karakter olmalıdır'),
  birthDate: pastDateSchema,
  identityNumber: tcKimlikNoSchema.optional(),
  mernisCheck: z.boolean().default(false),
  fundRegion: z.nativeEnum(FundRegion, {
    message: 'Fon bölgesi seçiniz',
  }),
  fileConnection: z.nativeEnum(FileConnection, {
    message: 'Dosya bağlantısı seçiniz',
  }),
  fileNumber: z
    .string()
    .min(1, 'Dosya numarası zorunludur')
    .max(20, 'Dosya numarası en fazla 20 karakter olmalıdır')
    .regex(/^[A-Z0-9]+$/, 'Dosya numarası sadece büyük harf ve rakam içerebilir'),
});

// === DETAYLI FORM SCHEMA ===
export const beneficiarySchema = z
  .object({
    // Temel Bilgiler
    id: z.string().optional(),
    photo: z.string().optional(),
    sponsorType: z.nativeEnum(SponsorType).optional(),
    firstName: z
      .string()
      .min(2, 'Ad en az 2 karakter olmalıdır')
      .max(50, 'Ad en fazla 50 karakter olmalıdır')
      .regex(/^[a-zA-ZçğıöşüÇĞIİÖŞÜ\s]+$/, 'Ad sadece harf içerebilir'),
    lastName: z
      .string()
      .min(2, 'Soyad en az 2 karakter olmalıdır')
      .max(50, 'Soyad en fazla 50 karakter olmalıdır')
      .regex(/^[a-zA-ZçğıöşüÇĞIİÖŞÜ\s]+$/, 'Soyad sadece harf içerebilir'),
    nationality: z
      .string()
      .min(2, 'Uyruk en az 2 karakter olmalıdır')
      .max(50, 'Uyruk en fazla 50 karakter olmalıdır'),
    identityNumber: tcKimlikNoSchema.optional(),
    mernisCheck: z.boolean().default(false),
    category: z.nativeEnum(BeneficiaryCategory, {
      message: 'Kategori seçiniz',
    }),
    fundRegion: z.nativeEnum(FundRegion, {
      message: 'Fon bölgesi seçiniz',
    }),
    fileConnection: z.nativeEnum(FileConnection, {
      message: 'Dosya bağlantısı seçiniz',
    }),
    fileNumber: z
      .string()
      .min(1, 'Dosya numarası zorunludur')
      .max(20, 'Dosya numarası en fazla 20 karakter olmalıdır')
      .regex(/^[A-Z0-9]+$/, 'Dosya numarası sadece büyük harf ve rakam içerebilir'),

    // İletişim Bilgileri
    mobilePhone: phoneSchema,
    mobilePhoneCode: z.string().optional(),
    landlinePhone: phoneSchema,
    internationalPhone: z.string().optional(),
    email: emailSchema,

    // Bağlantılar
    linkedOrphan: z.string().optional(),
    linkedCard: z.string().optional(),
    familyMemberCount: z
      .number()
      .min(1, 'Ailedeki kişi sayısı en az 1 olmalıdır')
      .max(20, 'Ailedeki kişi sayısı en fazla 20 olmalıdır')
      .optional(),

    // Adres Bilgileri
    country: z.nativeEnum(Country).optional(),
    city: z.nativeEnum(City).optional(),
    district: z.string().max(100).optional(),
    neighborhood: z.string().max(100).optional(),
    address: z.string().max(500).optional(),

    // Durum ve Rıza
    consentStatement: z.string().optional(),
    deleteRecord: z.boolean().default(false),
    status: z.nativeEnum(BeneficiaryStatus).default(BeneficiaryStatus.TASLAK),

    // Kimlik Bilgileri
    fatherName: z
      .string()
      .max(50, 'Baba adı en fazla 50 karakter olmalıdır')
      .regex(/^[a-zA-ZçğıöşüÇĞIİÖŞÜ\s]*$/, 'Baba adı sadece harf içerebilir')
      .optional(),
    motherName: z
      .string()
      .max(50, 'Anne adı en fazla 50 karakter olmalıdır')
      .regex(/^[a-zA-ZçğıöşüÇĞIİÖŞÜ\s]*$/, 'Anne adı sadece harf içerebilir')
      .optional(),
    identityDocumentType: z.nativeEnum(IdentityDocumentType).optional(),
    identityIssueDate: z.string().optional(), // Changed from date to string for form compatibility
    identityExpiryDate: z.string().optional(), // Changed from date to string for form compatibility
    identitySerialNumber: z.string().max(50).optional(),
    previousNationality: z.string().max(50).optional(),
    previousName: z.string().max(100).optional(),

    // Pasaport ve Vize
    passportType: z.nativeEnum(PassportType).optional(),
    passportNumber: z.string().max(50).optional(),
    passportExpiryDate: z.string().optional(), // Changed from date to string for form compatibility
    visaType: z.nativeEnum(VisaType).optional(),
    visaExpiryDate: z.string().optional(), // Changed from date to string for form compatibility
    entryType: z.nativeEnum(EntryType).optional(),
    returnInfo: z.nativeEnum(ReturnInfo).optional(),

    // Kişisel Veriler
    gender: z.nativeEnum(Gender).optional(),
    birthPlace: z.string().max(100).optional(),
    birthDate: z.string().optional(), // Changed from date to string for form compatibility
    maritalStatus: z.nativeEnum(MaritalStatus).optional(),
    educationStatus: z.nativeEnum(EducationStatus).optional(),
    educationLevel: z.string().max(100).optional(),
    religion: z.nativeEnum(Religion).optional(),
    criminalRecord: z.boolean().default(false),

    // İş ve Gelir Durumu
    livingPlace: z.nativeEnum(LivingPlace).optional(),
    incomeSources: z.array(z.nativeEnum(IncomeSource)).optional(),
    monthlyIncome: z
      .number()
      .min(0, 'Aylık gelir negatif olamaz')
      .max(1000000, 'Aylık gelir çok yüksek')
      .optional(),
    monthlyExpense: z
      .number()
      .min(0, 'Aylık gider negatif olamaz')
      .max(1000000, 'Aylık gider çok yüksek')
      .optional(),
    socialSecurity: z.nativeEnum(SocialSecurityStatus).optional(),
    workStatus: z.nativeEnum(WorkStatus).optional(),
    sector: z.nativeEnum(Sector).optional(),
    jobGroup: z.nativeEnum(JobGroup).optional(),
    jobDescription: z.string().max(200).optional(),

    // İlave Açıklamalar
    additionalNotesTurkish: z.string().max(1000).optional(),
    additionalNotesEnglish: z.string().max(1000).optional(),
    additionalNotesArabic: z.string().max(1000).optional(),

    // Sağlık Durumu
    bloodType: z.nativeEnum(BloodType).optional(),
    smokingStatus: z.nativeEnum(SmokingStatus).optional(),
    healthProblem: z.string().max(500).optional(),
    disabilityStatus: z.nativeEnum(DisabilityStatus).optional(),
    prosthetics: z.string().max(200).optional(),
    regularMedications: z.string().max(200).optional(),
    surgeries: z.string().max(200).optional(),
    healthNotes: z.string().max(500).optional(),
    diseases: z.array(z.nativeEnum(Disease)).optional(),

    // Conditional health fields
    hasChronicIllness: z.boolean().default(false),
    chronicIllnessDetail: z.string().min(3).optional(),
    hasDisability: z.boolean().default(false),
    disabilityDetail: z.string().min(3).optional(),
    has_health_insurance: z.boolean().default(false),

    // Acil Durum İletişimi
    emergencyContacts: z
      .array(
        z.object({
          name: z
            .string()
            .min(2, 'İsim en az 2 karakter olmalıdır')
            .max(50, 'İsim en fazla 50 karakter olmalıdır'),
          relationship: z
            .string()
            .min(2, 'Yakınlık en az 2 karakter olmalıdır')
            .max(50, 'Yakınlık en fazla 50 karakter olmalıdır'),
          phone: phoneSchema,
        })
      )
      .max(2, 'En fazla 2 acil durum iletişim kişisi eklenebilir')
      .optional(),

    // Kayıt Bilgisi
    registrationTime: z.string().optional(), // Changed from date to string for form compatibility
    registrationIP: z.string().optional(),
    registeredBy: z.string().optional(),
    totalAidAmount: z.number().min(0, 'Toplam yardım tutarı negatif olamaz').optional(),

    // Etiketler ve Özel Durumlar
    labels: z.array(z.nativeEnum(Label)).optional(),
    earthquakeVictim: z.boolean().default(false),

    // Additional fields used in AdvancedBeneficiaryForm
    children_count: z.number().min(0).max(50).default(0),
    orphan_children_count: z.number().min(0).max(50).default(0),
    elderly_count: z.number().min(0).max(50).default(0),
    disabled_count: z.number().min(0).max(50).default(0),
    has_debt: z.boolean().default(false),
    has_vehicle: z.boolean().default(false),
    income_level: z.string().optional(),
    occupation: z.string().optional(),
    employment_status: z.string().optional(),
    aidType: z.string().optional(),
    aid_duration: z.string().optional(),
    priority: z.string().optional(),
    emergency: z.boolean().default(false),
    previous_aid: z.boolean().default(false),
    other_organization_aid: z.boolean().default(false),
    referenceName: z.string().optional(),
    referencePhone: z.string().optional(),
    referenceRelation: z.string().optional(),
    applicationSource: z.string().optional(),
    contactPreference: z.string().optional(),
    notes: z.string().max(2000).optional(),

    // Metadata
    createdAt: z.string().datetime().optional(), // ISO 8601 string
    updatedAt: z.string().datetime().optional(), // ISO 8601 string
    createdBy: z.string().optional(),
    updatedBy: z.string().optional(),
  })
  .refine(
    (data) => {
      // Yaş kontrolü (18 yaşından küçükler için özel kurallar)
      if (data.birthDate) {
        // Parse string date for age calculation
        const birthDate = new Date(data.birthDate);
        if (!isNaN(birthDate.getTime())) {
          const age = calculateAge(birthDate);
          if (age < 18 && data.maritalStatus === MaritalStatus.EVLI) {
            return false; // 18 yaşından küçük evli olamaz
          }
        }
      }
      return true;
    },
    {
      message: '18 yaşından küçük kişiler evli olamaz',
      path: ['maritalStatus'],
    }
  )
  .refine(
    (data) => {
      // Kimlik No ve Mernis kontrolü uyumu
      if (data.identityNumber && data.identityNumber.length === 11 && !data.mernisCheck) {
        return false; // TC Kimlik No varsa Mernis kontrolü yapılmalı
      }
      return true;
    },
    {
      message: 'TC Kimlik No girildiğinde Mernis kontrolü yapılmalıdır',
      path: ['mernisCheck'],
    }
  )
  .refine(
    (data) => {
      // Kronik hastalık detayı kontrolü
      if (
        data.hasChronicIllness &&
        (!data.chronicIllnessDetail || data.chronicIllnessDetail.length < 3)
      ) {
        return false;
      }
      return true;
    },
    {
      message: 'Kronik hastalık seçildiğinde detay girilmelidir',
      path: ['chronicIllnessDetail'],
    }
  )
  .refine(
    (data) => {
      // Engellilik detayı kontrolü
      if (data.hasDisability && (!data.disabilityDetail || data.disabilityDetail.length < 3)) {
        return false;
      }
      return true;
    },
    {
      message: 'Engellilik durumu seçildiğinde detay girilmelidir',
      path: ['disabilityDetail'],
    }
  );

// === FORM SECTION SCHEMAS ===

// Temel Bilgiler sekmesi için schema
export const basicInfoSchema = beneficiarySchema.pick({
  photo: true,
  sponsorType: true,
  firstName: true,
  lastName: true,
  nationality: true,
  identityNumber: true,
  mernisCheck: true,
  category: true,
  fundRegion: true,
  fileConnection: true,
  fileNumber: true,
  mobilePhone: true,
  mobilePhoneCode: true,
  landlinePhone: true,
  internationalPhone: true,
  email: true,
  linkedOrphan: true,
  linkedCard: true,
  familyMemberCount: true,
  country: true,
  city: true,
  district: true,
  neighborhood: true,
  address: true,
  consentStatement: true,
  deleteRecord: true,
  status: true,
});

// Kimlik Bilgileri sekmesi için schema
export const identityInfoSchema = beneficiarySchema.pick({
  fatherName: true,
  motherName: true,
  identityDocumentType: true,
  identityIssueDate: true,
  identityExpiryDate: true,
  identitySerialNumber: true,
  previousNationality: true,
  previousName: true,
  passportType: true,
  passportNumber: true,
  passportExpiryDate: true,
  visaType: true,
  visaExpiryDate: true,
  entryType: true,
  returnInfo: true,
});

// Kişisel Veriler sekmesi için schema
export const personalDataSchema = beneficiarySchema.pick({
  gender: true,
  birthPlace: true,
  birthDate: true,
  maritalStatus: true,
  educationStatus: true,
  educationLevel: true,
  religion: true,
  criminalRecord: true,
  livingPlace: true,
  incomeSources: true,
  monthlyIncome: true,
  monthlyExpense: true,
  socialSecurity: true,
  workStatus: true,
  sector: true,
  jobGroup: true,
  jobDescription: true,
  additionalNotesTurkish: true,
  additionalNotesEnglish: true,
  additionalNotesArabic: true,
});

// Sağlık Durumu sekmesi için schema
export const healthInfoSchema = beneficiarySchema.pick({
  bloodType: true,
  smokingStatus: true,
  healthProblem: true,
  disabilityStatus: true,
  prosthetics: true,
  regularMedications: true,
  surgeries: true,
  healthNotes: true,
  diseases: true,
  emergencyContacts: true,
  registrationTime: true,
  registrationIP: true,
  registeredBy: true,
  totalAidAmount: true,
  labels: true,
  earthquakeVictim: true,
});

// === TYPE EXPORTS ===
export type QuickAddBeneficiaryFormData = z.infer<typeof quickAddBeneficiarySchema>;
export type BeneficiaryFormData = z.infer<typeof beneficiarySchema>;
export type BasicInfoFormData = z.infer<typeof basicInfoSchema>;
export type IdentityInfoFormData = z.infer<typeof identityInfoSchema>;
export type PersonalDataFormData = z.infer<typeof personalDataSchema>;
export type HealthInfoFormData = z.infer<typeof healthInfoSchema>;
