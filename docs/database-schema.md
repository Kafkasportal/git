# 🗄️ Veritabanı Şeması

Bu döküman, Appwrite veritabanı collection yapılarını ve ilişkilerini açıklar.

## 📊 Collection Haritası

```
┌─────────────────────────────────────────────────────────────────┐
│                        CORE ENTITIES                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────────┐    │
│  │    users    │   │beneficiaries│   │     donations       │    │
│  └──────┬──────┘   └──────┬──────┘   └──────────┬──────────┘    │
│         │                 │                      │               │
│         │    ┌────────────┴────────────┐        │               │
│         │    │                         │        │               │
│         ▼    ▼                         ▼        ▼               │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────────┐    │
│  │  dependents │   │  consents   │   │   aid_applications  │    │
│  └─────────────┘   └─────────────┘   └─────────────────────┘    │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                      WORKFLOW ENTITIES                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐   ┌──────────────────┐   ┌─────────────────┐   │
│  │  meetings   │──▶│meeting_decisions │──▶│meeting_actions  │   │
│  └─────────────┘   └──────────────────┘   └─────────────────┘   │
│         │                                                        │
│         └──────────────────────────────────────────────────────┐│
│                                                                 ││
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────────┐   ││
│  │    tasks    │   │    todos    │   │workflow_notifications│◀──┘│
│  └─────────────┘   └─────────────┘   └─────────────────────┘    │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                      FINANCE ENTITIES                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐   ┌─────────────────────────────────────┐  │
│  │ finance_records │   │         scholarships                │  │
│  └─────────────────┘   │  ┌───────────────────────────────┐  │  │
│                        │  │ scholarship_applications      │  │  │
│                        │  └───────────────┬───────────────┘  │  │
│                        │                  ▼                   │  │
│                        │  ┌───────────────────────────────┐  │  │
│                        │  │  scholarship_payments         │  │  │
│                        │  └───────────────────────────────┘  │  │
│                        └─────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 👤 Users Collection

Sistem kullanıcıları.

```typescript
interface UserDocument {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  
  name: string;              // Kullanıcı adı
  email: string;             // E-posta (unique)
  role: string;              // Rol adı
  permissions: string[];     // İzin dizisi
  avatar?: string;           // Avatar URL
  isActive: boolean;         // Aktiflik durumu
  labels?: string[];         // Etiketler
  phone?: string;            // Telefon
  lastLogin?: string;        // Son giriş tarihi
}
```

**İndeksler:**
- `email` (unique)
- `role`
- `isActive`

---

## 👥 Beneficiaries Collection

İhtiyaç sahipleri.

```typescript
interface BeneficiaryDocument {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  
  // Temel Bilgiler
  name: string;              // Ad Soyad
  tc_no: string;             // TC Kimlik No (unique)
  phone: string;             // Telefon
  email?: string;            // E-posta
  birth_date?: string;       // Doğum tarihi
  gender?: string;           // Cinsiyet (parametre)
  nationality?: string;      // Uyruk
  religion?: string;         // Din (parametre)
  marital_status?: string;   // Medeni durum (parametre)
  
  // Adres Bilgileri
  address: string;           // Açık adres
  city: string;              // Şehir
  district: string;          // İlçe
  neighborhood: string;      // Mahalle
  
  // Aile Bilgileri
  family_size: number;       // Hane halkı sayısı
  children_count?: number;   // Çocuk sayısı
  orphan_children_count?: number;  // Yetim çocuk sayısı
  elderly_count?: number;    // Yaşlı sayısı
  disabled_count?: number;   // Engelli sayısı
  
  // Ekonomik Durum
  income_level?: string;     // Gelir düzeyi (parametre)
  income_source?: string;    // Gelir kaynağı
  has_debt?: boolean;        // Borç durumu
  housing_type?: string;     // Konut tipi (parametre)
  has_vehicle?: boolean;     // Araç durumu
  
  // Sağlık Bilgileri
  health_status?: string;    // Sağlık durumu
  has_chronic_illness?: boolean;  // Kronik hastalık
  chronic_illness_detail?: string;
  has_disability?: boolean;  // Engellilik durumu
  disability_detail?: string;
  has_health_insurance?: boolean;
  regular_medication?: string;
  
