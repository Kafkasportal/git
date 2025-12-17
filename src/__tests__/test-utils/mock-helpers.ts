import { vi } from 'vitest'

/**
 * Creates a mock factory that can be safely used in vi.mock() without hoisting issues
 */
export const createMockFactory = (factory: any) => {
  return () => {
    return {
      default: factory,
    }
  }
}

/**
 * Sets up common API mocks for CRUD operations
 */
export const setupApiMock = (crudFactory: any, entityName: string, mockData: any) => {
  const operations = ['create', 'read', 'update', 'delete', 'list']
  
  operations.forEach((op) => {
    crudFactory[entityName][op] = vi.fn().mockResolvedValue({
      success: true,
      data: mockData,
    })
  })
}
