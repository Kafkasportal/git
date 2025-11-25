import { RateLimiter } from './security';
import logger from '@/lib/logger';

// Rate limit monitoring arayüzü
export interface RateLimitViolation {
  id: string;
  timestamp: Date;
  identifier: string;
  ipAddress: string;
  endpoint: string;
  method: string;
  userAgent: string;
  attempts: number;
  maxAllowed: number;
  windowMs: number;
  isAuthenticated: boolean;
  userId?: string;
  violationType: 'limit_exceeded' | 'blacklisted_ip' | 'too_many_violations';
}

export interface RateLimitStats {
  totalRequests: number;
  blockedRequests: number;
  violationRate: number;
  topViolators: Array<{
    identifier: string;
    violations: number;
    lastViolation: Date;
  }>;
  endpointStats: Array<{
    endpoint: string;
    requests: number;
    violations: number;
    violationRate: number;
  }>;
  activeLimits: number;
  whitelistedIPs: number;
  blacklistedIPs: number;
}

// Rate limit monitoring servisi
export class RateLimitMonitor {
  private static violations: RateLimitViolation[] = [];
  private static maxViolations = 10000; // Son 10000 violation'ı sakla
  private static alertThresholds = {
    violationRate: 0.1, // %10 violation rate'de alert
    ipsPerHour: 100, // Saatte 100'den fazla IP'den violation
    endpointThreshold: 50, // Endpoint başına 50 violation'da alert
  };

  // Violation kaydet
  static recordViolation(violation: Omit<RateLimitViolation, 'id' | 'timestamp'>): void {
    const fullViolation: RateLimitViolation = {
      ...violation,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };

    this.violations.push(fullViolation);

    // Maksimum violation sayısını aşmayacak şekilde eski kayıtları sil
    if (this.violations.length > this.maxViolations) {
      this.violations = this.violations.slice(-this.maxViolations);
    }

    // Violation'ları logla
    logger.warn('Rate limit violation recorded', {
      endpoint: fullViolation.endpoint,
      ipAddress: fullViolation.ipAddress,
      attempts: fullViolation.attempts,
      maxAllowed: fullViolation.maxAllowed,
      violationType: fullViolation.violationType,
      identifier: fullViolation.identifier,
      isAuthenticated: fullViolation.isAuthenticated,
      userId: fullViolation.userId,
    });

    // Alert kontrolü
    this.checkAlerts(fullViolation);
  }