  // Eğitim ve İstihdam
  education_level?: string;  // Eğitim düzeyi (parametre)
  occupation?: string;       // Meslek (parametre)
  employment_status?: string; // Çalışma durumu (parametre)
  
  // Yardım Bilgileri
  aid_type?: string;         // Yardım türü
  totalAidAmount?: number;   // Toplam alınan yardım
  aid_duration?: string;     // Yardım süresi
  priority?: string;         // Öncelik
  
  // Referans
  reference_name?: string;
  reference_phone?: string;
  reference_relation?: string;
  application_source?: string;
  
  // Ek Bilgiler
  notes?: string;
  previous_aid?: boolean;
  other_organization_aid?: boolean;
  emergency?: boolean;
  contact_preference?: string;
  
  // Durum
  status: 'TASLAK' | 'AKTIF' | 'PASIF' | 'SILINDI';
  approval_status?: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  
  // Meta
  created_by?: string;
  updated_by?: string;
}
```

**İndeksler:**
- `tc_no` (unique)
- `status`
- `city`
- `name` (fulltext)

---

## 💝 Donations Collection

Bağış kayıtları.

```typescript
interface DonationDocument {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  
  donor_name: string;        // Bağışçı adı
  donor_phone: string;       // Bağışçı telefonu
  donor_email?: string;      // Bağışçı e-posta
  
  amount: number;            // Bağış tutarı
  currency: 'TRY' | 'USD' | 'EUR';  // Para birimi
  
  donation_type: string;     // Bağış türü (Nakdi, Ayni)
  payment_method: string;    // Ödeme yöntemi
  donation_purpose: string;  // Bağış amacı
  
  receipt_number: string;    // Makbuz numarası
  receipt_file_id?: string;  // Makbuz dosyası ID
  
  notes?: string;            // Notlar
  
  status: 'pending' | 'completed' | 'cancelled';
  
  // Kumbara Alanları
  is_kumbara?: boolean;
  kumbara_location?: string;
  collection_date?: string;
  kumbara_institution?: string;
  location_coordinates?: { lat: number; lng: number };
  location_address?: string;
}
```

**İndeksler:**
- `receipt_number` (unique)
- `status`
- `donor_name` (fulltext)
- `$createdAt` (desc)

---

## 📝 Aid Applications Collection

Yardım başvuruları.

```typescript
interface AidApplicationDocument {
  $id: string;
  $createdAt: string;
  
  application_date: string;
  applicant_type: 'person' | 'organization' | 'partner';
  applicant_name: string;
  beneficiary_id?: string;   // Beneficiary relation
  
  // Yardım Türleri
  one_time_aid?: number;           // Tek seferlik
  regular_financial_aid?: number;  // Düzenli nakdi
  regular_food_aid?: number;       // Düzenli gıda (paket)
  in_kind_aid?: number;            // Ayni yardım (adet)
  service_referral?: number;       // Hizmet sevk
  
  // Durum
  stage: 'draft' | 'under_review' | 'approved' | 'ongoing' | 'completed';
  status: 'open' | 'closed';
  
  description?: string;
  notes?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  
  processed_by?: string;
  processed_at?: string;
  approved_by?: string;
  approved_at?: string;
  completed_at?: string;
}
```

---

## 📅 Meetings Collection

Toplantı kayıtları.

```typescript
interface MeetingDocument {
  $id: string;
  $createdAt: string;
  
  title: string;
  description?: string;
  meeting_date: string;
  location?: string;
  
  organizer: string;         // User ID
  participants: string[];    // User IDs
  
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  meeting_type: 'general' | 'committee' | 'board' | 'other';
  
  agenda?: string;
  notes?: string;
}
```

---

## 📋 Meeting Decisions Collection

Toplantı kararları.

```typescript
interface MeetingDecisionDocument {
  $id: string;
  $createdAt: string;
  
  meeting_id: string;        // Meeting relation
  title: string;
  summary?: string;
  owner?: string;            // User ID
  
  created_by: string;
  status: 'acik' | 'devam' | 'kapatildi';
  
  tags?: string[];
  due_date?: string;
}
```

---

## ✅ Meeting Action Items Collection

Toplantı görev atamaları.

```typescript
interface MeetingActionItemDocument {
  $id: string;
  $createdAt: string;
  
  meeting_id: string;        // Meeting relation
  decision_id?: string;      // Decision relation
  
