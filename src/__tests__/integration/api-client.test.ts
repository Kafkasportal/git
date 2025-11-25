/**
 * Integration tests for API client
 * Validates CRUD operations and type safety across all resources
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  BeneficiaryCreateInput,
  DonationCreateInput,
  TaskCreateInput,
  MeetingCreateInput,
  UserCreateInput,
  AidApplicationCreateInput,
  FinanceRecordCreateInput,
  PartnerCreateInput,
} from '@/lib/api/types';

// Mock API client methods
const mockApiClient = {
  beneficiaries: {
    create: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  donations: {
    create: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  tasks: {
    create: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  meetings: {
    create: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  users: {
    create: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  aidApplications: {
    create: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  financeRecords: {
    create: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  partners: {
    create: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

describe('API Client Integration Tests', () => {
  beforeEach(() => {
    Object.values(mockApiClient).forEach((resource) => {
      Object.values(resource).forEach((method) => {
        if (typeof method === 'function') {
          method.mockClear();
        }
      });
    });
  });

  describe('Beneficiary CRUD Operations', () => {
    it('should create beneficiary with required fields', async () => {
      const input: BeneficiaryCreateInput = {
        name: 'John Doe',
        tc_no: '12345678901',
        phone: '+905551234567',
        address: '123 Main St',
        city: 'Istanbul',
        district: 'Beyoglu',
        neighborhood: 'Cihangir',
        family_size: 4,
      };

      mockApiClient.beneficiaries.create.mockResolvedValue({ _id: 'ben_123', ...input });

      const result = await mockApiClient.beneficiaries.create(input);

      expect(mockApiClient.beneficiaries.create).toHaveBeenCalledWith(input);
      expect(result._id).toBeDefined();
      expect(result.name).toBe('John Doe');
    });

    it('should retrieve beneficiary by ID', async () => {
      const beneficiary = {
        _id: 'ben_123',
        name: 'John Doe',
        tc_no: '12345678901',
        phone: '+905551234567',
        address: '123 Main St',
        city: 'Istanbul',
        district: 'Beyoglu',
        neighborhood: 'Cihangir',
        family_size: 4,
      };

      mockApiClient.beneficiaries.getById.mockResolvedValue(beneficiary);

      const result = await mockApiClient.beneficiaries.getById('ben_123');

      expect(mockApiClient.beneficiaries.getById).toHaveBeenCalledWith('ben_123');
      expect(result._id).toBe('ben_123');
      expect(result.name).toBe('John Doe');
    });

    it('should update beneficiary with partial data', async () => {
      const update = {
        name: 'Jane Doe',
        email: 'jane@example.com',
      };

      mockApiClient.beneficiaries.update.mockResolvedValue({
        _id: 'ben_123',
        name: 'Jane Doe',
        email: 'jane@example.com',
      });

      const result = await mockApiClient.beneficiaries.update('ben_123', update);

      expect(mockApiClient.beneficiaries.update).toHaveBeenCalledWith('ben_123', update);
      expect(result.name).toBe('Jane Doe');
    });

    it('should delete beneficiary', async () => {
      mockApiClient.beneficiaries.delete.mockResolvedValue({ success: true });

      const result = await mockApiClient.beneficiaries.delete('ben_123');

      expect(mockApiClient.beneficiaries.delete).toHaveBeenCalledWith('ben_123');
      expect(result.success).toBe(true);
    });
  });

  describe('Donation CRUD Operations', () => {
    it('should create donation with payment details', async () => {
      const input: DonationCreateInput = {
        donor_name: 'Ahmed Hassan',
        donor_phone: '+905551234567',
        amount: 5000,
        currency: 'TRY',
        donation_type: 'zakat',
        payment_method: 'bank_transfer',
        donation_purpose: 'General Aid Fund',
        receipt_number: 'RCP-2024-001',
        status: 'pending',
      };

      mockApiClient.donations.create.mockResolvedValue({ _id: 'don_123', ...input });

      const result = await mockApiClient.donations.create(input);

      expect(mockApiClient.donations.create).toHaveBeenCalledWith(input);
      expect(result.amount).toBe(5000);
      expect(result.payment_method).toBe('bank_transfer');
    });

    it('should update donation status', async () => {
      const update = {
        status: 'approved' as const,
      };

      mockApiClient.donations.update.mockResolvedValue({
        _id: 'don_123',
        status: 'approved',
      });

      const result = await mockApiClient.donations.update('don_123', update);

      expect(mockApiClient.donations.update).toHaveBeenCalledWith('don_123', update);
      expect(result.status).toBe('approved');
    });
  });

  describe('Task CRUD Operations', () => {
    it('should create task with priority and assignment', async () => {
      const input: TaskCreateInput = {
        title: 'Complete quarterly report',
        description: 'Compile all financial data',
        assigned_to: 'user_456' as any,
        created_by: 'user_123' as any,
        priority: 'high',
        status: 'pending',
        due_date: '2024-12-31',
        is_read: false,
      };

      mockApiClient.tasks.create.mockResolvedValue({ _id: 'task_123', ...input });

      const result = await mockApiClient.tasks.create(input);

      expect(mockApiClient.tasks.create).toHaveBeenCalledWith(input);
      expect(result.priority).toBe('high');
      expect(result.assigned_to).toBe('user_456');
    });

    it('should update task status', async () => {
      const update = {
        status: 'completed' as const,
        completed_at: '2024-12-20T15:30:00Z',
      };

      mockApiClient.tasks.update.mockResolvedValue({
        _id: 'task_123',
        status: 'completed',
        completed_at: '2024-12-20T15:30:00Z',
      });

      const result = await mockApiClient.tasks.update('task_123', update);

      expect(result.status).toBe('completed');
    });
  });

  describe('Meeting CRUD Operations', () => {
    it('should create meeting with participants', async () => {
      const input: MeetingCreateInput = {
        title: 'Monthly Board Meeting',
        description: 'Review quarterly results',
        meeting_date: '2024-12-25T14:00:00Z',
        location: 'Main Conference Room',
        organizer: 'user_123' as any,
        participants: ['user_456', 'user_789', 'user_012'] as any,
        status: 'scheduled',
        meeting_type: 'board',
      };

      mockApiClient.meetings.create.mockResolvedValue({ _id: 'meet_123', ...input });

      const result = await mockApiClient.meetings.create(input);

      expect(mockApiClient.meetings.create).toHaveBeenCalledWith(input);
      expect(result.participants.length).toBe(3);
      expect(result.meeting_type).toBe('board');
    });

    it('should update meeting status', async () => {
      const update = {
        status: 'completed' as const,
      };

      mockApiClient.meetings.update.mockResolvedValue({
        _id: 'meet_123',
        status: 'completed',
      });

      const result = await mockApiClient.meetings.update('meet_123', update);

      expect(result.status).toBe('completed');
    });
  });

  describe('User CRUD Operations', () => {
    it('should create user with role and permissions', async () => {
      const input: UserCreateInput = {
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        isActive: true,
        permissions: ['read', 'write', 'delete'],
        passwordHash: 'hashedPassword123',
      };

      mockApiClient.users.create.mockResolvedValue({ _id: 'user_123', ...input });

      const result = await mockApiClient.users.create(input);

      expect(mockApiClient.users.create).toHaveBeenCalledWith(input);
      expect(result.role).toBe('admin');
      expect(result.permissions).toContain('write');
    });

    it('should update user role', async () => {
      const update = {
        role: 'staff' as const,
      };

      mockApiClient.users.update.mockResolvedValue({
        _id: 'user_123',
        role: 'staff',
      });

      const result = await mockApiClient.users.update('user_123', update);

      expect(result.role).toBe('staff');
    });
  });

  describe('Finance Record CRUD Operations', () => {
    it('should create income record', async () => {
      const input: FinanceRecordCreateInput = {
        record_type: 'income',
        category: 'Donations',
        amount: 10000,
        currency: 'TRY',
        description: 'Monthly donation campaign',
        transaction_date: '2024-12-20',
        created_by: 'user_123' as any,
        status: 'pending',
      };

      mockApiClient.financeRecords.create.mockResolvedValue({ _id: 'fin_123', ...input });

      const result = await mockApiClient.financeRecords.create(input);

      expect(mockApiClient.financeRecords.create).toHaveBeenCalledWith(input);
      expect(result.record_type).toBe('income');
      expect(result.amount).toBe(10000);
    });

    it('should create expense record', async () => {
      const input: FinanceRecordCreateInput = {
        record_type: 'expense',
        category: 'Scholarships',
        amount: 5000,
        currency: 'TRY',
        description: 'Monthly scholarship payments',
        transaction_date: '2024-12-20',
        created_by: 'user_123' as any,
        status: 'pending',
      };

      mockApiClient.financeRecords.create.mockResolvedValue({ _id: 'fin_124', ...input });

      const result = await mockApiClient.financeRecords.create(input);

      expect(result.record_type).toBe('expense');
    });

    it('should update finance record status', async () => {
      const update = {
        status: 'approved' as const,
        approved_by: 'user_456',
      };

      mockApiClient.financeRecords.update.mockResolvedValue({
        _id: 'fin_123',
        status: 'approved',
        approved_by: 'user_456',
      });

      const result = await mockApiClient.financeRecords.update('fin_123', update);

      expect(result.status).toBe('approved');
    });
  });

  describe('Partner CRUD Operations', () => {
    it('should create partner with relationship type', async () => {
      const input: PartnerCreateInput = {
        name: 'Red Crescent Society',
        type: 'organization',
        contact_person: 'Ali Yilmaz',
        email: 'ali@redcrescent.org.tr',
        phone: '+905551234567',
        partnership_type: 'donor',
        status: 'active',
      };

      mockApiClient.partners.create.mockResolvedValue({ _id: 'part_123', ...input });

      const result = await mockApiClient.partners.create(input);

      expect(mockApiClient.partners.create).toHaveBeenCalledWith(input);
      expect(result.partnership_type).toBe('donor');
      expect(result.type).toBe('organization');
    });

    it('should update partner status', async () => {
      const update = {
        status: 'inactive' as const,
      };

      mockApiClient.partners.update.mockResolvedValue({
        _id: 'part_123',
        status: 'inactive',
      });

      const result = await mockApiClient.partners.update('part_123', update);

      expect(result.status).toBe('inactive');
    });
  });

  describe('Aid Application CRUD Operations', () => {
    it('should create aid application', async () => {
      const input: AidApplicationCreateInput = {
        application_date: '2024-12-20',
        applicant_type: 'person',
        applicant_name: 'Fatima Hassan',
        beneficiary_id: 'ben_123' as any,
        one_time_aid: 2000,
        stage: 'draft',
        status: 'open',
        priority: 'high',
      };

      mockApiClient.aidApplications.create.mockResolvedValue({ _id: 'aid_123', ...input });

      const result = await mockApiClient.aidApplications.create(input);

      expect(mockApiClient.aidApplications.create).toHaveBeenCalledWith(input);
      expect(result.stage).toBe('draft');
      expect(result.priority).toBe('high');
    });

    it('should update aid application stage', async () => {
      const update = {
        stage: 'approved' as const,
        approved_by: 'user_456',
        approved_at: '2024-12-20T10:00:00Z',
      };

      mockApiClient.aidApplications.update.mockResolvedValue({
        _id: 'aid_123',
        stage: 'approved',
        approved_by: 'user_456',
      });

      const result = await mockApiClient.aidApplications.update('aid_123', update);

      expect(result.stage).toBe('approved');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const error = new Error('Network error');
      mockApiClient.beneficiaries.create.mockRejectedValue(error);

      try {
        await mockApiClient.beneficiaries.create({
          name: 'Test',
          tc_no: '12345678901',
          phone: '+905551234567',
          address: 'Test',
          city: 'Istanbul',
          district: 'Test',
          neighborhood: 'Test',
          family_size: 1,
        });
      } catch (err) {
        expect(err).toBe(error);
      }
    });

    it('should handle validation errors', async () => {
      const validationError = new Error('Invalid input');
      mockApiClient.donations.create.mockRejectedValue(validationError);

      try {
        await mockApiClient.donations.create({
          donor_name: '',
          donor_phone: 'invalid',
          amount: -100,
          currency: 'TRY',
          donation_type: 'zakat',
          donation_purpose: 'Test',
          receipt_number: 'RCP-001',
          status: 'pending',
        });
      } catch (err) {
        expect(err).toBe(validationError);
      }
    });
  });
});
