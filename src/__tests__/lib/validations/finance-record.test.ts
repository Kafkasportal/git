/**
 * Finance Record Validation Tests
 */

import { describe, it, expect } from 'vitest';
import {
    financeRecordBaseSchema,
    financeRecordCreateSchema,
    financeRecordUpdateSchema,
    recordTypeValues,
    currencyValues,
    financeStatusValues,
} from '@/lib/validations/finance-record';

describe('Finance Record Validation', () => {
    describe('Enum Values', () => {
        it('should have correct record type values', () => {
            expect(recordTypeValues).toContain('income');
            expect(recordTypeValues).toContain('expense');
        });

        it('should have correct currency values', () => {
            expect(currencyValues).toContain('TRY');
            expect(currencyValues).toContain('USD');
            expect(currencyValues).toContain('EUR');
        });

        it('should have correct status values', () => {
            expect(financeStatusValues).toContain('pending');
            expect(financeStatusValues).toContain('approved');
            expect(financeStatusValues).toContain('rejected');
        });
    });

    describe('financeRecordBaseSchema', () => {
        const validRecord = {
            record_type: 'income' as const,
            category: 'Bağış',
            amount: 100.50,
            currency: 'TRY' as const,
            description: 'Test bağış açıklaması',
            transaction_date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            created_by: 'user-123',
            status: 'pending' as const,
        };

        it('should validate a valid record', () => {
            const result = financeRecordBaseSchema.safeParse(validRecord);
            expect(result.success).toBe(true);
        });

        it('should reject invalid record_type', () => {
            const result = financeRecordBaseSchema.safeParse({
                ...validRecord,
                record_type: 'invalid',
            });
            expect(result.success).toBe(false);
        });

        it('should reject short category', () => {
            const result = financeRecordBaseSchema.safeParse({
                ...validRecord,
                category: 'A',
            });
            expect(result.success).toBe(false);
        });

        it('should reject long category', () => {
            const result = financeRecordBaseSchema.safeParse({
                ...validRecord,
                category: 'A'.repeat(101),
            });
            expect(result.success).toBe(false);
        });

        it('should reject negative amount', () => {
            const result = financeRecordBaseSchema.safeParse({
                ...validRecord,
                amount: -100,
            });
            expect(result.success).toBe(false);
        });

        it('should reject zero amount', () => {
            const result = financeRecordBaseSchema.safeParse({
                ...validRecord,
                amount: 0,
            });
            expect(result.success).toBe(false);
        });

        it('should reject amount with more than 2 decimal places', () => {
            const result = financeRecordBaseSchema.safeParse({
                ...validRecord,
                amount: 100.123,
            });
            expect(result.success).toBe(false);
        });

        it('should accept amount with 2 decimal places', () => {
            const result = financeRecordBaseSchema.safeParse({
                ...validRecord,
                amount: 100.12,
            });
            expect(result.success).toBe(true);
        });

        it('should reject amount that is too high', () => {
            const result = financeRecordBaseSchema.safeParse({
                ...validRecord,
                amount: 99999999999,
            });
            expect(result.success).toBe(false);
        });

        it('should reject invalid currency', () => {
            const result = financeRecordBaseSchema.safeParse({
                ...validRecord,
                currency: 'GBP',
            });
            expect(result.success).toBe(false);
        });

        it('should reject short description', () => {
            const result = financeRecordBaseSchema.safeParse({
                ...validRecord,
                description: 'Test',
            });
            expect(result.success).toBe(false);
        });

        it('should reject long description', () => {
            const result = financeRecordBaseSchema.safeParse({
                ...validRecord,
                description: 'A'.repeat(1001),
            });
            expect(result.success).toBe(false);
        });

        it('should reject invalid transaction_date format', () => {
            const result = financeRecordBaseSchema.safeParse({
                ...validRecord,
                transaction_date: 'invalid-date',
            });
            expect(result.success).toBe(false);
        });

        it('should reject future transaction_date', () => {
            const futureDate = new Date(Date.now() + 86400000 * 7).toISOString(); // 7 days in future
            const result = financeRecordBaseSchema.safeParse({
                ...validRecord,
                transaction_date: futureDate,
            });
            expect(result.success).toBe(false);
        });

        it('should reject empty created_by', () => {
            const result = financeRecordBaseSchema.safeParse({
                ...validRecord,
                created_by: '',
            });
            expect(result.success).toBe(false);
        });

        it('should reject invalid status', () => {
            const result = financeRecordBaseSchema.safeParse({
                ...validRecord,
                status: 'invalid',
            });
            expect(result.success).toBe(false);
        });

        it('should accept optional payment_method', () => {
            const result = financeRecordBaseSchema.safeParse({
                ...validRecord,
                payment_method: 'Nakit',
            });
            expect(result.success).toBe(true);
        });

        it('should reject long payment_method', () => {
            const result = financeRecordBaseSchema.safeParse({
                ...validRecord,
                payment_method: 'A'.repeat(101),
            });
            expect(result.success).toBe(false);
        });

        it('should accept optional receipt_number', () => {
            const result = financeRecordBaseSchema.safeParse({
                ...validRecord,
                receipt_number: 'FIS-001',
            });
            expect(result.success).toBe(true);
        });

        it('should accept optional receipt_file_id', () => {
            const result = financeRecordBaseSchema.safeParse({
                ...validRecord,
                receipt_file_id: 'file-123',
            });
            expect(result.success).toBe(true);
        });

        it('should accept optional related_to', () => {
            const result = financeRecordBaseSchema.safeParse({
                ...validRecord,
                related_to: 'donation-123',
            });
            expect(result.success).toBe(true);
        });
    });

    describe('financeRecordCreateSchema', () => {
        it('should be same as base schema', () => {
            const validRecord = {
                record_type: 'expense' as const,
                category: 'Gider',
                amount: 50.00,
                currency: 'TRY' as const,
                description: 'Test gider açıklaması',
                transaction_date: new Date(Date.now() - 86400000).toISOString(),
                created_by: 'user-456',
                status: 'pending' as const,
            };

            const result = financeRecordCreateSchema.safeParse(validRecord);
            expect(result.success).toBe(true);
        });
    });

    describe('financeRecordUpdateSchema', () => {
        it('should allow partial updates', () => {
            const result = financeRecordUpdateSchema.safeParse({
                amount: 200.00,
            });
            expect(result.success).toBe(true);
        });

        it('should allow empty update', () => {
            const result = financeRecordUpdateSchema.safeParse({});
            expect(result.success).toBe(true);
        });

        it('should validate transaction_date if provided', () => {
            const futureDate = new Date(Date.now() + 86400000 * 7).toISOString();
            const result = financeRecordUpdateSchema.safeParse({
                transaction_date: futureDate,
            });
            expect(result.success).toBe(false);
        });

        it('should accept valid transaction_date update', () => {
            const pastDate = new Date(Date.now() - 86400000).toISOString();
            const result = financeRecordUpdateSchema.safeParse({
                transaction_date: pastDate,
            });
            expect(result.success).toBe(true);
        });

        it('should allow updating status', () => {
            const result = financeRecordUpdateSchema.safeParse({
                status: 'approved',
            });
            expect(result.success).toBe(true);
        });

        it('should allow updating category', () => {
            const result = financeRecordUpdateSchema.safeParse({
                category: 'Yeni Kategori',
            });
            expect(result.success).toBe(true);
        });
    });
});
