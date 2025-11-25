/**
 * Advanced Session Management
 * Provides session timeout, concurrent session control, and device tracking
 */

import logger from '@/lib/logger';

export interface SessionConfig {
  maxAge: number; // Session max age in milliseconds
  inactivityTimeout: number; // Inactivity timeout in milliseconds
  maxConcurrentSessions: number; // Maximum concurrent sessions per user
  enableDeviceTracking: boolean; // Track device fingerprints
}

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  language: string;
  screenResolution: string;
  timezone: string;
  fingerprint: string;
}

export interface SessionMetadata {
  deviceInfo: DeviceInfo;
  ipAddress: string;
  loginTime: number;
  lastActivityTime: number;
  expiryTime: number;
}

/**
 * Default session configuration
 */
export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  inactivityTimeout: 30 * 60 * 1000, // 30 minutes
  maxConcurrentSessions: 3,
  enableDeviceTracking: true,
};

/**
 * Generate device fingerprint from browser information
 */
export function generateDeviceFingerprint(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {
      userAgent: 'server',
      platform: 'server',
      language: 'unknown',
      screenResolution: 'unknown',
      timezone: 'UTC',
      fingerprint: 'server-side',
    };
  }

  const info: DeviceInfo = {
    userAgent: window.navigator.userAgent,
    platform: window.navigator.platform,
    language: window.navigator.language,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    fingerprint: '',
  };

  // Create a simple fingerprint by hashing the combined info
  const fingerprintData = `${info.userAgent}|${info.platform}|${info.screenResolution}|${info.timezone}`;
  info.fingerprint = simpleHash(fingerprintData);

  return info;
}

/**
 * Simple hash function for fingerprinting
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Check if session is expired based on max age
 */
export function isSessionExpired(expiryTime: number): boolean {
  return Date.now() > expiryTime;
}

/**
 * Check if session is inactive based on last activity
 */
export function isSessionInactive(lastActivityTime: number, inactivityTimeout: number): boolean {
  return Date.now() - lastActivityTime > inactivityTimeout;
}

/**
 * Calculate session expiry time
 */
export function calculateExpiryTime(maxAge: number): number {
  return Date.now() + maxAge;
}

/**
 * Session activity tracker (client-side)
 */
export class SessionActivityTracker {
  private lastActivityTime: number;
  private inactivityTimeout: number;
  private onInactivityCallback?: () => void;
  private checkInterval?: NodeJS.Timeout;

  constructor(inactivityTimeout: number, onInactivity?: () => void) {
    this.lastActivityTime = Date.now();
    this.inactivityTimeout = inactivityTimeout;
    this.onInactivityCallback = onInactivity;

    if (typeof window !== 'undefined') {
      this.setupActivityListeners();
      this.startInactivityCheck();
    }
  }

  private setupActivityListeners(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    events.forEach((event) => {
      window.addEventListener(event, this.updateActivity.bind(this), { passive: true });
    });
  }

  private updateActivity(): void {
    this.lastActivityTime = Date.now();
  }

  private startInactivityCheck(): void {
    // Check every minute
    this.checkInterval = setInterval(() => {
      if (isSessionInactive(this.lastActivityTime, this.inactivityTimeout)) {
        this.onInactivityCallback?.();
        this.stop();
      }
    }, 60 * 1000);
  }

  public stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  public getLastActivityTime(): number {
    return this.lastActivityTime;
  }
}

/**
 * Suspicious activity detector
 */
export interface SuspiciousActivityRule {
  name: string;
  check: (session: SessionMetadata, currentDevice: DeviceInfo) => boolean;
  severity: 'low' | 'medium' | 'high';
}

const suspiciousActivityRules: SuspiciousActivityRule[] = [
  {
    name: 'device_fingerprint_mismatch',
    check: (session, current) => session.deviceInfo.fingerprint !== current.fingerprint,
    severity: 'high',
  },
  {
    name: 'platform_change',
    check: (session, current) => session.deviceInfo.platform !== current.platform,
    severity: 'medium',
  },
  {
    name: 'timezone_change',
    check: (session, current) => session.deviceInfo.timezone !== current.timezone,
    severity: 'low',
  },
  {
    name: 'rapid_ip_change',
    check: (_session, _current) => {
      // This would require IP address comparison
      // Placeholder for now
      return false;
    },
    severity: 'high',
  },
];

/**
 * Detect suspicious activity
 */
export function detectSuspiciousActivity(
  session: SessionMetadata,
  currentDevice: DeviceInfo
): { detected: boolean; rules: string[]; maxSeverity: string } {
  const triggeredRules: string[] = [];
  let maxSeverity: 'low' | 'medium' | 'high' = 'low';

  for (const rule of suspiciousActivityRules) {
    if (rule.check(session, currentDevice)) {
      triggeredRules.push(rule.name);
      if (rule.severity === 'high' || (rule.severity === 'medium' && maxSeverity === 'low')) {
        maxSeverity = rule.severity;
      }
    }
  }

  return {
    detected: triggeredRules.length > 0,
    rules: triggeredRules,
    maxSeverity,
  };
}

/**
 * Session storage helper (localStorage with encryption awareness)
 */
export class SecureSessionStorage {
  private static readonly SESSION_KEY = 'app_session_metadata';

  static save(metadata: SessionMetadata): void {
    if (typeof window === 'undefined') return;

    try {
      const serialized = JSON.stringify(metadata);
      localStorage.setItem(this.SESSION_KEY, serialized);
    } catch (error) {
      logger.error('Failed to save session metadata', { error });
    }
  }

  static load(): SessionMetadata | null {
    if (typeof window === 'undefined') return null;

    try {
      const serialized = localStorage.getItem(this.SESSION_KEY);
      if (!serialized) return null;

      return JSON.parse(serialized) as SessionMetadata;
    } catch (error) {
      logger.error('Failed to load session metadata', { error });
      return null;
    }
  }

  static clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.SESSION_KEY);
  }
}

/**
 * Configuration management
 */
export class SessionConfigManager {
  private static config: SessionConfig = DEFAULT_SESSION_CONFIG;

  static setConfig(config: Partial<SessionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  static getConfig(): SessionConfig {
    return { ...this.config };
  }

  static loadFromEnv(): void {
    if (typeof window === 'undefined') return;

    const envMaxAge = process.env.NEXT_PUBLIC_SESSION_MAX_AGE;
    const envInactivityTimeout = process.env.NEXT_PUBLIC_SESSION_INACTIVITY_TIMEOUT;
    const envMaxSessions = process.env.NEXT_PUBLIC_MAX_CONCURRENT_SESSIONS;

    if (envMaxAge) {
      this.config.maxAge = parseInt(envMaxAge, 10) * 60 * 1000; // Convert minutes to ms
    }
    if (envInactivityTimeout) {
      this.config.inactivityTimeout = parseInt(envInactivityTimeout, 10) * 60 * 1000;
    }
    if (envMaxSessions) {
      this.config.maxConcurrentSessions = parseInt(envMaxSessions, 10);
    }
  }
}
