/**
 * useFilters Hook Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock Next.js navigation
const mockReplace = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        replace: mockReplace,
        push: vi.fn(),
    }),
    usePathname: () => '/test-path',
    useSearchParams: () => mockSearchParams,
}));

import { useFilters } from '@/hooks/useFilters';

describe('useFilters', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSearchParams = new URLSearchParams();
        // Mock localStorage
        const localStorageMock = {
            getItem: vi.fn(),
            setItem: vi.fn(),
            removeItem: vi.fn(),
            clear: vi.fn(),
        };
        Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('initialization', () => {
        it('should initialize with empty filters by default', () => {
            const { result } = renderHook(() => useFilters());

            expect(result.current.filters).toEqual({});
            expect(result.current.activeFilterCount).toBe(0);
        });

        it('should initialize with provided initial filters', () => {
            const initialFilters = { status: 'active', type: 'donation' };
            const { result } = renderHook(() => useFilters({ initialFilters }));

            expect(result.current.filters).toEqual(initialFilters);
            expect(result.current.activeFilterCount).toBe(2);
        });

        it('should load presets from localStorage', () => {
            const mockPresets = [{ id: 'preset-1', name: 'Test', filters: { status: 'active' } }];
            (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockPresets));

            const { result } = renderHook(() => useFilters({ presetsKey: 'test' }));

            expect(result.current.presets).toEqual(mockPresets);
        });

        it('should handle invalid JSON in localStorage', () => {
            (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('invalid-json');

            const { result } = renderHook(() => useFilters({ presetsKey: 'test' }));

            expect(result.current.presets).toEqual([]);
        });
    });

    describe('setFilter', () => {
        it('should set a single filter', () => {
            const { result } = renderHook(() => useFilters());

            act(() => {
                result.current.setFilter('status', 'active');
            });

            expect(result.current.filters.status).toBe('active');
            expect(result.current.activeFilterCount).toBe(1);
        });

        it('should remove filter when value is empty', () => {
            const { result } = renderHook(() => useFilters({ initialFilters: { status: 'active' } }));

            act(() => {
                result.current.setFilter('status', '');
            });

            expect(result.current.filters.status).toBeUndefined();
            expect(result.current.activeFilterCount).toBe(0);
        });

        it('should remove filter when value is undefined', () => {
            const { result } = renderHook(() => useFilters({ initialFilters: { status: 'active' } }));

            act(() => {
                result.current.setFilter('status', undefined);
            });

            expect(result.current.filters.status).toBeUndefined();
        });

        it('should remove filter when array is empty', () => {
            const { result } = renderHook(() => useFilters({ initialFilters: { tags: ['a', 'b'] } }));

            act(() => {
                result.current.setFilter('tags', []);
            });

            expect(result.current.filters.tags).toBeUndefined();
        });

        it('should call onFiltersChange callback', () => {
            const onFiltersChange = vi.fn();
            const { result } = renderHook(() => useFilters({ onFiltersChange }));

            act(() => {
                result.current.setFilter('status', 'active');
            });

            expect(onFiltersChange).toHaveBeenCalledWith({ status: 'active' });
        });
    });

    describe('setMultipleFilters', () => {
        it('should set multiple filters at once', () => {
            const { result } = renderHook(() => useFilters());

            act(() => {
                result.current.setMultipleFilters({ status: 'active', type: 'donation' });
            });

            expect(result.current.filters).toEqual({ status: 'active', type: 'donation' });
        });

        it('should merge with existing filters', () => {
            const { result } = renderHook(() => useFilters({ initialFilters: { status: 'active' } }));

            act(() => {
                result.current.setMultipleFilters({ type: 'donation' });
            });

            expect(result.current.filters).toEqual({ status: 'active', type: 'donation' });
        });

        it('should remove empty values', () => {
            const { result } = renderHook(() => useFilters({ initialFilters: { status: 'active' } }));

            act(() => {
                result.current.setMultipleFilters({ status: '', type: 'donation' });
            });

            expect(result.current.filters).toEqual({ type: 'donation' });
        });
    });

    describe('removeFilter', () => {
        it('should remove a filter', () => {
            const { result } = renderHook(() => useFilters({ initialFilters: { status: 'active', type: 'donation' } }));

            act(() => {
                result.current.removeFilter('status');
            });

            expect(result.current.filters.status).toBeUndefined();
            expect(result.current.filters.type).toBe('donation');
        });

        it('should remove specific value from array filter', () => {
            const { result } = renderHook(() => useFilters({ initialFilters: { tags: ['a', 'b', 'c'] } }));

            act(() => {
                result.current.removeFilter('tags', 'b');
            });

            expect(result.current.filters.tags).toEqual(['a', 'c']);
        });

        it('should remove array filter when last value is removed', () => {
            const { result } = renderHook(() => useFilters({ initialFilters: { tags: ['a'] } }));

            act(() => {
                result.current.removeFilter('tags', 'a');
            });

            expect(result.current.filters.tags).toBeUndefined();
        });
    });

    describe('resetFilters', () => {
        it('should reset to initial filters', () => {
            const initialFilters = { status: 'pending' };
            const { result } = renderHook(() => useFilters({ initialFilters }));

            act(() => {
                result.current.setFilter('type', 'donation');
            });

            expect(result.current.filters.type).toBe('donation');

            act(() => {
                result.current.resetFilters();
            });

            expect(result.current.filters).toEqual(initialFilters);
        });
    });

    describe('toggleArrayFilter', () => {
        it('should add value to array filter', () => {
            const { result } = renderHook(() => useFilters());

            act(() => {
                result.current.toggleArrayFilter('tags', 'new-tag');
            });

            expect(result.current.filters.tags).toEqual(['new-tag']);
        });

        it('should remove value from array filter', () => {
            const { result } = renderHook(() => useFilters({ initialFilters: { tags: ['a', 'b'] } }));

            act(() => {
                result.current.toggleArrayFilter('tags', 'a');
            });

            expect(result.current.filters.tags).toEqual(['b']);
        });

        it('should remove filter when array becomes empty', () => {
            const { result } = renderHook(() => useFilters({ initialFilters: { tags: ['a'] } }));

            act(() => {
                result.current.toggleArrayFilter('tags', 'a');
            });

            expect(result.current.filters.tags).toBeUndefined();
        });

        it('should handle non-array initial value', () => {
            const { result } = renderHook(() => useFilters({ initialFilters: { tags: 'single' as any } }));

            act(() => {
                result.current.toggleArrayFilter('tags', 'new');
            });

            expect(result.current.filters.tags).toEqual(['new']);
        });
    });

    describe('presets', () => {
        it('should save preset', () => {
            const { result } = renderHook(() => useFilters({ presetsKey: 'test', initialFilters: { status: 'active' } }));

            act(() => {
                result.current.savePreset('My Preset');
            });

            expect(result.current.presets).toHaveLength(1);
            expect(result.current.presets[0].name).toBe('My Preset');
            expect(localStorage.setItem).toHaveBeenCalled();
        });

        it('should not save preset without presetsKey', () => {
            const { result } = renderHook(() => useFilters());

            act(() => {
                result.current.savePreset('My Preset');
            });

            expect(result.current.presets).toHaveLength(0);
        });

        it('should apply preset', () => {
            const preset = { id: 'preset-1', name: 'Test', filters: { status: 'completed' } };
            const { result } = renderHook(() => useFilters());

            act(() => {
                result.current.applyPreset(preset);
            });

            expect(result.current.filters).toEqual({ status: 'completed' });
        });

        it('should delete preset', () => {
            const mockPresets = [
                { id: 'preset-1', name: 'Test 1', filters: {} },
                { id: 'preset-2', name: 'Test 2', filters: {} },
            ];
            (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockPresets));

            const { result } = renderHook(() => useFilters({ presetsKey: 'test' }));

            act(() => {
                result.current.deletePreset('preset-1');
            });

            expect(result.current.presets).toHaveLength(1);
            expect(result.current.presets[0].id).toBe('preset-2');
        });

        it('should not delete preset without presetsKey', () => {
            const { result } = renderHook(() => useFilters());

            act(() => {
                result.current.deletePreset('preset-1');
            });

            // Should not throw
            expect(result.current.presets).toHaveLength(0);
        });
    });

    describe('helpers', () => {
        it('hasFilter should return true for existing filter', () => {
            const { result } = renderHook(() => useFilters({ initialFilters: { status: 'active' } }));

            expect(result.current.hasFilter('status')).toBe(true);
            expect(result.current.hasFilter('nonexistent')).toBe(false);
        });

        it('hasFilter should return false for empty values', () => {
            const { result } = renderHook(() => useFilters({ initialFilters: { empty: '', emptyArray: [] } }));

            expect(result.current.hasFilter('empty')).toBe(false);
            expect(result.current.hasFilter('emptyArray')).toBe(false);
        });

        it('getFilter should return filter value', () => {
            const { result } = renderHook(() => useFilters({ initialFilters: { status: 'active' } }));

            expect(result.current.getFilter('status')).toBe('active');
            expect(result.current.getFilter('nonexistent')).toBeUndefined();
        });

        it('handleFiltersChange should update filters', () => {
            const { result } = renderHook(() => useFilters());

            act(() => {
                result.current.handleFiltersChange({ status: 'new' });
            });

            expect(result.current.filters).toEqual({ status: 'new' });
        });
    });

    describe('activeFilterCount', () => {
        it('should count active filters correctly', () => {
            const { result } = renderHook(() => useFilters({
                initialFilters: {
                    status: 'active',
                    type: 'donation',
                    empty: '',
                    emptyArray: [],
                },
            }));

            expect(result.current.activeFilterCount).toBe(2);
        });

        it('should not count empty date ranges', () => {
            const { result } = renderHook(() => useFilters({
                initialFilters: {
                    dateRange: { from: undefined, to: undefined },
                },
            }));

            expect(result.current.activeFilterCount).toBe(0);
        });

        it('should count date ranges with values', () => {
            const { result } = renderHook(() => useFilters({
                initialFilters: {
                    dateRange: { from: new Date(), to: new Date() },
                },
            }));

            expect(result.current.activeFilterCount).toBe(1);
        });
    });

    describe('URL sync', () => {
        it('should initialize from URL params with comma-separated values', () => {
            mockSearchParams = new URLSearchParams('tags=a,b,c&status=active');

            const { result } = renderHook(() => useFilters({ syncWithUrl: true }));

            expect(result.current.filters.tags).toEqual(['a', 'b', 'c']);
            expect(result.current.filters.status).toBe('active');
        });

        it('should initialize from URL params with single values', () => {
            mockSearchParams = new URLSearchParams('status=pending&type=donation');

            const { result } = renderHook(() => useFilters({ syncWithUrl: true }));

            expect(result.current.filters.status).toBe('pending');
            expect(result.current.filters.type).toBe('donation');
        });

        it('should use initialFilters when URL params are empty', () => {
            mockSearchParams = new URLSearchParams();

            const { result } = renderHook(() => useFilters({
                syncWithUrl: true,
                initialFilters: { status: 'default' },
            }));

            expect(result.current.filters.status).toBe('default');
        });

        it('should sync filters to URL when syncWithUrl is true', async () => {
            mockSearchParams = new URLSearchParams();

            const { result } = renderHook(() => useFilters({ syncWithUrl: true }));

            act(() => {
                result.current.setFilter('status', 'active');
            });

            // Wait for useEffect to run
            await vi.waitFor(() => {
                expect(mockReplace).toHaveBeenCalledWith(
                    expect.stringContaining('status=active'),
                    { scroll: false }
                );
            });
        });

        it('should sync array filters to URL as comma-separated', async () => {
            mockSearchParams = new URLSearchParams();

            const { result } = renderHook(() => useFilters({ syncWithUrl: true }));

            act(() => {
                result.current.setFilter('tags', ['a', 'b', 'c']);
            });

            await vi.waitFor(() => {
                expect(mockReplace).toHaveBeenCalledWith(
                    expect.stringContaining('tags=a%2Cb%2Cc'),
                    { scroll: false }
                );
            });
        });

        it('should sync date range filters to URL', async () => {
            mockSearchParams = new URLSearchParams();
            const fromDate = new Date('2024-01-01');
            const toDate = new Date('2024-12-31');

            const { result } = renderHook(() => useFilters({ syncWithUrl: true }));

            act(() => {
                result.current.setFilter('dateRange', { from: fromDate, to: toDate });
            });

            await vi.waitFor(() => {
                expect(mockReplace).toHaveBeenCalledWith(
                    expect.stringContaining('dateRange_from'),
                    { scroll: false }
                );
            });
        });

        it('should sync date range with only from date', async () => {
            mockSearchParams = new URLSearchParams();
            const fromDate = new Date('2024-01-01');

            const { result } = renderHook(() => useFilters({ syncWithUrl: true }));

            act(() => {
                result.current.setFilter('dateRange', { from: fromDate });
            });

            await vi.waitFor(() => {
                expect(mockReplace).toHaveBeenCalledWith(
                    expect.stringContaining('dateRange_from'),
                    { scroll: false }
                );
            });
        });

        it('should sync date range with only to date', async () => {
            mockSearchParams = new URLSearchParams();
            const toDate = new Date('2024-12-31');

            const { result } = renderHook(() => useFilters({ syncWithUrl: true }));

            act(() => {
                result.current.setFilter('dateRange', { to: toDate });
            });

            await vi.waitFor(() => {
                expect(mockReplace).toHaveBeenCalledWith(
                    expect.stringContaining('dateRange_to'),
                    { scroll: false }
                );
            });
        });

        it('should not sync empty array to URL', async () => {
            mockSearchParams = new URLSearchParams();

            const { result } = renderHook(() => useFilters({
                syncWithUrl: true,
                initialFilters: { tags: ['a'] },
            }));

            act(() => {
                result.current.setFilter('tags', []);
            });

            await vi.waitFor(() => {
                expect(mockReplace).toHaveBeenCalledWith('/test-path', { scroll: false });
            });
        });

        it('should use pathname only when no filters', async () => {
            mockSearchParams = new URLSearchParams();

            renderHook(() => useFilters({ syncWithUrl: true }));

            await vi.waitFor(() => {
                expect(mockReplace).toHaveBeenCalledWith('/test-path', { scroll: false });
            });
        });

        it('should not sync to URL when syncWithUrl is false', () => {
            mockSearchParams = new URLSearchParams();

            const { result } = renderHook(() => useFilters({ syncWithUrl: false }));

            act(() => {
                result.current.setFilter('status', 'active');
            });

            // Should not call replace since syncWithUrl is false
            expect(mockReplace).not.toHaveBeenCalled();
        });
    });
});
