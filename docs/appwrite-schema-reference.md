# Appwrite Database Schema Reference

Bu doküman, Kafkasder Panel projesinin Appwrite veritabanı şemasını detaylı olarak açıklar.

## Genel Bakış

- **Database ID:** `kafkasder_db`
- **Database Name:** Kafkasder Panel Database
- **Total Collections:** 40+ collections
- **Setup Script:** `scripts/appwrite-setup.ts`

## Collection Kategorileri

### 1. User Management (Kullanıcı Yönetimi)

#### users
**ID:** `users`  
**Name:** Kullanıcılar

**Attributes:**
- `name` (string, 255, required)
- `email` (email, required, unique)
- `role` (string, 50, required)
- `permissions` (string array)
- `phone` (string, 20)
- `avatar` (url)
- `isActive` (boolean, required, default: true)
- `labels` (string array)
- `createdAt` (datetime)
- `lastLogin` (datetime)
- `passwordHash` (string, 255)
- `two_factor_enabled` (boolean, default: false)
- Extended profile fields (birth_date, blood_type, nationality, address, etc.)
- Emergency contacts (JSON)
- Communication preferences

**Indexes:**
- `by_email` (Unique) - email
- `by_role` (Key) - role
- `by_is_active` (Key) - isActive

#### user_sessions
**ID:** `user_sessions`  
**Name:** Kullanıcı Oturumları

**Attributes:**
- `user_id` (string, 36, required)
- `device_info` (string, 500)
- `ip_address` (string, 45)
- `user_agent` (string, 500)
- `is_active` (boolean, required, default: true)
- `last_activity` (datetime, required)
- `created_at` (datetime, required)
- `revoked_at` (datetime)
- `revocation_reason` (string, 255)

**Indexes:**
- `by_user` (Key) - user_id
- `by_active` (Key) - is_active

#### two_factor_settings
**ID:** `two_factor_settings`  
**Name:** 2FA Ayarları

**Attributes:**
- `user_id` (string, 36, required, unique)
- `secret` (string, 255, required)
- `backup_codes` (string, JSON array)
- `enabled` (boolean, required, default: false)
- `enabled_at` (datetime)
- `disabled_at` (datetime)
- `last_verified` (datetime)

**Indexes:**
- `by_user` (Unique) - user_id

#### trusted_devices
**ID:** `trusted_devices`  
**Name:** Güvenilen Cihazlar

**Attributes:**
- `user_id` (string, 36, required)
- `device_fingerprint` (string, 255, required)
- `device_name` (string, 255)
- `added_at` (datetime, required)
- `last_used` (datetime)
- `is_active` (boolean, required, default: true)
- `removed_at` (datetime)

**Indexes:**
- `by_user` (Key) - user_id
- `by_fingerprint` (Key) - device_fingerprint

### 2. Beneficiary System (İhtiyaç Sahibi Sistemi)

#### beneficiaries
**ID:** `beneficiaries`  
**Name:** İhtiyaç Sahipleri

**Attributes:**
- **Temel Bilgiler:**
  - `name` (string, 255, required)
  - `tc_no` (string, 11, required, unique)
  - `phone` (string, 20, required)
  - `email` (email)
  - `birth_date` (string, 20)
  - `gender` (string, 20)
  - `nationality` (string, 100)

- **Kategorizasyon:**
  - `category` (enum: need_based_family, refugee_family, orphan_family)
  - `beneficiary_type` (enum: primary_person, dependent)
  - `primary_beneficiary_id` (string, 36)
  - `relationship` (string, 50)

- **Aile Bilgileri:**
  - `family_size` (integer, required)
  - `children_count` (integer, default: 0)
  - `orphan_children_count` (integer, default: 0)
  - `elderly_count` (integer, default: 0)
  - `disabled_count` (integer, default: 0)

- **Adres:**
  - `address` (string, 500, required)
  - `city` (string, 100, required)
  - `district` (string, 100, required)
  - `neighborhood` (string, 100, required)

