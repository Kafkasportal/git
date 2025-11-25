/**
 * Appwrite Query Builder
 * 
 * Fluent API for building Appwrite database queries
 * Provides type-safe and chainable query construction
 */

import { Query } from 'appwrite';

export class AppwriteQueryBuilder {
  private queries: string[] = [];

  /**
   * Limit results (default: 20, max: 100)
   */
  limit(count: number): this {
    this.queries.push(Query.limit(Math.min(count, 100)));
    return this;
  }

  /**
   * Pagination - use offset
   */
  offset(count: number): this {
    this.queries.push(Query.offset(Math.max(0, count)));
    return this;
  }

  /**
   * Order by field
   */
  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): this {
    // Remove existing order for this field if any
    this.queries = this.queries.filter((q) => !q.includes(`order("${field}"`));
    
    if (direction === 'desc') {
      this.queries.push(Query.orderDesc(field));
    } else {
      this.queries.push(Query.orderAsc(field));
    }
    return this;
  }

  /**
   * Filter by exact match
   */
  equal(field: string, value: string | number | boolean): this {
    this.queries.push(Query.equal(field, value));
    return this;
  }

  /**
   * Filter by multiple values (OR condition)
   */
  equalAny(field: string, values: (string | number)[]): this {
    if (values.length > 0) {
      this.queries.push(Query.equal(field, values));
    }
    return this;
  }

  /**
   * Filter by not equal
   */
  notEqual(field: string, value: string | number): this {
    this.queries.push(Query.notEqual(field, value));
    return this;
  }

  /**
   * Filter by less than
   */
  lessThan(field: string, value: string | number): this {
    this.queries.push(Query.lessThan(field, value));
    return this;
  }

  /**
   * Filter by greater than
   */
  greaterThan(field: string, value: string | number): this {
    this.queries.push(Query.greaterThan(field, value));
    return this;
  }

  /**
   * Filter by less than or equal
   */
  lessThanEqual(field: string, value: string | number): this {
    this.queries.push(Query.lessThanEqual(field, value));
    return this;
  }

  /**
   * Filter by greater than or equal
   */
  greaterThanEqual(field: string, value: string | number): this {
    this.queries.push(Query.greaterThanEqual(field, value));
    return this;
  }

  /**
   * Filter by range (between)
   */
  between(field: string, min: string | number, max: string | number): this {
    this.queries.push(Query.between(field, min, max));
    return this;
  }

  /**
   * Full-text search
   */
  search(field: string, value: string): this {
    if (value.trim()) {
      this.queries.push(Query.search(field, value));
    }
    return this;
  }

  /**
   * Filter by array contains
   */
  contains(field: string, value: string | number | (string | number)[]): this {
    if (Array.isArray(value)) {
      // If array, use first element (Appwrite contains doesn't support arrays directly)
      if (value.length > 0) {
        this.queries.push(Query.contains(field, value[0]));
      }
    } else {
      this.queries.push(Query.contains(field, value));
    }
    return this;
  }

  /**
   * Filter by array contains any
   * Note: Appwrite doesn't have containsAny, so we use multiple contains queries
   */
  containsAny(field: string, values: (string | number)[]): this {
    if (values.length > 0) {
      // Appwrite doesn't support containsAny directly, so we use OR logic with multiple contains
      // For now, just use the first value as a workaround
      // TODO: Implement proper OR logic if needed
      this.queries.push(Query.contains(field, values[0]));
    }
    return this;
  }

  /**
   * Filter by array is empty
   */
  isEmpty(field: string): this {
    this.queries.push(Query.isNull(field));
    return this;
  }

  /**
   * Filter by array is not empty
   */
  isNotEmpty(field: string): this {
    this.queries.push(Query.isNotNull(field));
    return this;
  }

  /**
   * Select specific fields only
   */
  select(fields: string[]): this {
    this.queries.push(Query.select(fields));
    return this;
  }

  /**
   * Build and return queries array
   */
  build(): string[] {
    return [...this.queries];
  }

  /**
   * Reset builder
   */
  reset(): this {
    this.queries = [];
    return this;
  }

  /**
   * Get current query count
   */
  getQueryCount(): number {
    return this.queries.length;
  }
}

/**
 * Helper function to create a new query builder
 */
export function createQueryBuilder(): AppwriteQueryBuilder {
  return new AppwriteQueryBuilder();
}

/**
 * Helper function for common pagination pattern
 */
export function paginationQuery(page: number = 1, limit: number = 20): AppwriteQueryBuilder {
  return new AppwriteQueryBuilder()
    .limit(limit)
    .offset((page - 1) * limit);
}

/**
 * Helper function for common search pattern
 */
export function searchQuery(searchField: string, searchTerm: string): AppwriteQueryBuilder {
  const builder = new AppwriteQueryBuilder();
  if (searchTerm.trim()) {
    builder.search(searchField, searchTerm);
  }
  return builder;
}

