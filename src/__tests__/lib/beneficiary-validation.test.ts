import { describe, it, expect } from 'vitest';
import {
  beneficiarySchema,
  quickAddBeneficiarySchema,
  basicInfoSchema,
  identityInfoSchema,
  personalDataSchema,
  healthInfoSchema,
} from '@/lib/validations/beneficiary';
import {
  BeneficiaryCategory,
  FundRegion,
  FileConnection,
  MaritalStatus,
  Gender,
} from '@/types/beneficiary';

describe('Beneficiary Validation Schema', () => {
  describe('quickAddBeneficiarySchema', () => {
    it('should validate minimal required fields', () => {
      const validData = {
        category: BeneficiaryCategory.IHTIYAC_SAHIBI_AILE,
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
        nationality: 'Türkiye',
        fundRegion: FundRegion.SERBEST,
        fileConnection: FileConnection.CALISMA_SAHASI,
        fileNumber: 'FILE001',
        mernisCheck: false,
      };

      const result = quickAddBeneficiarySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid TC Kimlik No', () => {
      const invalidData = {
        category: BeneficiaryCategory.IHTIYAC_SAHIBI_AILE,
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
        nationality: 'Türkiye',
        identityNumber: '12345678901', // Invalid checksum
        fundRegion: FundRegion.SERBEST,
        fileConnection: FileConnection.CALISMA_SAHASI,
        fileNumber: 'FILE001',
      };

      const result = quickAddBeneficiarySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Geçersiz TC Kimlik No');
      }
    });

    it('should reject short names', () => {
      const invalidData = {
        category: BeneficiaryCategory.IHTIYAC_SAHIBI_AILE,
        firstName: 'A', // Too short
        lastName: 'Yılmaz',
        nationality: 'Türkiye',
        fundRegion: FundRegion.SERBEST,
        fileConnection: FileConnection.CALISMA_SAHASI,
        fileNumber: 'FILE001',
      };

      const result = quickAddBeneficiarySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid file number format', () => {
      const invalidData = {
        category: BeneficiaryCategory.IHTIYAC_SAHIBI_AILE,
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
        nationality: 'Türkiye',
        fundRegion: FundRegion.SERBEST,
        fileConnection: FileConnection.CALISMA_SAHASI,
        fileNumber: 'file-001', // Lowercase not allowed
      };

      const result = quickAddBeneficiarySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('beneficiarySchema - Required Fields', () => {
    it('should validate all required fields', () => {
      const validData = {
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
        nationality: 'Türkiye',
        category: BeneficiaryCategory.IHTIYAC_SAHIBI_AILE,
        fundRegion: FundRegion.SERBEST,
        fileConnection: FileConnection.CALISMA_SAHASI,
        fileNumber: 'FILE001',
        mernisCheck: false,
      };

      const result = beneficiarySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        firstName: 'Ahmet',
        // Missing lastName, category, etc.
      };

      const result = beneficiarySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });
  });

  describe('beneficiarySchema - Conditional Validation', () => {
    it('should require Mernis check when TC Kimlik No is provided', () => {
      const invalidData = {
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
        nationality: 'Türkiye',
        identityNumber: '10000000146', // Valid TC (example)
        mernisCheck: false, // Should be true
        category: BeneficiaryCategory.IHTIYAC_SAHIBI_AILE,
        fundRegion: FundRegion.SERBEST,
        fileConnection: FileConnection.CALISMA_SAHASI,
        fileNumber: 'FILE001',
      };

      const result = beneficiarySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const mernisError = result.error.issues.find((issue) => issue.path.includes('mernisCheck'));
        expect(mernisError).toBeDefined();
      }
    });

    it('should reject marriage for under 18', () => {
      const today = new Date();
      const birthDateStr = new Date(
        today.getFullYear() - 16,
        today.getMonth(),
        today.getDate()
      ).toISOString();

      const invalidData = {
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
        nationality: 'Türkiye',
        birthDate: birthDateStr,
        maritalStatus: MaritalStatus.EVLI, // Under 18 cannot be married
        category: BeneficiaryCategory.IHTIYAC_SAHIBI_AILE,
        fundRegion: FundRegion.SERBEST,
        fileConnection: FileConnection.CALISMA_SAHASI,
        fileNumber: 'FILE001',
        mernisCheck: false,
      };

      const result = beneficiarySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('18 yaşından küçük');
      }
    });
  });

  describe('beneficiarySchema - Email Validation', () => {
    it('should accept valid email', () => {
      const validData = {
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
        nationality: 'Türkiye',
        email: 'ahmet@example.com',
        category: BeneficiaryCategory.IHTIYAC_SAHIBI_AILE,
        fundRegion: FundRegion.SERBEST,
        fileConnection: FileConnection.CALISMA_SAHASI,
        fileNumber: 'FILE001',
        mernisCheck: false,
      };

      const result = beneficiarySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
        nationality: 'Türkiye',
        email: 'invalid-email',
        category: BeneficiaryCategory.IHTIYAC_SAHIBI_AILE,
        fundRegion: FundRegion.SERBEST,
        fileConnection: FileConnection.CALISMA_SAHASI,
        fileNumber: 'FILE001',
        mernisCheck: false,
      };

      const result = beneficiarySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept empty string for optional email', () => {
      const validData = {
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
        nationality: 'Türkiye',
        email: '',
        category: BeneficiaryCategory.IHTIYAC_SAHIBI_AILE,
        fundRegion: FundRegion.SERBEST,
        fileConnection: FileConnection.CALISMA_SAHASI,
        fileNumber: 'FILE001',
        mernisCheck: false,
      };

      const result = beneficiarySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('beneficiarySchema - Number Validation', () => {
    it('should accept valid income/expense', () => {
      const validData = {
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
        nationality: 'Türkiye',
        monthlyIncome: 5000,
        monthlyExpense: 3000,
        category: BeneficiaryCategory.IHTIYAC_SAHIBI_AILE,
        fundRegion: FundRegion.SERBEST,
        fileConnection: FileConnection.CALISMA_SAHASI,
        fileNumber: 'FILE001',
        mernisCheck: false,
      };

      const result = beneficiarySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject negative income', () => {
      const invalidData = {
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
        nationality: 'Türkiye',
        monthlyIncome: -1000,
        category: BeneficiaryCategory.IHTIYAC_SAHIBI_AILE,
        fundRegion: FundRegion.SERBEST,
        fileConnection: FileConnection.CALISMA_SAHASI,
        fileNumber: 'FILE001',
        mernisCheck: false,
      };

      const result = beneficiarySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject excessive income', () => {
      const invalidData = {
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
        nationality: 'Türkiye',
        monthlyIncome: 2000000, // Over 1M limit
        category: BeneficiaryCategory.IHTIYAC_SAHIBI_AILE,
        fundRegion: FundRegion.SERBEST,
        fileConnection: FileConnection.CALISMA_SAHASI,
        fileNumber: 'FILE001',
        mernisCheck: false,
      };

      const result = beneficiarySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('beneficiarySchema - Emergency Contacts', () => {
    it('should accept valid emergency contacts', () => {
      const validData = {
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
        nationality: 'Türkiye',
        emergencyContacts: [
          {
            name: 'Mehmet Yılmaz',
            relationship: 'Kardeş',
            phone: '5551234567',
          },
        ],
        category: BeneficiaryCategory.IHTIYAC_SAHIBI_AILE,
        fundRegion: FundRegion.SERBEST,
        fileConnection: FileConnection.CALISMA_SAHASI,
        fileNumber: 'FILE001',
        mernisCheck: false,
      };

      const result = beneficiarySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject more than 2 emergency contacts', () => {
      const invalidData = {
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
        nationality: 'Türkiye',
        emergencyContacts: [
          { name: 'Contact 1', relationship: 'Kardeş', phone: '5551234567' },
          { name: 'Contact 2', relationship: 'Anne', phone: '5551234568' },
          { name: 'Contact 3', relationship: 'Baba', phone: '5551234569' },
        ],
        category: BeneficiaryCategory.IHTIYAC_SAHIBI_AILE,
        fundRegion: FundRegion.SERBEST,
        fileConnection: FileConnection.CALISMA_SAHASI,
        fileNumber: 'FILE001',
        mernisCheck: false,
      };

      const result = beneficiarySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid emergency contact phone', () => {
      const invalidData = {
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
        nationality: 'Türkiye',
        emergencyContacts: [
          {
            name: 'Mehmet Yılmaz',
            relationship: 'Kardeş',
            phone: '123', // Too short
          },
        ],
        category: BeneficiaryCategory.IHTIYAC_SAHIBI_AILE,
        fundRegion: FundRegion.SERBEST,
        fileConnection: FileConnection.CALISMA_SAHASI,
        fileNumber: 'FILE001',
        mernisCheck: false,
      };

      const result = beneficiarySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Section Schemas', () => {
    it('should validate basicInfoSchema', () => {
      const validData = {
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
        nationality: 'Türkiye',
        category: BeneficiaryCategory.IHTIYAC_SAHIBI_AILE,
        fundRegion: FundRegion.SERBEST,
        fileConnection: FileConnection.CALISMA_SAHASI,
        fileNumber: 'FILE001',
      };

      const result = basicInfoSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate identityInfoSchema', () => {
      const validData = {
        fatherName: 'Mehmet',
        motherName: 'Ayşe',
      };

      const result = identityInfoSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate personalDataSchema', () => {
      const validData = {
        gender: Gender.ERKEK,
        maritalStatus: MaritalStatus.BEKAR,
      };

      const result = personalDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate healthInfoSchema', () => {
      const validData = {
        healthProblem: 'Yok',
        diseases: [],
      };

      const result = healthInfoSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});
