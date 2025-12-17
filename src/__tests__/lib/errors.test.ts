/**
 * Error Tracker Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateErrorFingerprint,
  collectDeviceInfo,
  collectPerformanceMetrics,
  getPageContext,
} from '@/lib/error-tracker';

// Mock logger
vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock csrf-client
vi.mock('@/lib/csrf-client', () => ({
  fetchWithCsrf: vi.fn(),
}));

describe('generateErrorFingerprint', () => {
  it('should generate fingerprint from Error object', () => {
    const error = new Error('Test error message');
    const fingerprint = generateErrorFingerprint(error, 'TestComponent', 'testFunction');

    expect(typeof fingerprint).toBe('string');
    expect(fingerprint.length).toBeGreaterThan(0);
  });

  it('should generate fingerprint from string error', () => {
    const fingerprint = generateErrorFingerprint('String error', 'Component', 'function');

    expect(typeof fingerprint).toBe('string');
    expect(fingerprint.length).toBeGreaterThan(0);
  });

  it('should generate different fingerprints for different errors', () => {
    const fp1 = generateErrorFingerprint(new Error('Error 1'), 'Component', 'fn');
    const fp2 = generateErrorFingerprint(new Error('Error 2'), 'Component', 'fn');

    expect(fp1).not.toBe(fp2);
  });

  it('should generate same fingerprint for same error', () => {
    const error = new Error('Same error');
    const fp1 = generateErrorFingerprint(error, 'Component', 'fn');
    const fp2 = generateErrorFingerprint(error, 'Component', 'fn');

    expect(fp1).toBe(fp2);
  });

  it('should handle undefined component and function name', () => {
    const fingerprint = generateErrorFingerprint(new Error('Test'));

    expect(typeof fingerprint).toBe('string');
    expect(fingerprint.length).toBeGreaterThan(0);
  });
});

describe('collectDeviceInfo', () => {
  beforeEach(() => {
    // Reset window mock
    vi.stubGlobal('window', {
      location: { href: 'http://test.com' },
    });
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      language: 'tr-TR',
      languages: ['tr-TR', 'en-US'],
      platform: 'Win32',
      hardwareConcurrency: 8,
    });
    vi.stubGlobal('screen', {
      width: 1920,
      height: 1080,
      colorDepth: 24,
    });
  });

  it('should collect device information in browser', () => {
    const info = collectDeviceInfo();

    expect(info.browser).toBe('Chrome');
    expect(info.os).toBe('Windows');
    expect(info.deviceType).toBe('desktop');
    expect(info.language).toBe('tr-TR');
    expect(info.screenWidth).toBe(1920);
    expect(info.screenHeight).toBe(1080);
  });

  it('should detect mobile devices', () => {
    vi.stubGlobal('navigator', {
      ...navigator,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) Mobile Safari',
    });

    const info = collectDeviceInfo();
    expect(info.deviceType).toBe('mobile');
  });

  it('should detect Safari browser', () => {
    vi.stubGlobal('navigator', {
      ...navigator,
      userAgent: 'Mozilla/5.0 Safari/605.1.15',
    });

    const info = collectDeviceInfo();
    expect(info.browser).toBe('Safari');
  });

  it('should detect Firefox browser', () => {
    vi.stubGlobal('navigator', {
      ...navigator,
      userAgent: 'Mozilla/5.0 Firefox/121.0',
    });

    const info = collectDeviceInfo();
    expect(info.browser).toBe('Firefox');
  });

});

describe('collectPerformanceMetrics', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {});
    vi.stubGlobal('performance', {
      getEntriesByType: vi.fn().mockReturnValue([{
        loadEventEnd: 1000,
        fetchStart: 100,
        domContentLoadedEventEnd: 800,
        domInteractive: 600,
      }]),
      memory: {
        usedJSHeapSize: 50000000,
        jsHeapSizeLimit: 100000000,
      },
    });
  });

  it('should collect performance metrics in browser', () => {
    const metrics = collectPerformanceMetrics();

    expect(metrics.loadTime).toBe(900);
    expect(metrics.domContentLoaded).toBe(700);
    expect(metrics.timeToInteractive).toBe(500);
    expect(metrics.memoryUsed).toBe(50000000);
    expect(metrics.memoryLimit).toBe(100000000);
  });

});

describe('getPageContext', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      location: {
        href: 'http://test.com/page?query=1#hash',
        pathname: '/page',
        search: '?query=1',
        hash: '#hash',
      },
    });
    vi.stubGlobal('document', {
      referrer: 'http://google.com',
      title: 'Test Page',
    });
  });

  it('should collect page context in browser', () => {
    const context = getPageContext();

    expect(context.url).toBe('http://test.com/page?query=1#hash');
    expect(context.pathname).toBe('/page');
    expect(context.search).toBe('?query=1');
    expect(context.hash).toBe('#hash');
    expect(context.referrer).toBe('http://google.com');
    expect(context.title).toBe('Test Page');
  });

});