- **Ekonomik Durum:**
  - `income_level` (string, 50)
  - `income_source` (string, 255)
  - `has_debt` (boolean, default: false)
  - `housing_type` (string, 50)
  - `has_vehicle` (boolean, default: false)

- **Sağlık:**
  - `health_status` (string, 100)
  - `has_chronic_illness` (boolean, default: false)
  - `chronic_illness_detail` (string, 500)
  - `has_disability` (boolean, default: false)
  - `disability_detail` (string, 500)
  - `has_health_insurance` (boolean, default: false)
  - `regular_medication` (string, 500)

- **Eğitim ve İstihdam:**
  - `education_level` (string, 100)
  - `occupation` (string, 100)
  - `employment_status` (string, 50)

- **Yardım Bilgileri:**
  - `aid_type` (string, 100)
  - `totalAidAmount` (float, default: 0)
  - `aid_duration` (string, 50)
  - `priority` (string, 20)
  - `application_count` (integer, default: 0)
  - `aid_count` (integer, default: 0)

- **Referans:**
  - `reference_name` (string, 255)
  - `reference_phone` (string, 20)
  - `reference_relation` (string, 100)
  - `application_source` (string, 100)

- **Durum:**
  - `status` (enum, required: TASLAK, AKTIF, PASIF, SILINDI)
  - `approval_status` (enum: pending, approved, rejected)
  - `approved_by` (string, 36)
  - `approved_at` (datetime)

- **Diğer:**
  - `religion` (string, 50)
  - `marital_status` (string, 50)
  - `notes` (string, 65535)
  - `previous_aid` (boolean, default: false)
  - `other_organization_aid` (boolean, default: false)
  - `emergency` (boolean, default: false)
  - `contact_preference` (string, 50)

**Indexes:**
- `by_tc_no` (Unique) - tc_no
- `by_status` (Key) - status
- `by_city` (Key) - city

#### dependents
**ID:** `dependents`  
**Name:** Bakmakla Yükümlü Olunanlar

**Attributes:**
- `beneficiary_id` (string, 36, required)
- `name` (string, 255, required)
- `relationship` (string, 50, required)
- `birth_date` (string, 20)
- `gender` (string, 20)
- `tc_no` (string, 11)
- `phone` (string, 20)
- `education_level` (string, 100)
- `occupation` (string, 100)
- `health_status` (string, 100)
- `has_disability` (boolean, default: false)
- `disability_detail` (string, 500)
- `monthly_income` (float, default: 0)
- `notes` (string, 65535)

**Indexes:**
- `by_beneficiary` (Key) - beneficiary_id
- `by_relationship` (Key) - relationship

#### consents
**ID:** `consents`  
**Name:** Rıza Beyanları

**Attributes:**
- `beneficiary_id` (string, 36, required)
- `consent_type` (string, 100, required)
- `consent_text` (string, 65535, required)
- `status` (enum, required: active, revoked, expired)
- `signed_at` (datetime, required)
- `signed_by` (string, 255)
- `expires_at` (datetime)
- `created_by` (string, 36)
- `notes` (string, 65535)

**Indexes:**
- `by_beneficiary` (Key) - beneficiary_id
- `by_status` (Key) - status

#### bank_accounts
**ID:** `bank_accounts`  
**Name:** Banka Hesapları

**Attributes:**
- `beneficiary_id` (string, 36, required)
- `bank_name` (string, 100, required)
- `account_holder` (string, 255, required)
- `account_number` (string, 50, required)
- `iban` (string, 34)
- `branch_name` (string, 100)
- `branch_code` (string, 20)
- `account_type` (enum, required: checking, savings, other)
- `currency` (enum, required: TRY, USD, EUR)
- `is_primary` (boolean, default: false)
- `status` (enum, required: active, inactive, closed)
- `notes` (string, 65535)

**Indexes:**
- `by_beneficiary` (Key) - beneficiary_id
- `by_status` (Key) - status

### 3. Donations (Bağışlar)

#### donations
**ID:** `donations`  
**Name:** Bağışlar

