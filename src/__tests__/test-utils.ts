/**
 * Test Utilities
 * Helper functions for creating mock data in tests
 */

import { Models } from 'node-appwrite';
import type { PermissionValue } from '@/types/permissions';

/**
 * Creates a mock Appwrite document with all required base fields.
 * Use this to wrap mock data in tests to satisfy TypeScript's DefaultDocument type.
 */
export function createMockDocument<T extends object>(
  data: T,
  overrides?: Partial<Models.Document>
): Models.DefaultDocument {
  const baseDocument = {
    $id: data && '_id' in data ? String((data as Record<string, unknown>)._id) : `doc-${Date.now()}`,
    $sequence: 1,
    $collectionId: 'test-collection',
    $databaseId: 'test-database',
    $createdAt: new Date().toISOString(),
    $updatedAt: new Date().toISOString(),
    $permissions: [],
    ...overrides,
    ...data,
  };

  return baseDocument as any as Models.DefaultDocument;
}

/**
 * Creates an array of mock Appwrite documents.
 */
export function createMockDocuments<T extends object>(
  dataArray: T[]
): Models.DefaultDocument[] {
  return dataArray.map((data, index) =>
    createMockDocument(data, { $id: `doc-${index + 1}` })
  );
}

/**
 * Creates a mock AuthSession with all required fields.
 */
export interface MockAuthSession {
  sessionId: string;
  userId: string;
  expire?: string;
}

export function createMockSession(overrides?: Partial<MockAuthSession>): MockAuthSession {
  return {
    sessionId: 'test-session-id',
    userId: 'test-user-id',
    expire: new Date(Date.now() + 86400000).toISOString(),
    ...overrides,
  };
}

/**
 * Creates a mock SessionUser with all required fields.
 */
export interface MockSessionUser {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  permissions: PermissionValue[];
  role?: string;
  labels?: string[];
}

export function createMockSessionUser(overrides?: Partial<MockSessionUser>): MockSessionUser {
  return {
    id: 'test-user',
    email: 'test@example.com',
    name: 'Test User',
    isActive: true,
    permissions: [],
    ...overrides,
  };
}

/**
 * Creates a mock auth response (session + user) for requireAuthenticatedUser mocks.
 */
export function createMockAuthResponse(
  userOverrides?: Partial<MockSessionUser>,
  sessionOverrides?: Partial<MockAuthSession>
) {
  return {
    session: createMockSession(sessionOverrides),
    user: createMockSessionUser(userOverrides),
  };
}
