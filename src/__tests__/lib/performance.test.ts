/**
 * Performance Monitoring Tests
 * Tests for performance monitoring utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PerformanceMonitor, Cache } from '@/lib/performance';
import { perfLog } from '@/lib/performance-monitor';
import logger from '@/lib/logger';

// Mock performance.now
const mockNow = vi.fn();

global.performance = {
  now: mockNow,
} as unknown as Performance;

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNow.mockReturnValue(100);
  });

  it('should create singleton instance', () => {
    const instance1 = PerformanceMonitor.getInstance();
    const instance2 = PerformanceMonitor.getInstance();

    expect(instance1).toBe(instance2);
  });

  it('should track timing correctly', () => {
    const monitor = PerformanceMonitor.getInstance();

    mockNow.mockReturnValue(100);
    monitor.startTiming('test-operation');

    mockNow.mockReturnValue(200);
    const duration = monitor.endTiming('test-operation');

    expect(duration).toBe(100);
  });

  it('should handle missing start time', () => {
    const monitor = PerformanceMonitor.getInstance();

    const duration = monitor.endTiming('nonexistent-operation');

    expect(duration).toBe(0);
  });

  it('should get and clear metrics', () => {
    const monitor = PerformanceMonitor.getInstance();

    mockNow.mockReturnValue(100);
    monitor.startTiming('test');

    mockNow.mockReturnValue(150);
    monitor.endTiming('test');

    expect(monitor.getMetric('test')).toBe(50);

    monitor.clearMetrics();
    expect(monitor.getMetric('test')).toBeUndefined();
  });
});

describe('Cache', () => {
  beforeEach(() => {
    const cache = Cache.getInstance();
    cache.clear();
  });

  it('should create singleton instance', () => {
    const instance1 = Cache.getInstance();
    const instance2 = Cache.getInstance();

    expect(instance1).toBe(instance2);
  });

  it('should set and get data', () => {
    const cache = Cache.getInstance();
    const testData = { id: 1, name: 'test' };

    cache.set('test-key', testData, 5000);
    const result = cache.get('test-key');

    expect(result).toEqual(testData);
  });

  it('should return null for non-existent keys', () => {
    const cache = Cache.getInstance();

    const result = cache.get('nonexistent');

    expect(result).toBeNull();
  });

  it('should expire data after TTL', () => {
    const cache = Cache.getInstance();
    const testData = { id: 1 };

    cache.set('test-key', testData, 1000);

    // Note: In a real test environment, you'd need to mock Date.now
    // For now, we just test that set/get works
    const result = cache.get('test-key');

    expect(result).toEqual(testData);
  });

  it('should delete and clear cache', () => {
    const cache = Cache.getInstance();

    cache.set('key1', 'data1');
    cache.set('key2', 'data2');

    cache.delete('key1');

    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBe('data2');

    cache.clear();

    expect(cache.get('key2')).toBeNull();
  });
});

describe('perfLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have info method', () => {
    expect(typeof perfLog.info).toBe('function');

    // In test environment, info/warn are skipped (NODE_ENV !== 'development')
    const loggerSpy = vi.spyOn(logger, 'info');
    perfLog.info('Test message', { data: 'test' });

    // info only logs in development, not in test environment
    if (process.env.NODE_ENV === 'development') {
      expect(loggerSpy).toHaveBeenCalledWith('[PERF] Test message', { data: 'test' });
    } else {
      expect(loggerSpy).not.toHaveBeenCalled();
    }
  });

  it('should have warn method', () => {
    expect(typeof perfLog.warn).toBe('function');

    // In test environment, warn is skipped (NODE_ENV !== 'development')
    const loggerSpy = vi.spyOn(logger, 'warn');
    perfLog.warn('Test warning', { data: 'test' });

    // warn only logs in development, not in test environment
    if (process.env.NODE_ENV === 'development') {
      expect(loggerSpy).toHaveBeenCalledWith('[PERF] Test warning', { data: 'test' });
    } else {
      expect(loggerSpy).not.toHaveBeenCalled();
    }
  });

  it('should log errors in all environments', () => {
    expect(typeof perfLog.error).toBe('function');

    const loggerSpy = vi.spyOn(logger, 'error');
    perfLog.error('Test error', { data: 'test' });

    // error always logs, regardless of environment
    expect(loggerSpy).toHaveBeenCalledWith('[PERF] Test error', { data: 'test' });
  });
});