**Attributes:**
- **Donor Information:**
  - `donor_name` (string, 255, required)
  - `donor_phone` (string, 20, required)
  - `donor_email` (email)

- **Donation Details:**
  - `amount` (float, required)
  - `currency` (enum, required: TRY, USD, EUR)
  - `donation_type` (string, 100, required)
  - `donation_purpose` (string, 255, required)

- **Payment:**
  - `payment_method` (enum, required: cash, check, credit_card, online, bank_transfer, sms, in_kind, NAKIT, CEK_SENET, KREDI_KARTI, ONLINE, BANKA_HAVALESI, SMS, AYNI)
  - `payment_details` (string, JSON)
  - `settlement_date` (datetime)
  - `settlement_amount` (float)
  - `transaction_reference` (string, 100)

- **Receipt:**
  - `receipt_number` (string, 50, required, unique)
  - `receipt_file_id` (string, 36)
  - `tax_deductible` (boolean, default: true)

- **Kumbara (Savings Box):**
  - `is_kumbara` (boolean, default: false)
  - `kumbara_location` (string, 255)
  - `collection_date` (datetime)
  - `kumbara_institution` (string, 255)
  - `location_coordinates` (string, 100, JSON)
  - `location_address` (string, 500)
  - `route_points` (string, 65535, JSON array)
  - `route_distance` (float)
  - `route_duration` (float)

- **Status:**
  - `status` (enum, required: pending, approved, completed, cancelled, rejected)
  - `notes` (string, 65535)

**Indexes:**
- `by_status` (Key) - status
- `by_donor_email` (Key) - donor_email
- `by_receipt_number` (Unique) - receipt_number
- `by_is_kumbara` (Key) - is_kumbara

#### aid_applications
**ID:** `aid_applications`  
**Name:** Yardım Başvuruları

**Attributes:**
- `application_date` (datetime, required)
- `applicant_type` (enum, required: person, organization, partner)
- `applicant_name` (string, 255, required)
- `beneficiary_id` (string, 36)
- `one_time_aid` (float)
- `regular_financial_aid` (float)
- `regular_food_aid` (float)
- `in_kind_aid` (float)
- `service_referral` (float)
- `stage` (enum, required: draft, under_review, approved, ongoing, completed)
- `status` (enum, required: open, closed)
- `description` (string, 65535)
- `notes` (string, 65535)
- `priority` (enum: low, normal, high, urgent)
- `processed_by` (string, 36)
- `processed_at` (datetime)
- `approved_by` (string, 36)
- `approved_at` (datetime)
- `completed_at` (datetime)

**Indexes:**
- `by_beneficiary` (Key) - beneficiary_id
- `by_stage` (Key) - stage
- `by_status` (Key) - status

### 4. Finance (Finans)

#### finance_records
**ID:** `finance_records`  
**Name:** Finans Kayıtları

**Attributes:**
- `record_type` (enum, required: income, expense)
- `category` (string, 100, required)
- `amount` (float, required)
- `currency` (enum, required: TRY, USD, EUR)
- `description` (string, 65535, required)
- `transaction_date` (datetime, required)
- `payment_method` (string, 50)
- `receipt_number` (string, 50)
- `receipt_file_id` (string, 36)
- `related_to` (string, 255)
- `created_by` (string, 36, required)
- `approved_by` (string, 36)
- `status` (enum, required: pending, approved, rejected)

**Indexes:**
- `by_record_type` (Key) - record_type
- `by_status` (Key) - status
- `by_created_by` (Key) - created_by

### 5. Tasks & Meetings (Görevler ve Toplantılar)

#### tasks
**ID:** `tasks`  
**Name:** Görevler

**Attributes:**
- `title` (string, 255, required)
- `description` (string, 65535)
- `assigned_to` (string, 36)
- `created_by` (string, 36, required)
- `priority` (enum, required: low, normal, high, urgent)
- `status` (enum, required: pending, in_progress, completed, cancelled)
- `due_date` (datetime)
- `completed_at` (datetime)
- `category` (string, 100)
- `tags` (string array)
- `is_read` (boolean, required, default: false)

