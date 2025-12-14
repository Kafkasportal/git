/**
 * Property-Based Test Generators
 * Provides fast-check arbitraries for generating test data
 * 
 * @module test-utils/generators
 */

import { fc } from '@fast-check/vitest';
import type { PermissionValue } from '@/types/permissions';
import { ALL_PERMISSIONS } from '@/types/permissions';

// ============================================
// TURKISH IDENTITY NUMBER (TC Kimlik No)
// ============================================

/**
 * Generate a valid Turkish Identity Number (TC Kimlik No)
 * Rules:
 * - 11 digits
 * - First digit cannot be 0
 * - 10th digit = ((d1+d3+d5+d7+d9)*7 - (d2+d4+d6+d8)) mod 10
 * - 11th digit = (d1+d2+d3+d4+d5+d6+d7+d8+d9+d10) mod 10
 */
export const validTcKimlikNo: fc.Arbitrary<string> = fc
  .tuple(
    fc.integer({ min: 1, max: 9 }), // d1 (cannot be 0)
    fc.integer({ min: 0, max: 9 }), // d2
    fc.integer({ min: 0, max: 9 }), // d3
    fc.integer({ min: 0, max: 9 }), // d4
    fc.integer({ min: 0, max: 9 }), // d5
    fc.integer({ min: 0, max: 9 }), // d6
    fc.integer({ min: 0, max: 9 }), // d7
    fc.integer({ min: 0, max: 9 }), // d8
    fc.integer({ min: 0, max: 9 })  // d9
  )
  .map(([d1, d2, d3, d4, d5, d6, d7, d8, d9]) => {
    const oddSum = d1 + d3 + d5 + d7 + d9;
    const evenSum = d2 + d4 + d6 + d8;
    const d10 = ((oddSum * 7) - evenSum) % 10;
    const d10Positive = d10 < 0 ? d10 + 10 : d10;
    const d11 = (d1 + d2 + d3 + d4 + d5 + d6 + d7 + d8 + d9 + d10Positive) % 10;
    return `${d1}${d2}${d3}${d4}${d5}${d6}${d7}${d8}${d9}${d10Positive}${d11}`;
  });

/**
 * Generate an invalid TC Kimlik No (for testing validation)
 */
export const invalidTcKimlikNo: fc.Arbitrary<string> = fc.oneof(
  fc.string({ minLength: 1, maxLength: 10 }), // Too short
  fc.string({ minLength: 12, maxLength: 20 }), // Too long
  fc.constant('00000000000'), // Starts with 0
  fc.constant('12345678901'), // Invalid checksum
);


// ============================================
// PHONE NUMBER GENERATORS
// ============================================

/**
 * Generate a valid Turkish phone number
 * Format: +90 5XX XXX XX XX
 */
export const validPhoneNumber: fc.Arbitrary<string> = fc
  .tuple(
    fc.constantFrom('530', '531', '532', '533', '534', '535', '536', '537', '538', '539',
                    '540', '541', '542', '543', '544', '545', '546', '547', '548', '549',
                    '550', '551', '552', '553', '554', '555', '556', '557', '558', '559'),
    fc.integer({ min: 1000000, max: 9999999 })
  )
  .map(([prefix, number]) => `+90${prefix}${number}`);

/**
 * Generate an invalid phone number
 */
export const invalidPhoneNumber: fc.Arbitrary<string> = fc.oneof(
  fc.string({ minLength: 1, maxLength: 5 }), // Too short
  fc.constant('123'), // Invalid format
  fc.constant(''), // Empty
);

// ============================================
// EMAIL GENERATORS
// ============================================

/**
 * Generate a valid email address
 */
export const validEmail: fc.Arbitrary<string> = fc
  .tuple(
    fc.stringMatching(/^[a-z][a-z0-9]{2,10}$/),
    fc.constantFrom('gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com', 'example.com')
  )
  .map(([local, domain]) => `${local}@${domain}`);

/**
 * Generate an invalid email address
 */
export const invalidEmail: fc.Arbitrary<string> = fc.oneof(
  fc.constant('invalid'),
  fc.constant('no@domain'),
  fc.constant('@nodomain.com'),
  fc.constant('spaces in@email.com'),
);

// ============================================
// CURRENCY AND AMOUNT GENERATORS
// ============================================

/**
 * Generate a valid currency code
 */
export const validCurrency: fc.Arbitrary<'TRY' | 'USD' | 'EUR'> = fc.constantFrom('TRY', 'USD', 'EUR');

/**
 * Generate a valid monetary amount (positive, 2 decimal places)
 */
export const validAmount: fc.Arbitrary<number> = fc
  .integer({ min: 1, max: 10000000 }) // 0.01 to 100,000.00
  .map(n => n / 100);

/**
 * Generate a valid positive integer amount
 */
export const validIntegerAmount: fc.Arbitrary<number> = fc.integer({ min: 1, max: 1000000 });

/**
 * Generate an invalid amount (negative or zero)
 */
export const invalidAmount: fc.Arbitrary<number> = fc.oneof(
  fc.constant(0),
  fc.constant(-100),
  fc.double({ min: -10000, max: -0.01 }),
);

// ============================================
// STATUS GENERATORS
// ============================================

/**
 * Generate a valid beneficiary status
 */
export const validBeneficiaryStatus: fc.Arbitrary<'TASLAK' | 'AKTIF' | 'PASIF' | 'SILINDI'> = 
  fc.constantFrom('TASLAK', 'AKTIF', 'PASIF', 'SILINDI');