  // İstatistikleri getir
  static getStats(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): RateLimitStats {
    const now = new Date();
    let cutoffTime: Date;

    switch (timeRange) {
      case '1h':
        cutoffTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        cutoffTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const recentViolations = this.violations.filter((v) => v.timestamp >= cutoffTime);
    const totalRequests = this.getTotalRequests(cutoffTime);
    const blockedRequests = recentViolations.length;

    // Top violators
    const violatorMap = new Map<string, { count: number; lastViolation: Date }>();
    recentViolations.forEach((v) => {
      const existing = violatorMap.get(v.identifier);
      if (existing) {
        existing.count++;
        if (v.timestamp > existing.lastViolation) {
          existing.lastViolation = v.timestamp;
        }
      } else {
        violatorMap.set(v.identifier, { count: 1, lastViolation: v.timestamp });
      }
    });

    const topViolators = Array.from(violatorMap.entries())
      .map(([identifier, data]) => ({
        identifier,
        violations: data.count,
        lastViolation: data.lastViolation,
      }))
      .sort((a, b) => b.violations - a.violations)
      .slice(0, 10);

    // Endpoint statistics
    const endpointMap = new Map<string, { requests: number; violations: number }>();
    recentViolations.forEach((v) => {
      const existing = endpointMap.get(v.endpoint);
      if (existing) {
        existing.violations++;
      } else {
        endpointMap.set(v.endpoint, { requests: 0, violations: 1 });
      }
    });

    // Tüm endpoint request'lerini say (approximate)
    this.addRequestCounts(endpointMap);

    const endpointStats = Array.from(endpointMap.entries()).map(([endpoint, data]) => ({
      endpoint,
      requests: data.requests,
      violations: data.violations,
      violationRate: data.requests > 0 ? data.violations / data.requests : 0,
    }));

    return {
      totalRequests,
      blockedRequests,
      violationRate: totalRequests > 0 ? blockedRequests / totalRequests : 0,
      topViolators,
      endpointStats: endpointStats.sort((a, b) => b.violations - a.violations),
      activeLimits: RateLimiter.getStats().activeLimits,
      whitelistedIPs: RateLimiter.getStats().whitelistedIPs,
      blacklistedIPs: RateLimiter.getStats().blacklistedIPs,
    };
  }

  // Son violation'ları getir
  static getRecentViolations(limit: number = 50): RateLimitViolation[] {
    return this.violations.slice(-limit).reverse();
  }

  // IP bazında istatistikler
  static getIPStats(
    ipAddress: string,
    timeRange: '1h' | '24h' | '7d' = '24h'
  ): {
    violations: RateLimitViolation[];
    totalRequests: number;
    violationRate: number;
  } {
    const now = new Date();
    let cutoffTime: Date;

    switch (timeRange) {
      case '1h':
        cutoffTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
    }

    const ipViolations = this.violations.filter(
      (v) => v.ipAddress === ipAddress && v.timestamp >= cutoffTime
    );

    return {
      violations: ipViolations,
      totalRequests: this.getIPRequestCount(ipAddress, cutoffTime),
      violationRate:
        this.getIPRequestCount(ipAddress, cutoffTime) > 0
          ? ipViolations.length / this.getIPRequestCount(ipAddress, cutoffTime)
          : 0,
    };
  }

  // Alert kontrolü
  private static checkAlerts(violation: RateLimitViolation): void {
    const recentStats = this.getStats('1h');

    // Yüksek violation rate alert
    if (recentStats.violationRate > this.alertThresholds.violationRate) {
      if (recentStats.violationRate > 0.2) {
        logger.error('High rate limit violation rate detected', undefined, {
          rate: recentStats.violationRate,
          threshold: this.alertThresholds.violationRate,
          violations: recentStats.blockedRequests,
          alertType: 'high_violation_rate',
        });
      } else {
        logger.warn('High rate limit violation rate detected', {
          rate: recentStats.violationRate,
          threshold: this.alertThresholds.violationRate,
          violations: recentStats.blockedRequests,
          alertType: 'high_violation_rate',
        });
      }
    }

    // Çok fazla IP'den violation
    const uniqueIPs = new Set(recentStats.topViolators.map((v) => v.identifier.split('-')[0]));
    if (uniqueIPs.size > this.alertThresholds.ipsPerHour) {
      logger.warn('High number of violating IPs detected', {
        uniqueIPs: uniqueIPs.size,
        threshold: this.alertThresholds.ipsPerHour,
        alertType: 'high_ip_count',
      });
    }

    // Endpoint-specific threshold
    const endpointViolation = recentStats.endpointStats.find(
      (e) => e.endpoint === violation.endpoint
    );
    if (
      endpointViolation &&
      endpointViolation.violations > this.alertThresholds.endpointThreshold
    ) {
      logger.warn('High violations on endpoint', {
        endpoint: violation.endpoint,
        violations: endpointViolation.violations,
        threshold: this.alertThresholds.endpointThreshold,
        alertType: 'endpoint_threshold',
      });
    }
  }

  // Yardımcı methodlar
  private static getTotalRequests(_cutoffTime: Date): number {
    // Bu basit bir approximation - gerçek uygulamada bir log sisteminden gelecek
    return RateLimiter.getStats().totalRequests;
  }

  private static addRequestCounts(
    endpointMap: Map<string, { requests: number; violations: number }>
  ): void {
    // Bu method gerçek request log'larından beslenecek
    // Şimdilik violation sayısından türetilmiş bir approximation kullanıyoruz
    endpointMap.forEach((data) => {
      data.requests = Math.max(data.violations * 10, 1); // Minimum 1 request
    });
  }

  private static getIPRequestCount(ipAddress: string, cutoffTime: Date): number {
    // IP bazında request count - gerçek log sisteminden gelecek
    const violations = this.violations.filter(
      (v) => v.ipAddress === ipAddress && v.timestamp >= cutoffTime
    );
    return violations.length * 10; // Approximation
  }

  // Monitoring reset
  static reset(): void {
    this.violations = [];
    logger.info('Rate limit monitoring data reset', {
      previousViolationCount: this.violations.length,
    });
  }

  // Export data
  static exportData(): string {
    return JSON.stringify(
      {
        violations: this.violations,
        stats: this.getStats(),
        exportTime: new Date().toISOString(),
      },
      null,
      2
    );
  }
}