**Indexes:**
- `by_assigned_to` (Key) - assigned_to
- `by_status` (Key) - status
- `by_created_by` (Key) - created_by

#### meetings
**ID:** `meetings`  
**Name:** Toplantılar

**Attributes:**
- `title` (string, 255, required)
- `description` (string, 65535)
- `meeting_date` (datetime, required)
- `location` (string, 255)
- `organizer` (string, 36, required)
- `participants` (string, 65535, JSON array)
- `status` (enum, required: scheduled, ongoing, completed, cancelled)
- `meeting_type` (enum, required: general, committee, board, other)
- `agenda` (string, 65535)
- `notes` (string, 65535)

**Indexes:**
- `by_organizer` (Key) - organizer
- `by_status` (Key) - status
- `by_meeting_date` (Key) - meeting_date

#### meeting_decisions
**ID:** `meeting_decisions`  
**Name:** Toplantı Kararları

**Attributes:**
- `meeting_id` (string, 36, required)
- `title` (string, 255, required)
- `summary` (string, 65535)
- `owner` (string, 36)
- `created_by` (string, 36, required)
- `created_at` (datetime, required)
- `status` (enum, required: acik, devam, kapatildi)
- `tags` (string array)
- `due_date` (datetime)

**Indexes:**
- `by_meeting` (Key) - meeting_id
- `by_owner` (Key) - owner
- `by_status` (Key) - status

#### meeting_action_items
**ID:** `meeting_action_items`  
**Name:** Aksiyon Maddeleri

**Attributes:**
- `meeting_id` (string, 36, required)
- `decision_id` (string, 36)
- `title` (string, 255, required)
- `description` (string, 65535)
- `assigned_to` (string, 36, required)
- `created_by` (string, 36, required)
- `created_at` (datetime, required)
- `status` (enum, required: beklemede, devam, hazir, iptal)
- `due_date` (datetime)
- `completed_at` (datetime)
- `status_history` (string, 65535, JSON array)
- `notes` (string, 65535, JSON array)
- `reminder_scheduled_at` (datetime)

**Indexes:**
- `by_meeting` (Key) - meeting_id
- `by_assigned_to` (Key) - assigned_to
- `by_status` (Key) - status

### 6. Partners (Ortaklar)

#### partners
**ID:** `partners`  
**Name:** Ortaklar

**Attributes:**
- `name` (string, 255, required)
- `type` (enum, required: organization, individual, sponsor)
- `contact_person` (string, 255)
- `email` (email)
- `phone` (string, 20)
- `address` (string, 500)
- `website` (url)
- `tax_number` (string, 20)
- `partnership_type` (enum, required: donor, supplier, volunteer, sponsor, service_provider)
- `collaboration_start_date` (datetime)
- `collaboration_end_date` (datetime)
- `notes` (string, 65535)
- `status` (enum, required: active, inactive, pending)
- `total_contribution` (float, default: 0)
- `contribution_count` (integer, default: 0)
- `logo_url` (url)

**Indexes:**
- `by_type` (Key) - type
- `by_status` (Key) - status
- `by_partnership_type` (Key) - partnership_type

### 7. Scholarships (Burslar)

#### scholarships
**ID:** `scholarships`  
**Name:** Burs Programları

**Attributes:**
- `title` (string, 255, required)
- `description` (string, 65535)
- `amount` (float, required)
- `currency` (enum, required: TRY, USD, EUR)
- `duration_months` (integer)
- `category` (string, 100, required)
- `eligibility_criteria` (string, 65535)
- `requirements` (string, 65535, JSON array)
- `application_start_date` (datetime, required)
- `application_end_date` (datetime, required)
- `academic_year` (string, 20)
- `max_recipients` (integer)
- `is_active` (boolean, required, default: true)
- `created_by` (string, 36, required)
- `created_at` (datetime, required)

**Indexes:**
- `by_category` (Key) - category
- `by_is_active` (Key) - is_active