  title: string;
  description?: string;
  assigned_to: string;       // User ID
  created_by: string;
  
  status: 'beklemede' | 'devam' | 'hazir' | 'iptal';
  due_date?: string;
  completed_at?: string;
  
  status_history?: {
    status: string;
    changed_at: string;
    changed_by: string;
    note?: string;
  }[];
  
  notes?: string[];
  reminder_scheduled_at?: string;
}
```

---

## 💰 Finance Records Collection

Gelir/Gider kayıtları.

```typescript
interface FinanceRecordDocument {
  $id: string;
  $createdAt: string;
  
  record_type: 'income' | 'expense';
  category: string;
  amount: number;
  currency: 'TRY' | 'USD' | 'EUR';
  
  description: string;
  transaction_date: string;
  
  payment_method?: string;
  receipt_number?: string;
  receipt_file_id?: string;
  
  related_to?: string;       // İlişkili kayıt ID
  created_by: string;
  approved_by?: string;
  
  status: 'pending' | 'approved' | 'rejected';
}
```

---

## 🎓 Scholarships Collection

Burs programları.

```typescript
interface ScholarshipDocument {
  $id: string;
  $createdAt: string;
  
  student_name: string;
  tc_no: string;
  school_name: string;
  grade: number;
  
  scholarship_amount: number;
  scholarship_type: 'monthly' | 'one-time' | 'annual';
  
  start_date?: string;
  end_date?: string;
  
  status: 'active' | 'paused' | 'completed';
}
```

---

## 📄 Scholarship Applications Collection

Burs başvuruları.

```typescript
interface ScholarshipApplicationDocument {
  $id: string;
  $createdAt: string;
  
  scholarship_id: string;
  student_id?: string;
  
  applicant_name: string;
  applicant_tc_no: string;
  applicant_phone: string;
  applicant_email?: string;
  
  university?: string;
  department?: string;
  grade_level?: string;
  gpa?: number;
  academic_year?: string;
  
  monthly_income?: number;
  family_income?: number;
  father_occupation?: string;
  mother_occupation?: string;
  sibling_count?: number;
  
  is_orphan?: boolean;
  has_disability?: boolean;
  
  essay?: string;
  documents?: string[];      // File IDs
  
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 
          'rejected' | 'waitlisted' | 'active' | 'pending' | 'completed';
  
  reviewer_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  submitted_at?: string;
}
```

---

## 👨‍👩‍👧 Dependents Collection

Bağımlı bireyler (aile üyeleri).

```typescript
interface DependentDocument {
  $id: string;
  $createdAt: string;
  
  beneficiary_id: string;    // Beneficiary relation
  
  name: string;
  tc_no?: string;
  birth_date?: string;
  gender?: string;
  relation: string;          // Aile yakınlık derecesi
  
  education_status?: string;
  school_name?: string;
  grade?: number;
  
  health_status?: string;
  has_disability?: boolean;
  disability_detail?: string;
  
  employment_status?: string;
  income?: number;
  
  notes?: string;
}
```

---

## ✍️ Consents Collection

KVKK/GDPR onayları.

```typescript
interface ConsentDocument {
  $id: string;
  $createdAt: string;
  
  beneficiary_id: string;
  
  consent_type: 'data_processing' | 'communication' | 'photo' | 'sharing';
  
  is_granted: boolean;
  granted_at?: string;
  revoked_at?: string;
  
  ip_address?: string;
  user_agent?: string;
  
  notes?: string;
}
```

---

## 🏦 Bank Accounts Collection

Banka hesap bilgileri.

```typescript
interface BankAccountDocument {
  $id: string;
  $createdAt: string;
  
  beneficiary_id: string;
  
  bank_name: string;
  branch_name?: string;
  account_holder: string;
  iban: string;
  account_type: 'checking' | 'savings';
  
  is_primary: boolean;
  is_active: boolean;
  
  notes?: string;
}
```

---

## 🤝 Partners Collection

İş ortakları.

```typescript
interface PartnerDocument {
  $id: string;
  $createdAt: string;
  
  name: string;
  type: 'organization' | 'individual' | 'sponsor';
  
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  tax_number?: string;
  
  partnership_type: 'donor' | 'supplier' | 'volunteer' | 'sponsor' | 'service_provider';
  
