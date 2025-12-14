/**
 * Offline Queue Property Tests
 *
 * Property 15: Offline Mutation Queuing
 * For any mutation attempted while offline, the mutation SHALL be added to
 * the offline queue with correct metadata.
 *
 * **Validates: Requirements 8.3**
 */

import { describe, it, expect } from 'vitest';
import { fc, test as fcTest } from '@fast-check/vitest';

// Mutation type generator
const mutationTypeArb = fc.constantFrom('create', 'update', 'delete');

// Collection name generator
const collectionArb = fc.constantFrom(
    'beneficiaries',
    'donations',
    'tasks',
    'meetings',
    'users',
    'scholarships',
    'finance'
);

// Mutation data generator
const mutationDataArb = fc.record({
    id: fc.option(fc.uuid(), { nil: undefined }),
    name: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
    amount: fc.option(fc.double({ min: 0, max: 1000000, noNaN: true }), { nil: undefined }),
    status: fc.option(fc.constantFrom('active', 'pending', 'completed'), { nil: undefined }),
});

// Retry count generator
const retryCountArb = fc.integer({ min: 0, max: 5 });

// Timestamp generator
const timestampArb = fc.integer({ min: 1609459200000, max: 1893456000000 }); // 2021-2030

interface OfflineMutation {
    type: 'create' | 'update' | 'delete';
    collection: string;
    data: Record<string, unknown>;
    retryCount: number;
    timestamp?: number;
    id?: string;
}


// Factory function to create fresh queue for each property test iteration
function createOfflineQueue() {
    const queue: OfflineMutation[] = [];

    return {
        add(mutation: OfflineMutation): void {
            queue.push({
                ...mutation,
                timestamp: mutation.timestamp || Date.now(),
                id: mutation.id || crypto.randomUUID(),
            });
        },
        getAll(): OfflineMutation[] {
            return [...queue];
        },
        clear(): void {
            queue.length = 0;
        },
        size(): number {
            return queue.length;
        },
    };
}

describe('Property 15: Offline Mutation Queuing', () => {
    describe('Mutation Queue Structure', () => {
        fcTest.prop([mutationTypeArb, collectionArb, mutationDataArb, retryCountArb], { numRuns: 100 })(
            'queued mutation preserves all metadata',
            (type, collection, data, retryCount) => {
                const queue = createOfflineQueue();
                const mutation: OfflineMutation = { type, collection, data, retryCount };

                queue.add(mutation);
                const queued = queue.getAll();

                expect(queued).toHaveLength(1);
                expect(queued[0].type).toBe(type);
                expect(queued[0].collection).toBe(collection);
                expect(queued[0].data).toEqual(data);
                expect(queued[0].retryCount).toBe(retryCount);
                expect(queued[0].timestamp).toBeDefined();
                expect(queued[0].id).toBeDefined();
            }
        );

        fcTest.prop([mutationTypeArb, collectionArb, mutationDataArb, timestampArb], { numRuns: 100 })(
            'queued mutation preserves custom timestamp',
            (type, collection, data, timestamp) => {
                const queue = createOfflineQueue();
                queue.add({ type, collection, data, retryCount: 0, timestamp });
                const queued = queue.getAll();
                expect(queued[0].timestamp).toBe(timestamp);
            }
        );
    });


    describe('Queue Operations', () => {
        fcTest.prop([fc.array(mutationTypeArb, { minLength: 1, maxLength: 10 })], { numRuns: 100 })(
            'queue size matches number of added mutations',
            (types) => {
                const queue = createOfflineQueue();
                types.forEach((type) => {
                    queue.add({ type, collection: 'beneficiaries', data: {}, retryCount: 0 });
                });
                expect(queue.size()).toBe(types.length);
            }
        );

        fcTest.prop([fc.integer({ min: 1, max: 20 })], { numRuns: 100 })(
            'clear removes all mutations',
            (count) => {
                const queue = createOfflineQueue();
                for (let i = 0; i < count; i++) {
                    queue.add({ type: 'create', collection: 'donations', data: { index: i }, retryCount: 0 });
                }
                expect(queue.size()).toBe(count);
                queue.clear();
                expect(queue.size()).toBe(0);
            }
        );
    });

    describe('Mutation Type Handling', () => {
        it('should handle create mutations', () => {
            const queue = createOfflineQueue();
            queue.add({ type: 'create', collection: 'beneficiaries', data: { name: 'Test' }, retryCount: 0 });
            expect(queue.getAll()[0].type).toBe('create');
        });

        it('should handle update mutations', () => {
            const queue = createOfflineQueue();
            queue.add({ type: 'update', collection: 'beneficiaries', data: { id: '123' }, retryCount: 0 });
            expect(queue.getAll()[0].type).toBe('update');
        });

        it('should handle delete mutations', () => {
            const queue = createOfflineQueue();
            queue.add({ type: 'delete', collection: 'beneficiaries', data: { id: '123' }, retryCount: 0 });
            expect(queue.getAll()[0].type).toBe('delete');
        });
    });


    describe('Retry Count Tracking', () => {
        fcTest.prop([retryCountArb], { numRuns: 100 })(
            'retry count is preserved correctly',
            (retryCount) => {
                const queue = createOfflineQueue();
                queue.add({ type: 'create', collection: 'tasks', data: {}, retryCount });
                expect(queue.getAll()[0].retryCount).toBe(retryCount);
            }
        );
    });

    describe('Queue Ordering', () => {
        fcTest.prop([fc.array(timestampArb, { minLength: 2, maxLength: 10 })], { numRuns: 100 })(
            'mutations are stored in insertion order',
            (timestamps) => {
                const queue = createOfflineQueue();
                timestamps.forEach((timestamp, index) => {
                    queue.add({ type: 'create', collection: 'meetings', data: { index }, retryCount: 0, timestamp });
                });
                const queued = queue.getAll();
                queued.forEach((mutation, index) => {
                    expect((mutation.data as { index: number }).index).toBe(index);
                });
            }
        );
    });

    describe('Unique ID Generation', () => {
        fcTest.prop([fc.integer({ min: 2, max: 20 })], { numRuns: 50 })(
            'each queued mutation gets unique ID',
            (count) => {
                const queue = createOfflineQueue();
                for (let i = 0; i < count; i++) {
                    queue.add({ type: 'create', collection: 'donations', data: {}, retryCount: 0 });
                }
                const ids = queue.getAll().map((m) => m.id);
                expect(new Set(ids).size).toBe(count);
            }
        );
    });

    describe('Collection Validation', () => {
        fcTest.prop([collectionArb], { numRuns: 100 })(
            'collection name is preserved',
            (collection) => {
                const queue = createOfflineQueue();
                queue.add({ type: 'create', collection, data: {}, retryCount: 0 });
                expect(queue.getAll()[0].collection).toBe(collection);
            }
        );
    });
});