#### scholarship_applications
**ID:** `scholarship_applications`  
**Name:** Burs Başvuruları

**Attributes:**
- `scholarship_id` (string, 36, required)
- `student_id` (string, 36)
- `created_by` (string, 36)
- `applicant_name` (string, 255, required)
- `applicant_tc_no` (string, 11, required)
- `applicant_phone` (string, 20, required)
- `applicant_email` (email)
- `university` (string, 255)
- `department` (string, 255)
- `grade_level` (string, 10)
- `gpa` (float)
- `academic_year` (string, 20)
- `monthly_income` (float)
- `family_income` (float)
- `father_occupation` (string, 100)
- `mother_occupation` (string, 100)
- `sibling_count` (integer)
- `is_orphan` (boolean, default: false)
- `has_disability` (boolean, default: false)
- `essay` (string, 65535)
- `status` (enum, required: draft, submitted, under_review, approved, rejected, waitlisted)
- `priority_score` (float)
- `reviewer_notes` (string, 65535)
- `submitted_at` (datetime)
- `reviewed_by` (string, 36)
- `reviewed_at` (datetime)
- `documents` (string, 65535, JSON array)
- `created_at` (datetime, required)

**Indexes:**
- `by_scholarship` (Key) - scholarship_id
- `by_status` (Key) - status
- `by_tc_no` (Key) - applicant_tc_no

#### scholarship_payments
**ID:** `scholarship_payments`  
**Name:** Burs Ödemeleri

**Attributes:**
- `scholarship_application_id` (string, 36, required)
- `amount` (float, required)
- `currency` (enum, required: TRY, USD, EUR)
- `payment_date` (datetime, required)
- `payment_method` (string, 50)
- `transaction_reference` (string, 100)
- `status` (enum, required: pending, completed, failed, cancelled)
- `processed_by` (string, 36)
- `notes` (string, 65535)

**Indexes:**
- `by_application` (Key) - scholarship_application_id
- `by_status` (Key) - status
- `by_payment_date` (Key) - payment_date

### 8. Communication (İletişim)

#### messages
**ID:** `messages`  
**Name:** Mesajlar

**Attributes:**
- `message_type` (enum, required: sms, email, internal, whatsapp)
- `sender` (string, 36, required)
- `recipients` (string, 65535, JSON array)
- `subject` (string, 255)
- `content` (string, 65535, required)
- `sent_at` (datetime)
- `status` (enum, required: draft, sent, failed)
- `is_bulk` (boolean, required, default: false)
- `template_id` (string, 36)

**Indexes:**
- `by_sender` (Key) - sender
- `by_status` (Key) - status

#### communication_logs
**ID:** `communication_logs`  
**Name:** İletişim Logları

**Attributes:**
- `message_id` (string, 36)
- `recipient` (string, 255, required)
- `channel` (enum, required: sms, email, whatsapp, internal)
- `status` (enum, required: sent, delivered, failed, pending)
- `sent_at` (datetime)
- `delivered_at` (datetime)
- `error_message` (string, 65535)
- `metadata` (string, 65535, JSON)

**Indexes:**
- `by_recipient` (Key) - recipient
- `by_channel` (Key) - channel
- `by_status` (Key) - status

#### workflow_notifications
**ID:** `workflow_notifications`  
**Name:** İş Akışı Bildirimleri

**Attributes:**
- `recipient` (string, 36, required)
- `triggered_by` (string, 36)
- `category` (enum, required: meeting, gorev, rapor, hatirlatma)
- `title` (string, 255, required)
- `body` (string, 65535)
- `status` (enum, required: beklemede, gonderildi, okundu)
- `created_at` (datetime, required)
- `sent_at` (datetime)
- `read_at` (datetime)
- `reference` (string, 65535, JSON)
- `metadata` (string, 65535, JSON)

**Indexes:**
- `by_recipient` (Key) - recipient
- `by_status` (Key) - status
- `by_category` (Key) - category

### 9. Documents (Dokümanlar)

