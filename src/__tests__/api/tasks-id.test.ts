import { vi } from 'vitest';
import { GET, PUT, DELETE } from '@/app/api/tasks/[id]/route';
import * as appwriteApi from '@/lib/appwrite/api';
import {
  runGetByIdTests,
  runUpdateTests,
  runDeleteTests,
} from '../test-utils/test-patterns';

// Mock Appwrite API
vi.mock('@/lib/appwrite/api', () => ({
  appwriteTasks: {
    get: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

// Mock route helpers
vi.mock('@/lib/api/route-helpers', () => ({
  extractParams: vi.fn(async (params: Promise<Record<string, string>>) => {
    const resolved = await params;
    return resolved;
  }),
}));

// Mock auth
vi.mock('@/lib/api/auth-utils', () => ({
  requireModuleAccess: vi.fn().mockResolvedValue(undefined),
  verifyCsrfToken: vi.fn().mockResolvedValue(undefined),
  buildErrorResponse: vi.fn().mockReturnValue(null),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
  },
}));

// Use test pattern for GET by ID
runGetByIdTests(
  { GET },
  appwriteApi.appwriteTasks.get as (id: string) => Promise<unknown>,
  'tasks',
  {
    baseUrl: 'http://localhost/api/tasks',
    notFoundError: 'Görev bulunamadı',
    errorMessage: 'Veri alınamadı',
  }
);

// Use test pattern for PUT update
runUpdateTests(
  { PUT },
  appwriteApi.appwriteTasks.update as (id: string, data: unknown) => Promise<unknown>,
  'tasks',
  {
    title: 'Updated Task',
    status: 'completed',
  },
  {
    method: 'PUT',
    baseUrl: 'http://localhost/api/tasks',
    successMessage: 'Görev başarıyla güncellendi',
    errorMessage: 'Güncelleme işlemi başarısız',
  }
);

// Use test pattern for DELETE
runDeleteTests(
  { DELETE },
  appwriteApi.appwriteTasks.remove as (id: string) => Promise<void>,
  'tasks',
  {
    baseUrl: 'http://localhost/api/tasks',
    successMessage: 'Görev başarıyla silindi',
    errorMessage: 'Silme işlemi başarısız',
  }
);