/**
 * Generate a valid donation status
 */
export const validDonationStatus: fc.Arbitrary<'pending' | 'completed' | 'cancelled'> = 
  fc.constantFrom('pending', 'completed', 'cancelled');

/**
 * Generate a valid task status
 */
export const validTaskStatus: fc.Arbitrary<'pending' | 'in_progress' | 'completed' | 'cancelled'> = 
  fc.constantFrom('pending', 'in_progress', 'completed', 'cancelled');

/**
 * Generate a valid task priority
 */
export const validTaskPriority: fc.Arbitrary<'low' | 'normal' | 'high' | 'urgent'> = 
  fc.constantFrom('low', 'normal', 'high', 'urgent');

// ============================================
// PERMISSION GENERATORS
// ============================================

/**
 * Generate a valid permission value
 */
export const validPermission: fc.Arbitrary<PermissionValue> = 
  fc.constantFrom(...ALL_PERMISSIONS);

/**
 * Generate a set of permissions (1-5 permissions)
 */
export const validPermissionSet: fc.Arbitrary<PermissionValue[]> = fc
  .uniqueArray(validPermission, { minLength: 1, maxLength: 5 });

/**
 * Generate all permissions (admin-like)
 */
export const allPermissions: fc.Arbitrary<PermissionValue[]> = 
  fc.constant([...ALL_PERMISSIONS]);

// ============================================
// DATE GENERATORS
// ============================================

/**
 * Generate a valid ISO date string (past 5 years to future 1 year)
 */
export const validIsoDate: fc.Arbitrary<string> = fc
  .date({
    min: new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000),
    max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  })
  .map(d => d.toISOString());

/**
 * Generate a past date (for birth dates, etc.)
 */
export const pastDate: fc.Arbitrary<string> = fc
  .date({
    min: new Date('1950-01-01'),
    max: new Date(),
  })
  .map(d => d.toISOString().split('T')[0]);

/**
 * Generate a future date (for due dates, etc.)
 */
export const futureDate: fc.Arbitrary<string> = fc
  .date({
    min: new Date(),
    max: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000),
  })
  .map(d => d.toISOString());

// ============================================
// STRING GENERATORS
// ============================================

/**
 * Generate a non-empty string (for names, titles, etc.)
 */
export const nonEmptyString: fc.Arbitrary<string> = fc.string({ minLength: 1, maxLength: 100 });

/**
 * Generate a valid name (Turkish characters allowed)
 */
export const validName: fc.Arbitrary<string> = fc
  .stringMatching(/^[A-Za-zÇçĞğİıÖöŞşÜü][A-Za-zÇçĞğİıÖöŞşÜü\s]{1,49}$/)
  .filter(s => s.trim().length > 0);

/**
 * Generate whitespace-only strings (for validation testing)
 */
export const whitespaceString: fc.Arbitrary<string> = fc.constantFrom(
  '',
  ' ',
  '  ',
  '\t',
  '\n',
  '   \t\n   ',
);

// ============================================
// DOCUMENT ID GENERATORS
// ============================================

/**
 * Generate a valid Appwrite document ID
 */
export const validDocumentId: fc.Arbitrary<string> = fc
  .stringMatching(/^[a-zA-Z0-9]{20}$/);

/**
 * Generate an invalid document ID
 */
export const invalidDocumentId: fc.Arbitrary<string> = fc.oneof(
  fc.constant(''),
  fc.constant('short'),
  fc.string({ minLength: 50, maxLength: 100 }),
);

// ============================================
// COMPOSITE GENERATORS
// ============================================

/**
 * Generate a valid user document
 */
export const validUserDocument = fc.record({
  $id: validDocumentId,
  name: validName,
  email: validEmail,
  role: fc.constantFrom('admin', 'user', 'viewer'),
  permissions: validPermissionSet,
  isActive: fc.boolean(),
  $createdAt: validIsoDate,
  $updatedAt: validIsoDate,
});

/**
 * Generate a valid beneficiary document
 */
export const validBeneficiaryDocument = fc.record({
  $id: validDocumentId,
  name: validName,
  tc_no: validTcKimlikNo,
  phone: validPhoneNumber,
  address: nonEmptyString,
  city: fc.constantFrom('Istanbul', 'Ankara', 'Izmir', 'Bursa'),
  district: nonEmptyString,
  neighborhood: nonEmptyString,
  family_size: fc.integer({ min: 1, max: 20 }),
  status: validBeneficiaryStatus,
  $createdAt: validIsoDate,
  $updatedAt: validIsoDate,
});

/**
 * Generate a valid donation document
 */
export const validDonationDocument = fc.record({
  $id: validDocumentId,
  donor_name: validName,
  donor_phone: validPhoneNumber,
  amount: validIntegerAmount,
  currency: validCurrency,
  donation_type: fc.constantFrom('general', 'orphan', 'education', 'health'),
  payment_method: fc.constantFrom('cash', 'bank_transfer', 'credit_card', 'online'),
  donation_purpose: nonEmptyString,
  receipt_number: fc.stringMatching(/^RCP-[0-9]{13}-[0-9]+$/),
  status: validDonationStatus,
  $createdAt: validIsoDate,
  $updatedAt: validIsoDate,
});

/**
 * Generate a list of financial amounts for aggregation testing
 */
export const financialAmountList: fc.Arbitrary<number[]> = fc
  .array(validAmount, { minLength: 1, maxLength: 100 });