#### files
**ID:** `files`  
**Name:** Dosyalar

**Attributes:**
- `name` (string, 255, required)
- `file_id` (string, 36, required)
- `bucket_id` (string, 100, required)
- `mime_type` (string, 100)
- `size` (integer)
- `uploaded_by` (string, 36, required)
- `uploaded_at` (datetime, required)
- `related_to` (string, 100)
- `related_id` (string, 36)
- `category` (string, 100)
- `tags` (string array)
- `is_public` (boolean, default: false)

**Indexes:**
- `by_uploaded_by` (Key) - uploaded_by
- `by_related` (Key) - related_to, related_id
- `by_category` (Key) - category

#### document_versions
**ID:** `document_versions`  
**Name:** Doküman Versiyonları

**Attributes:**
- `file_id` (string, 36, required)
- `version_number` (integer, required)
- `file_id_version` (string, 36, required)
- `created_by` (string, 36, required)
- `created_at` (datetime, required)
- `change_summary` (string, 65535)
- `is_current` (boolean, required, default: true)

**Indexes:**
- `by_file` (Key) - file_id
- `by_version` (Key) - file_id, version_number

### 10. System (Sistem)

#### system_settings
**ID:** `system_settings`  
**Name:** Sistem Ayarları

**Attributes:**
- `category` (string, 100, required)
- `key` (string, 100, required)
- `value` (string, 65535)
- `label` (string, 255)
- `description` (string, 65535)
- `is_public` (boolean, default: false)
- `is_encrypted` (boolean, default: false)
- `data_type` (string, 50)
- `default_value` (string, 65535)
- `updated_by` (string, 36)
- `updated_at` (datetime)
- `version` (integer, default: 1)

**Indexes:**
- `by_category` (Key) - category
- `by_key` (Key) - key

#### parameters
**ID:** `parameters`  
**Name:** Parametreler

**Attributes:**
- `category` (string, 100, required)
- `name_tr` (string, 255, required)
- `name_en` (string, 255)
- `name_ar` (string, 255)
- `name_ru` (string, 255)
- `name_fr` (string, 255)
- `value` (string, 255, required)
- `order` (integer, required)
- `is_active` (boolean, required, default: true)

**Indexes:**
- `by_category` (Key) - category
- `by_value` (Key) - value

#### theme_presets
**ID:** `theme_presets`  
**Name:** Tema Ön Ayarları

**Attributes:**
- `name` (string, 255, required)
- `theme_config` (string, 65535, required, JSON)
- `is_default` (boolean, default: false)
- `created_by` (string, 36)
- `created_at` (datetime, required)

**Indexes:**
- `by_name` (Key) - name
- `by_default` (Key) - is_default

#### report_configs
**ID:** `report_configs`  
**Name:** Rapor Yapılandırmaları

**Attributes:**
- `name` (string, 255, required)
- `type` (string, 100, required)
- `config` (string, 65535, required, JSON)
- `created_by` (string, 36, required)
- `created_at` (datetime, required)
- `updated_at` (datetime)
- `is_active` (boolean, required, default: true)

**Indexes:**
- `by_type` (Key) - type
- `by_created_by` (Key) - created_by

### 11. Security & Audit (Güvenlik ve Denetim)

#### audit_logs
**ID:** `audit_logs`  
**Name:** Denetim Kayıtları

**Attributes:**
- `userId` (string, 36, required)
- `userName` (string, 255, required)
- `action` (enum, required: CREATE, UPDATE, DELETE, VIEW)
- `resource` (string, 100, required)
- `resourceId` (string, 36, required)
- `changes` (string, 65535, JSON)
- `ipAddress` (string, 45)
- `userAgent` (string, 500)
- `timestamp` (datetime, required)
- `metadata` (string, 65535, JSON)

**Indexes:**
- `by_user` (Key) - userId
- `by_resource` (Key) - resource, resourceId
- `by_action` (Key) - action
- `by_timestamp` (Key) - timestamp

