import { describe, it, expect } from 'vitest';
import { beneficiarySchema } from '@/lib/validations/beneficiary';
import { BeneficiaryCategory, FundRegion, FileConnection, City } from '@/types/beneficiary';

describe('Beneficiary Validations', () => {
  describe('Quick Add Schema', () => {
    it('should validate complete beneficiary quick add data', () => {
      const validData = {
        category: BeneficiaryCategory.IHTIYAC_SAHIBI_AILE,
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
        nationality: 'Türkiye',
        fundRegion: FundRegion.SERBEST,
        fileConnection: FileConnection.BAGIMSIZ,
        fileNumber: 'F2024001',
      };

      const result = beneficiarySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject incomplete data (missing required fields)', () => {
      const invalidData = {
        category: BeneficiaryCategory.IHTIYAC_SAHIBI_AILE,
        // Missing firstName, lastName, etc.
      };

      const result = beneficiarySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid category', () => {
      const invalidData = {
        category: 'INVALID_CATEGORY' as BeneficiaryCategory,
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
        nationality: 'Türkiye',
        fundRegion: FundRegion.SERBEST,
        fileConnection: FileConnection.BAGIMSIZ,
        fileNumber: '2024-001',
      };

      const result = beneficiarySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept optional fields', () => {
      const validData = {
        category: BeneficiaryCategory.IHTIYAC_SAHIBI_AILE,
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
        nationality: 'Türkiye',
        fundRegion: FundRegion.SERBEST,
        fileConnection: FileConnection.BAGIMSIZ,
        fileNumber: 'F2024001',
        birthDate: '2000-01-01',
        // Optional fields with valid formats
        identityNumber: '11111111110', // Valid TC (passes algorithm check)
        mernisCheck: true,
        mobilePhone: '5551234567', // Valid Turkish mobile (without +90)
        email: 'ahmet@example.com',
        city: City.ISTANBUL,
        district: 'Kadıköy',
        fatherName: 'Mehmet',
        motherName: 'Ayşe',
      };

      const result = beneficiarySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});
