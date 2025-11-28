/**
 * API Client Tests
 * Tests for Appwrite API client functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient, cacheUtils } from '@/lib/api/api-client';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock getCache
vi.mock('@/lib/api-cache', () => ({
  getCache: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    clear: vi.fn(),
    getStats: vi.fn(() => ({ hits: 10, misses: 2, size: 5 })),
    size: vi.fn(() => 5),
  })),
}));

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: { _id: 'test-id', name: 'Test' },
        }),
    });
  });

  describe('Beneficiaries API', () => {
    it('should get beneficiaries with pagination', async () => {
      const result = await apiClient.beneficiaries.getBeneficiaries({
        page: 1,
        limit: 10,
        search: 'test',
      });

      expect(result.data).toEqual({ _id: 'test-id', name: 'Test' });
      expect(result.error).toBeNull();
    });

    it('should get single beneficiary', async () => {
      const result = await apiClient.beneficiaries.getBeneficiary('test-id');

      expect(result.data).toEqual({ _id: 'test-id', name: 'Test' });
      expect(mockFetch).toHaveBeenCalledWith('/api/beneficiaries/test-id', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should create beneficiary', async () => {
      const testData = {
        name: 'New Beneficiary',
        email: 'test@example.com',
        tc_no: '12345678901',
        phone: '5551234567',
        address: 'Test Address',
        city: 'Istanbul',
        district: 'Test District',
        neighborhood: 'Test Neighborhood',
        family_size: 4,
        status: 'TASLAK' as const,
      };
      const result = await apiClient.beneficiaries.createBeneficiary(testData);

      expect(result.data).toEqual({ _id: 'test-id', name: 'Test' });
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/beneficiaries',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(testData),
        })
      );
    });

    it('should update beneficiary', async () => {
      const updateData = { name: 'Updated Name' };
      const result = await apiClient.beneficiaries.updateBeneficiary('test-id', updateData);

      expect(result.data).toEqual({ _id: 'test-id', name: 'Test' });
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/beneficiaries/test-id',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        })
      );
    });

    it('should delete beneficiary', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: null }),
      });

      const result = await apiClient.beneficiaries.deleteBeneficiary('test-id');

      expect(result.data).toBeNull();
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/beneficiaries/test-id',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('Partners API', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: [
              { _id: 'partner-1', name: 'Partner 1', type: 'organization' },
              { _id: 'partner-2', name: 'Partner 2', type: 'individual' },
            ],
          }),
      });
    });

    it('should get partners with filters', async () => {
      const result = await apiClient.partners.getPartners({
        page: 1,
        limit: 10,
        filters: {
          type: 'organization',
          status: 'active',
        },
      });

      expect(result.data).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/partners?page=1&limit=10&type=organization&status=active',
        expect.any(Object)
      );
    });

    it('should get single partner', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: { _id: 'partner-1', name: 'Partner 1', type: 'organization' },
          }),
      });

      const result = await apiClient.partners.getPartner('partner-1');

      expect(result.data).toEqual({
        _id: 'partner-1',
        name: 'Partner 1',
        type: 'organization',
      });
    });

    it('should create partner', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { _id: 'test-id', name: 'Test' } }),
      });

      const partnerData = {
        name: 'New Partner',
        type: 'organization' as const,
        partnership_type: 'donor' as const,
        status: 'active' as const,
      };

      const result = await apiClient.partners.createPartner(partnerData);

      expect(result.data).toEqual({ _id: 'test-id', name: 'Test' });
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/partners',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(partnerData),
        })
      );
    });
  });

  describe('Cache Utils', () => {
    it('should invalidate cache for specific data type', () => {
      cacheUtils.invalidateCache('beneficiaries');

      // The mock cache should have been cleared
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should invalidate multiple caches', () => {
      cacheUtils.invalidateCaches(['beneficiaries', 'donations']);

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should get cache stats', () => {
      const stats = cacheUtils.getCacheStats('beneficiaries');

      expect(stats).toEqual({ hits: 10, misses: 2, size: 5 });
    });

    it('should get cache size', () => {
      const size = cacheUtils.getCacheSize('beneficiaries');

      expect(size).toBe(5);
    });

    it('should clear all caches', () => {
      cacheUtils.clearAllCaches();

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Not found',
          }),
      });

      const result = await apiClient.beneficiaries.getBeneficiary('nonexistent');

      expect(result.data).toBeNull();
      expect(result.error).toBe('Not found');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await apiClient.beneficiaries.getBeneficiaries();

      expect(result.data).toBeNull();
      expect(result.error).toBe('Network error');
    });
  });
});