#### security_events
**ID:** `security_events`  
**Name:** Güvenlik Olayları

**Attributes:**
- `event_type` (string, 100, required)
- `user_id` (string, 36)
- `ip_address` (string, 45)
- `user_agent` (string, 500)
- `details` (string, 65535, JSON)
- `severity` (enum, required: low, medium, high, critical)
- `occurred_at` (datetime, required)
- `reviewed` (boolean, required, default: false)

**Indexes:**
- `by_user` (Key) - user_id
- `by_event_type` (Key) - event_type
- `by_occurred_at` (Key) - occurred_at

#### rate_limit_log
**ID:** `rate_limit_log`  
**Name:** Rate Limit Log

**Attributes:**
- `ip_address` (string, 45, required)
- `endpoint` (string, 255, required)
- `request_count` (integer, required)
- `window_start` (datetime, required)
- `window_end` (datetime, required)
- `blocked` (boolean, required, default: false)

**Indexes:**
- `by_ip` (Key) - ip_address
- `by_endpoint` (Key) - endpoint
- `by_window` (Key) - window_start

### 12. Monitoring (İzleme)

#### analytics_events
**ID:** `analytics_events`  
**Name:** Analitik Olayları

**Attributes:**
- `event_type` (string, 100, required)
- `user_id` (string, 36)
- `session_id` (string, 36)
- `properties` (string, 65535, JSON)
- `timestamp` (datetime, required)

**Indexes:**
- `by_event_type` (Key) - event_type
- `by_user` (Key) - user_id
- `by_timestamp` (Key) - timestamp

#### performance_metrics
**ID:** `performance_metrics`  
**Name:** Performans Metrikleri

**Attributes:**
- `metric_name` (string, 100, required)
- `value` (float, required)
- `unit` (string, 20)
- `timestamp` (datetime, required)
- `metadata` (string, 65535, JSON)

**Indexes:**
- `by_metric` (Key) - metric_name
- `by_timestamp` (Key) - timestamp

### 13. Error Tracking (Hata Takibi)

#### errors
**ID:** `errors`  
**Name:** Hatalar

**Attributes:**
- `title` (string, 255, required)
- `message` (string, 65535, required)
- `stack` (string, 65535)
- `severity` (enum, required: low, medium, high, critical)
- `status` (enum, required: open, investigating, resolved, ignored)
- `assigned_to` (string, 36)
- `first_occurred` (datetime, required)
- `last_occurred` (datetime, required)
- `occurrence_count` (integer, required, default: 1)

**Indexes:**
- `by_severity` (Key) - severity
- `by_status` (Key) - status
- `by_assigned_to` (Key) - assigned_to

#### error_occurrences
**ID:** `error_occurrences`  
**Name:** Hata Oluşumları

**Attributes:**
- `error_id` (string, 36, required)
- `occurred_at` (datetime, required)
- `user_id` (string, 36)
- `ip_address` (string, 45)
- `user_agent` (string, 500)
- `context` (string, 65535, JSON)

**Indexes:**
- `by_error` (Key) - error_id
- `by_occurred_at` (Key) - occurred_at

#### error_logs
**ID:** `error_logs`  
**Name:** Hata Logları

**Attributes:**
- `error_id` (string, 36)
- `level` (enum, required: error, warning, info, debug)
- `message` (string, 65535, required)
- `timestamp` (datetime, required)
- `metadata` (string, 65535, JSON)

**Indexes:**
- `by_error` (Key) - error_id
- `by_level` (Key) - level
- `by_timestamp` (Key) - timestamp

#### system_alerts
**ID:** `system_alerts`  
**Name:** Sistem Uyarıları

**Attributes:**
- `alert_type` (string, 100, required)
- `title` (string, 255, required)
- `message` (string, 65535, required)
- `severity` (enum, required: info, warning, error, critical)
- `status` (enum, required: active, acknowledged, resolved)
- `created_at` (datetime, required)
- `acknowledged_at` (datetime)
- `acknowledged_by` (string, 36)