  collaboration_start_date?: string;
  collaboration_end_date?: string;
  
  notes?: string;
  status: 'active' | 'inactive' | 'pending';
  
  total_contribution?: number;
  contribution_count?: number;
  logo_url?: string;
}
```

---

## ⚙️ System Settings Collection

Sistem ayarları.

```typescript
interface SystemSettingDocument {
  $id: string;
  $updatedAt: string;
  
  category: string;          // theme, branding, security, etc.
  key: string;               // Ayar anahtarı
  value: unknown;            // Ayar değeri (JSON)
  
  updated_by?: string;
}
```

---

## 📊 Parameters Collection

Dinamik parametreler (dropdown değerleri).

```typescript
interface ParameterDocument {
  $id: string;
  $createdAt: string;
  
  category: ParameterCategory;
  
  name_tr: string;           // Türkçe ad
  name_en?: string;          // İngilizce ad
  name_ar?: string;          // Arapça ad
  
  value: string;             // Değer
  order: number;             // Sıralama
  is_active: boolean;        // Aktiflik
}

type ParameterCategory = 
  | 'gender'
  | 'religion'
  | 'marital_status'
  | 'employment_status'
  | 'living_status'
  | 'housing_type'
  | 'income_level'
  | 'guardian_relation'
  | 'education_status'
  | 'education_level'
  | 'health_problem'
  | 'illness'
  | 'treatment'
  | 'occupation'
  | 'document_type'
  // ... ve daha fazlası
```

---

## 🔍 Audit Logs Collection

Denetim kayıtları.

```typescript
interface AuditLogDocument {
  $id: string;
  $createdAt: string;
  
  user_id: string;
  action: string;            // create, update, delete, view
  resource: string;          // Collection adı
  resource_id: string;
  
  changes?: {
    field: string;
    old_value: unknown;
    new_value: unknown;
  }[];
  
  ip_address: string;
  user_agent: string;
  
  status: 'success' | 'failure';
  error?: string;
}
```

---

## 📬 Messages Collection

Mesaj kayıtları.

```typescript
interface MessageDocument {
  $id: string;
  $createdAt: string;
  
  message_type: 'sms' | 'email' | 'internal' | 'whatsapp';
  
  sender: string;            // User ID
  recipients: string[];      // E-posta, telefon veya User ID
  
  subject?: string;
  content: string;
  
  sent_at?: string;
  status: 'draft' | 'sent' | 'failed';
  
  is_bulk: boolean;
  template_id?: string;
}
```

---

## 🔔 Workflow Notifications Collection

İş akışı bildirimleri.

```typescript
interface WorkflowNotificationDocument {
  $id: string;
  $createdAt: string;
  
  recipient: string;         // User ID
  triggered_by?: string;     // User ID
  
  category: 'meeting' | 'gorev' | 'rapor' | 'hatirlatma';
  title: string;
  body?: string;
  
  status: 'beklemede' | 'gonderildi' | 'okundu';
  
  sent_at?: string;
  read_at?: string;
  
  reference?: {
    type: 'meeting_action_item' | 'meeting' | 'meeting_decision';
    id: string;
  };
  
  metadata?: unknown;
}
```

---

## 📁 Storage Buckets

| Bucket | Açıklama | Max Boyut | İzin Verilen Tipler |
|--------|----------|-----------|---------------------|
| `documents` | Genel dökümanlar | 10 MB | PDF, DOC, DOCX, XLS, XLSX |
| `avatars` | Kullanıcı avatarları | 2 MB | JPEG, PNG, WebP |
| `receipts` | Makbuz dosyaları | 5 MB | PDF, JPEG, PNG |

---

## 🔗 Collection İlişkileri

### Birden Çoka (1:N)
- `beneficiaries` → `dependents`
- `beneficiaries` → `consents`
- `beneficiaries` → `bank_accounts`
- `beneficiaries` → `aid_applications`
- `meetings` → `meeting_decisions`
- `meetings` → `meeting_action_items`
- `meeting_decisions` → `meeting_action_items`
- `scholarships` → `scholarship_applications`
- `scholarship_applications` → `scholarship_payments`

### Birden Bire (1:1)
- `users` → `user_sessions`
- `users` → `two_factor_settings`

### Çoktan Çoka (N:M)
- `meetings` ↔ `users` (participants)

