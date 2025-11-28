/**
 * Enhanced Donation Types based on KafkasDer system
 * Supporting 7 different payment methods with specific workflows
 */

export type PaymentMethod =
  | 'cash' // Nakit Bağış - Direct cash handling
  | 'check' // Çek Senet Bağış - Check/Promissory Note
  | 'credit_card' // Kredi Kartı Bağış - Physical POS terminal
  | 'online' // Online Bağış - Virtual POS gateway
  | 'bank_transfer' // Banka Bağış - Bank account deposits
  | 'sms' // SMS Bağış - Mobile carrier integration
  | 'in_kind'; // Ayni Bağış - Non-monetary (goods/supplies)

export type DonationStatus = 'pending' | 'approved' | 'completed' | 'cancelled' | 'rejected';

/**
 * Payment method-specific details stored as JSON
 */
export interface PaymentDetails {
  // Common fields
  processedBy?: string;
  processingDate?: string;

  // Cash-specific
  cashRegister?: string;
  cashierName?: string;

  // Check-specific
  checkNumber?: string;
  bankName?: string;
  checkDate?: string;
  maturityDate?: string;
  checkStatus?: 'pending' | 'presented' | 'cleared' | 'dishonored';

  // Credit card-specific
  cardLastFourDigits?: string;
  cardType?: string;
  authorizationCode?: string;
  posTerminalId?: string;

  // Online-specific
  gatewayProvider?: 'paratika' | 'esnekpos' | 'other';
  transactionId?: string;
  secure3D?: boolean;
  virtualPosId?: string;

  // Bank transfer-specific
  senderBankName?: string;
  senderAccountNumber?: string;
  transferReference?: string;
  swiftCode?: string;

  // SMS-specific
  mobileOperator?: 'turkcell' | 'vodafone' | 'turk_telekom';
  phoneNumber?: string;
  smsCode?: string;
  billingMonth?: string;

  // In-kind-specific
  itemCategory?: string;
  itemDescription?: string;
  quantity?: number;
  unit?: string;
  estimatedValue?: number;
  storageLocation?: string;
  conditionNotes?: string;
}

export interface Donation {
  _id: string;
  _creationTime: number;
  donor_name: string;
  donor_phone: string;
  donor_email?: string;
  amount: number;
  currency: 'TRY' | 'USD' | 'EUR';
  donation_type: string;
  payment_method: PaymentMethod;
  payment_details?: PaymentDetails;
  donation_purpose: string;
  notes?: string;
  receipt_number: string;
  receipt_file_id?: string;
  status: DonationStatus;
  settlement_date?: string;
  settlement_amount?: number;
  transaction_reference?: string;
  tax_deductible?: boolean;
  is_kumbara?: boolean;
  kumbara_location?: string;
  collection_date?: string;
  kumbara_institution?: string;
}

/**
 * Payment method configuration for workflows
 */
export interface PaymentMethodConfig {
  id: PaymentMethod;
  label: string;
  labelTr: string;
  icon: string;
  requiresApproval: boolean;
  requiresReceipt: boolean;
  canBeScheduled: boolean;
  typicalProcessingTime: string; // in hours
  description: string;
  descriptionTr: string;
}

export const PAYMENT_METHODS: Record<PaymentMethod, PaymentMethodConfig> = {
  cash: {
    id: 'cash',
    label: 'Cash Donation',
    labelTr: 'Nakit Bağış',
    icon: 'Banknote',
    requiresApproval: false,
    requiresReceipt: true,
    canBeScheduled: false,
    typicalProcessingTime: '0',
    description: 'In-person cash donations with manual receipt entry',
    descriptionTr: 'Elden verilen para bağışları, manuel makbuz girişi',
  },
  check: {
    id: 'check',
    label: 'Check/Promissory Note',
    labelTr: 'Çek/Senet Bağış',
    icon: 'FileText',
    requiresApproval: true,
    requiresReceipt: true,
    canBeScheduled: true,
    typicalProcessingTime: '168', // 7 days
    description: 'Deferred payment instruments for corporate donations',
    descriptionTr: 'İleri tarihli çek veya senet ile yapılan bağışlar',
  },
  credit_card: {
    id: 'credit_card',
    label: 'Credit Card (POS)',
    labelTr: 'Kredi Kartı (POS)',
    icon: 'CreditCard',
    requiresApproval: false,
    requiresReceipt: true,
    canBeScheduled: false,
    typicalProcessingTime: '24',
    description: 'Physical POS terminal credit card payments',
    descriptionTr: 'Fiziksel POS cihazı ile kredi kartı ödemeleri',
  },
  online: {
    id: 'online',
    label: 'Online Donation',
    labelTr: 'Online Bağış',
    icon: 'Globe',
    requiresApproval: false,
    requiresReceipt: true,
    canBeScheduled: false,
    typicalProcessingTime: '0',
    description: 'Website donations through virtual POS gateway',
    descriptionTr: 'Web sitesi üzerinden sanal POS ile yapılan bağışlar',
  },
  bank_transfer: {
    id: 'bank_transfer',
    label: 'Bank Transfer',
    labelTr: 'Banka Havalesi',
    icon: 'Building2',
    requiresApproval: false,
    requiresReceipt: true,
    canBeScheduled: false,
    typicalProcessingTime: '24',
    description: 'Direct bank account deposits and wire transfers',
    descriptionTr: 'Banka hesabına yapılan havale ve EFT işlemleri',
  },
  sms: {
    id: 'sms',
    label: 'SMS Donation',
    labelTr: 'SMS Bağış',
    icon: 'MessageSquare',
    requiresApproval: false,
    requiresReceipt: true,
    canBeScheduled: false,
    typicalProcessingTime: '720', // 30 days (monthly billing)
    description: 'Mobile carrier-billed small donations',
    descriptionTr: 'Telefon operatörü üzerinden küçük tutarlı bağışlar',
  },
  in_kind: {
    id: 'in_kind',
    label: 'In-Kind Donation',
    labelTr: 'Ayni Bağış',
    icon: 'Package',
    requiresApproval: true,
    requiresReceipt: true,
    canBeScheduled: false,
    typicalProcessingTime: '0',
    description: 'Non-monetary donations (goods, supplies, equipment)',
    descriptionTr: 'Eşya, malzeme ve ekipman gibi fiziksel bağışlar',
  },
};

/**
 * Get payment method configuration by ID
 */
export function getPaymentMethodConfig(method: PaymentMethod): PaymentMethodConfig {
  return PAYMENT_METHODS[method];
}

/**
 * Get localized payment method label
 */
export function getPaymentMethodLabel(method: PaymentMethod, locale: 'en' | 'tr' = 'tr'): string {
  const config = PAYMENT_METHODS[method];
  return locale === 'tr' ? config.labelTr : config.label;
}

/**
 * Check if payment method requires approval workflow
 */
export function requiresApproval(method: PaymentMethod): boolean {
  return PAYMENT_METHODS[method].requiresApproval;
}
