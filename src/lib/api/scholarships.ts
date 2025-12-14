/**
 * Scholarships API Client
 * Handles all scholarship, application, and payment operations
 * Migrated to Appwrite
 */

import {
  appwriteScholarships,
  appwriteScholarshipApplications,
  appwriteScholarshipPayments,
} from '@/lib/appwrite/api';
import { fetchWithCsrf } from '@/lib/csrf-client';
import logger from '@/lib/logger';

// Scholarship Programs API
export const scholarshipsApi = {
  // Get all scholarships - use API route for client-side
  list: async (params?: {
    limit?: number;
    skip?: number;
    category?: string;
    isActive?: boolean;
  }) => {
    try {
      // Use API route for client-side calls
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.skip) queryParams.append('skip', params.skip.toString());
      if (params?.category) queryParams.append('category', params.category);
      if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

      const response = await fetch(`/api/scholarships?${queryParams.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch scholarships: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: result.success ?? true,
        data: result.data ?? [],
        total: result.total ?? 0,
        error: result.error ?? null,
      };
    } catch (error) {
      logger.error('Error listing scholarships', error);
      return {
        success: false,
        data: [],
        total: 0,
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      };
    }
  },

  // Get single scholarship
  get: async (id: string) => {
    try {
      const data = await appwriteScholarships.get(id);
      return {
        success: true,
        data,
        error: null,
      };
    } catch (error) {
      logger.error('Error getting scholarship', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      };
    }
  },

  // Create scholarship
  create: async (data: {
    title: string;
    description?: string;
    amount: number;
    currency: 'TRY' | 'USD' | 'EUR';
    duration_months?: number;
    category: string;
    eligibility_criteria?: string;
    requirements?: string[];
    application_start_date: string;
    application_end_date: string;
    academic_year?: string;
    max_recipients?: number;
    is_active: boolean;
  }) => {
    try {
      const result = await appwriteScholarships.create(data) as { $id: string };
      return {
        success: true,
        data: { _id: result.$id },
        error: null,
      };
    } catch (error) {
      logger.error('Error creating scholarship', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      };
    }
  },

  // Update scholarship
  update: async (
    id: string,
    data: {
      title?: string;
      description?: string;
      amount?: number;
      duration_months?: number;
      category?: string;
      eligibility_criteria?: string;
      requirements?: string[];
      application_start_date?: string;
      application_end_date?: string;
      academic_year?: string;
      max_recipients?: number;
      is_active?: boolean;
    }
  ) => {
    try {
      await appwriteScholarships.update(id, data);
      return {
        success: true,
        error: null,
      };
    } catch (error) {
      logger.error('Error updating scholarship', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      };
    }
  },

  // Delete scholarship
  remove: async (id: string) => {
    try {
      await appwriteScholarships.remove(id);
      return {
        success: true,
        error: null,
      };
    } catch (error) {
      logger.error('Error deleting scholarship', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      };
    }
  },

  // Get statistics
  getStatistics: async (scholarshipId?: string) => {
    try {
      const stats = await appwriteScholarships.getStatistics(scholarshipId);
      return {
        success: true,
        data: stats,
        error: null,
      };
    } catch (error) {
      logger.error('Error getting statistics', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      };
    }
  },
};

// Scholarship Applications API
export const scholarshipApplicationsApi = {
  // List applications - use API route for client-side
  list: async (params?: {
    limit?: number;
    skip?: number;
    scholarship_id?: string;
    status?: string;
    tc_no?: string;
  }) => {
    try {
      // Use API route for client-side calls
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.skip) queryParams.append('skip', params.skip.toString());
      if (params?.scholarship_id) queryParams.append('scholarship_id', params.scholarship_id);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.tc_no) queryParams.append('tc_no', params.tc_no);

      const response = await fetch(`/api/scholarships/applications?${queryParams.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch applications: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: result.success ?? true,
        data: result.data ?? [],
        total: result.total ?? 0,
        error: result.error ?? null,
      };
    } catch (error) {
      logger.error('Error listing applications', error);
      return {
        success: false,
        data: [],
        total: 0,
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      };
    }
  },

  // Get single application - use API route for client-side
  get: async (id: string) => {
    try {
      const response = await fetch(`/api/scholarships/applications/${id}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch application: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: result.success ?? true,
        data: result.data ?? null,
        error: result.error ?? null,
      };
    } catch (error) {
      logger.error('Error getting application', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      };
    }
  },

  // Create application - use API route for client-side
  create: async (data: {
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
    documents?: string[];
  }) => {
    try {
      const response = await fetchWithCsrf('/api/scholarships/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create application: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: result.success ?? true,
        data: result.data ? { _id: result.data.$id || result.data._id } : null,
        error: result.error ?? null,
      };
    } catch (error) {
      logger.error('Error creating application', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      };
    }
  },

  // Update application - use API route for client-side
  update: async (
    id: string,
    data: {
      status?: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'waitlisted';
      reviewer_notes?: string;
      reviewed_by?: string;
      reviewed_at?: string;
      submitted_at?: string;
      applicant_name?: string;
      applicant_tc_no?: string;
      applicant_phone?: string;
      applicant_email?: string;
      university?: string;
      department?: string;
      grade_level?: string;
      gpa?: number;
      monthly_income?: number;
      family_income?: number;
      father_occupation?: string;
      mother_occupation?: string;
      sibling_count?: number;
      is_orphan?: boolean;
      has_disability?: boolean;
      essay?: string;
    }
  ) => {
    try {
      const response = await fetchWithCsrf(`/api/scholarships/applications/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update application: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: result.success ?? true,
        error: result.error ?? null,
      };
    } catch (error) {
      logger.error('Error updating application', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      };
    }
  },

  // Submit application
  submit: async (id: string) => {
    try {
      await appwriteScholarshipApplications.submit(id);
      return {
        success: true,
        error: null,
      };
    } catch (error) {
      logger.error('Error submitting application', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      };
    }
  },
};

// Scholarship Payments API
export const scholarshipPaymentsApi = {
  // List payments
  list: async (params?: {
    limit?: number;
    skip?: number;
    application_id?: string;
    status?: string;
  }) => {
    try {
      const response = await appwriteScholarshipPayments.list(params);
      return {
        success: true,
        data: response.documents,
        total: response.total,
        error: null,
      };
    } catch (error) {
      logger.error('Error listing payments', error);
      return {
        success: false,
        data: [],
        total: 0,
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      };
    }
  },

  // Create payment
  create: async (data: {
    application_id: string;
    payment_date: string;
    amount: number;
    currency: 'TRY' | 'USD' | 'EUR';
    payment_method: string;
    payment_reference?: string;
    bank_account?: string;
    notes?: string;
  }) => {
    try {
      const result = await appwriteScholarshipPayments.create(data) as { $id: string };
      return {
        success: true,
        data: { _id: result.$id },
        error: null,
      };
    } catch (error) {
      logger.error('Error creating payment', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      };
    }
  },

  // Update payment
  update: async (
    id: string,
    data: {
      status: 'pending' | 'paid' | 'failed' | 'cancelled';
      processed_by?: string;
      receipt_file_id?: string;
      notes?: string;
    }
  ) => {
    try {
      await appwriteScholarshipPayments.update(id, data);
      return {
        success: true,
        error: null,
      };
    } catch (error) {
      logger.error('Error updating payment', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      };
    }
  },
};
