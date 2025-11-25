/**
 * Error Tracker Utility Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { generateErrorFingerprint, collectDeviceInfo, getPageContext } from '@/lib/error-tracker';

describe('Error Tracker', () => {
  describe('generateErrorFingerprint', () => {
    it('should generate consistent fingerprints for same error', () => {
      const error = new Error('Test error');
      const component = 'TestComponent';
      const functionName = 'testFunction';

      const fingerprint1 = generateErrorFingerprint(error, component, functionName);
      const fingerprint2 = generateErrorFingerprint(error, component, functionName);

      expect(fingerprint1).toBe(fingerprint2);
      expect(fingerprint1).toBeTruthy();
      expect(typeof fingerprint1).toBe('string');
    });

    it('should generate different fingerprints for different errors', () => {
      const error1 = new Error('Error 1');
      const error2 = new Error('Error 2');

      const fingerprint1 = generateErrorFingerprint(error1, 'Component', 'function');
      const fingerprint2 = generateErrorFingerprint(error2, 'Component', 'function');

      expect(fingerprint1).not.toBe(fingerprint2);
    });

    it('should generate different fingerprints for different components', () => {
      const error = new Error('Test error');

      const fingerprint1 = generateErrorFingerprint(error, 'Component1', 'function');
      const fingerprint2 = generateErrorFingerprint(error, 'Component2', 'function');

      expect(fingerprint1).not.toBe(fingerprint2);
    });

    it('should handle non-Error objects', () => {
      const errorString = 'Simple error string';

      const fingerprint = generateErrorFingerprint(errorString, 'Component', 'function');

      expect(fingerprint).toBeTruthy();
      expect(typeof fingerprint).toBe('string');
    });
  });

  describe('collectDeviceInfo', () => {
    beforeEach(() => {
      // Mock navigator
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          language: 'en-US',
          languages: ['en-US', 'en'],
          platform: 'Win32',
          hardwareConcurrency: 8,
        },
        writable: true,
      });

      // Mock screen
      Object.defineProperty(global, 'screen', {
        value: {
          width: 1920,
          height: 1080,
          colorDepth: 24,
        },
        writable: true,
      });
    });

    it('should collect device information', () => {
      const deviceInfo = collectDeviceInfo();

      expect(deviceInfo).toHaveProperty('browser');
      expect(deviceInfo).toHaveProperty('os');
      expect(deviceInfo).toHaveProperty('platform');
      expect(deviceInfo).toHaveProperty('deviceType');
      expect(deviceInfo).toHaveProperty('language');
      expect(deviceInfo).toHaveProperty('screenWidth');
      expect(deviceInfo).toHaveProperty('screenHeight');
    });

    it('should detect Chrome browser', () => {
      const deviceInfo = collectDeviceInfo();

      expect(deviceInfo.browser).toBe('Chrome');
    });

    it('should detect Windows OS', () => {
      const deviceInfo = collectDeviceInfo();

      expect(deviceInfo.os).toBe('Windows');
    });

    it('should detect desktop device type', () => {
      const deviceInfo = collectDeviceInfo();

      expect(deviceInfo.deviceType).toBe('desktop');
    });
  });

  describe('getPageContext', () => {
    beforeEach(() => {
      // Mock window and location
      Object.defineProperty(global, 'window', {
        value: {
          location: {
            href: 'http://localhost:3000/test?param=value#hash',
            pathname: '/test',
            search: '?param=value',
            hash: '#hash',
          },
        },
        writable: true,
      });

      // Mock document
      Object.defineProperty(global, 'document', {
        value: {
          referrer: 'http://localhost:3000/previous',
          title: 'Test Page',
        },
        writable: true,
      });
    });

    it('should collect page context', () => {
      const pageContext = getPageContext();

      expect(pageContext).toHaveProperty('url');
      expect(pageContext).toHaveProperty('pathname');
      expect(pageContext).toHaveProperty('search');
      expect(pageContext).toHaveProperty('hash');
      expect(pageContext).toHaveProperty('referrer');
      expect(pageContext).toHaveProperty('title');
    });

    it('should return correct URL', () => {
      const pageContext = getPageContext();

      expect(pageContext.url).toBe('http://localhost:3000/test?param=value#hash');
    });

    it('should return correct pathname', () => {
      const pageContext = getPageContext();

      expect(pageContext.pathname).toBe('/test');
    });
  });
});