**Indexes:**
- `by_type` (Key) - alert_type
- `by_severity` (Key) - severity
- `by_status` (Key) - status

### 14. AI Features (AI Özellikleri)

#### ai_chats
**ID:** `ai_chats`  
**Name:** AI Sohbetleri

**Attributes:**
- `user_id` (string, 36, required)
- `title` (string, 255)
- `created_at` (datetime, required)
- `updated_at` (datetime, required)
- `message_count` (integer, default: 0)

**Indexes:**
- `by_user` (Key) - user_id
- `by_updated_at` (Key) - updated_at

#### agent_threads
**ID:** `agent_threads`  
**Name:** Agent Threads

**Attributes:**
- `chat_id` (string, 36)
- `thread_id` (string, 100, required)
- `status` (enum, required: active, completed, cancelled)
- `created_at` (datetime, required)
- `updated_at` (datetime, required)

**Indexes:**
- `by_chat` (Key) - chat_id
- `by_thread` (Key) - thread_id
- `by_status` (Key) - status

#### agent_messages
**ID:** `agent_messages`  
**Name:** Agent Mesajları

**Attributes:**
- `thread_id` (string, 100, required)
- `role` (enum, required: user, assistant, system)
- `content` (string, 65535, required)
- `created_at` (datetime, required)
- `metadata` (string, 65535, JSON)

**Indexes:**
- `by_thread` (Key) - thread_id
- `by_role` (Key) - role
- `by_created_at` (Key) - created_at

#### agent_tools
**ID:** `agent_tools`  
**Name:** Agent Araçları

**Attributes:**
- `tool_name` (string, 100, required)
- `tool_type` (string, 50, required)
- `config` (string, 65535, JSON)
- `is_active` (boolean, required, default: true)

**Indexes:**
- `by_name` (Key) - tool_name
- `by_type` (Key) - tool_type

#### agent_usage
**ID:** `agent_usage`  
**Name:** Agent Kullanımı

**Attributes:**
- `user_id` (string, 36)
- `thread_id` (string, 100)
- `tool_name` (string, 100)
- `usage_count` (integer, required, default: 1)
- `timestamp` (datetime, required)
- `metadata` (string, 65535, JSON)

**Indexes:**
- `by_user` (Key) - user_id
- `by_thread` (Key) - thread_id
- `by_tool` (Key) - tool_name

## Index Types

Appwrite supports the following index types:

- **Unique:** Ensures uniqueness of attribute values
- **Key:** Standard index for querying and sorting

## Attribute Types

- **string:** Text data with configurable size
- **integer:** Whole numbers
- **float:** Decimal numbers
- **boolean:** True/false values
- **datetime:** Date and time values
- **email:** Email address validation
- **url:** URL validation
- **ip:** IP address validation
- **enum:** Predefined value list

## Setup Process

### Automated Setup

```bash
npm run appwrite:setup
```

This script:
1. Creates the database (`kafkasder_db`)
2. Creates all collections
3. Creates all attributes
4. Creates all indexes

### Schema Compliance Check

```bash
npx tsx scripts/check-schema-compliance.ts
```

This script verifies that:
- All expected collections exist
- All attributes are correctly configured
- All indexes are present

## Storage Buckets

- **documents:** General document storage
- **avatars:** User profile pictures
- **receipts:** Financial receipt files

## Best Practices

1. **Always use indexes** for frequently queried fields
2. **Use enum types** for status fields to ensure data consistency
3. **Store JSON data** as strings (size: 65535) for complex nested data
4. **Use required fields** for critical data
5. **Set default values** for optional fields with common defaults
6. **Use unique indexes** for fields that must be unique (email, TC no, etc.)

## Migration Notes

- Schema changes require manual migration
- New attributes can be added without data loss
- Removing attributes requires data migration
- Index changes may require re-indexing

## Related Documentation

- [Appwrite Setup Guide](./APPWRITE_SETUP.md)
- [Appwrite MCP Guide](./appwrite-mcp.md)
- [Appwrite API Guide](./appwrite-guide.md)

