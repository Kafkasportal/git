import { describe, it, expect } from 'vitest';
import { studentFormSchema } from '@/lib/validations/student';

describe('Student Form Validation', () => {
    it('validates required fields', () => {
        const validData = {
            applicant_name: 'Ahmet Yılmaz',
            applicant_tc_no: '10000000146', // Valid TC number
            applicant_phone: '5551234567', // Valid mobile number
            university: 'Test University',
            department: 'Computer Science',
            grade_level: '2',
            scholarship_id: 'scholarship-1',
            is_orphan: false,
            has_disability: false,
        };

        const result = studentFormSchema.safeParse(validData);
        expect(result.success).toBe(true);
    });

    it('rejects invalid TC number length', () => {
        const invalidData = {
            applicant_name: 'Ahmet Yılmaz',
            applicant_tc_no: '123', // Too short
            applicant_phone: '5551234567',
            university: 'Test University',
            department: 'Computer Science',
            grade_level: '2',
            scholarship_id: 'scholarship-1',
            is_orphan: false,
            has_disability: false,
        };

        const result = studentFormSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
    });

    it('validates optional email field', () => {
        const dataWithEmail = {
            applicant_name: 'Ahmet Yılmaz',
            applicant_tc_no: '10000000146',
            applicant_phone: '5551234567',
            applicant_email: 'ahmet@example.com',
            university: 'Test University',
            department: 'Computer Science',
            grade_level: '2',
            scholarship_id: 'scholarship-1',
            is_orphan: false,
            has_disability: false,
        };

        const result = studentFormSchema.safeParse(dataWithEmail);
        expect(result.success).toBe(true);
    });

    it('rejects invalid email format', () => {
        const invalidData = {
            applicant_name: 'Ahmet Yılmaz',
            applicant_tc_no: '10000000146',
            applicant_phone: '5551234567',
            applicant_email: 'invalid-email',
            university: 'Test University',
            department: 'Computer Science',
            grade_level: '2',
            scholarship_id: 'scholarship-1',
            is_orphan: false,
            has_disability: false,
        };

        const result = studentFormSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
    });

    it('validates GPA range', () => {
        const validGPA = {
            applicant_name: 'Ahmet Yılmaz',
            applicant_tc_no: '10000000146',
            applicant_phone: '5551234567',
            university: 'Test University',
            department: 'Computer Science',
            grade_level: '2',
            scholarship_id: 'scholarship-1',
            gpa: 3.5,
            is_orphan: false,
            has_disability: false,
        };

        const result = studentFormSchema.safeParse(validGPA);
        expect(result.success).toBe(true);
    });

    it('accepts optional fields as undefined', () => {
        const minimalData = {
            applicant_name: 'Ahmet Yılmaz',
            applicant_tc_no: '10000000146',
            applicant_phone: '5551234567',
            university: 'Test University',
            department: 'Computer Science',
            grade_level: '2',
            scholarship_id: 'scholarship-1',
            is_orphan: false,
            has_disability: false,
        };

        const result = studentFormSchema.safeParse(minimalData);
        expect(result.success).toBe(true);
    });
});
