import logger from './logger';
import { NextRequest, NextResponse } from 'next/server';
import {
  authRateLimit,
  dataModificationRateLimit,
  readOnlyRateLimit,
  uploadRateLimit,
  searchRateLimit,
  dashboardRateLimit,
} from './rate-limit';

// Endpoint-specific rate limiting konfigürasyonları
export interface EndpointConfig {
  pattern: RegExp;
  rateLimitFunction: (
    handler: (req: NextRequest) => Promise<NextResponse> | NextResponse
  ) => (req: NextRequest) => Promise<NextResponse>;
  description: string;
}

// Tüm endpoint'ler için rate limit konfigürasyonları
export const RATE_LIMIT_CONFIGS: EndpointConfig[] = [
  // Authentication endpoints - Çok sıkı limitler
  {
    pattern: /^\/api\/auth\//,
    rateLimitFunction: authRateLimit,
    description: 'Authentication endpoints - 5 requests per 5 minutes',
  },

  // File upload endpoints
  {
    pattern: /^\/api\/storage\/upload/,
    rateLimitFunction: uploadRateLimit,
    description: 'File upload endpoints - 10 uploads per minute',
  },

  // Data modification endpoints (POST, PUT, DELETE)
  {
    pattern:
      /^\/api\/(beneficiaries|users|tasks|meetings|messages|donations)\/[^\/]+\/(PUT|DELETE|PATCH)/,
    rateLimitFunction: dataModificationRateLimit,
    description: 'Data modification endpoints - 50 requests per 15 minutes',
  },
  {
    pattern:
      /^\/api\/(beneficiaries|users|tasks|meetings|messages|donations)\/[^/]*\/(POST|PUT|DELETE)/,
    rateLimitFunction: dataModificationRateLimit,
    description: 'Data modification endpoints - 50 requests per 15 minutes',
  },

  // Financial data modification
  {
    pattern: /^\/api\/financial\/(budgets|invoices|transactions)\/(POST|PUT|DELETE)/,
    rateLimitFunction: dataModificationRateLimit,
    description: 'Financial modification endpoints - 50 requests per 15 minutes',
  },

  // Dashboard endpoints - Orta limitler
  {
    pattern: /^\/api\/financial\/dashboard/,
    rateLimitFunction: dashboardRateLimit,
    description: 'Dashboard endpoints - 60 requests per minute',
  },

  // Financial reports and read operations
  {
    pattern: /^\/api\/financial\/reports/,
    rateLimitFunction: readOnlyRateLimit,
    description: 'Financial reports endpoints - 200 requests per 15 minutes',
  },

  // Read-only endpoints - Daha yüksek limitler
  {
    pattern: /^\/api\/(beneficiaries|users|tasks|meetings|messages|donations)\/[^\/]*\/(GET)/,
    rateLimitFunction: readOnlyRateLimit,
    description: 'Read-only endpoints - 200 requests per 15 minutes',
  },
  {
    pattern: /^\/api\/(beneficiaries|users|tasks|meetings|messages|donations)\/(GET)/,
    rateLimitFunction: readOnlyRateLimit,
    description: 'Read-only endpoints - 200 requests per 15 minutes',
  },

  // Financial read operations
  {
    pattern: /^\/api\/financial\/(budgets|invoices|transactions|dashboard)\/(GET)/,
    rateLimitFunction: readOnlyRateLimit,
    description: 'Financial read endpoints - 200 requests per 15 minutes',
  },

  // Search endpoints
  {
    pattern: /^\/api\/.*\/search/,
    rateLimitFunction: searchRateLimit,
    description: 'Search endpoints - 30 searches per minute',
  },

  // Health check - Her zaman açık
  {
    pattern: /^\/api\/health/,
    rateLimitFunction:
      (handler: (req: NextRequest) => Promise<NextResponse> | NextResponse) =>
      async (req: NextRequest) => {
        return await Promise.resolve(handler(req));
      }, // No rate limiting
    description: 'Health check endpoints - No rate limiting',
  },
];

// Global rate limit middleware - Tüm API endpoint'leri için
export function applyGlobalRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse,
  req: NextRequest
): (req: NextRequest) => Promise<NextResponse> | NextResponse {
  const pathname = req.nextUrl.pathname;

  // Hangi konfigürasyonun eşleştiğini bul
  const matchedConfig = RATE_LIMIT_CONFIGS.find((config) => config.pattern.test(pathname));

  if (matchedConfig) {
    logger.debug('Applying rate limit', { pathname, description: matchedConfig.description });
    return matchedConfig.rateLimitFunction(handler);
  }

  // Eğer hiçbir konfigürasyon eşleşmezse, varsayılan olarak read-only limit kullan
  logger.debug('Applying default rate limit', { pathname });
  return readOnlyRateLimit(handler);
}

// Helper function to get endpoint category
export function getEndpointCategory(pathname: string): string {
  const matchedConfig = RATE_LIMIT_CONFIGS.find((config) => config.pattern.test(pathname));

  if (matchedConfig) {
    return matchedConfig.description;
  }

  return 'Default read-only rate limit';
}

// Helper function to check if endpoint should have rate limiting
export function shouldApplyRateLimit(pathname: string): boolean {
  // Health check endpoints should not have rate limiting
  if (pathname.startsWith('/api/health')) {
    return false;
  }

  return true;
}

// Rate limit statistics for monitoring
export interface RateLimitStats {
  endpoint: string;
  category: string;
  requests: number;
  violations: number;
  lastRequest?: Date;
}

// Get rate limit configuration for specific endpoint
export function getRateLimitConfigForEndpoint(pathname: string): EndpointConfig | null {
  return RATE_LIMIT_CONFIGS.find((config) => config.pattern.test(pathname)) || null;
}

// Validate rate limit configuration
export function validateRateLimitConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for duplicate patterns
  const patterns = RATE_LIMIT_CONFIGS.map((config) => config.pattern.source);
  const uniquePatterns = new Set(patterns);

  if (patterns.length !== uniquePatterns.size) {
    errors.push('Duplicate rate limit patterns detected');
  }

  // Check if all configurations have required properties
  RATE_LIMIT_CONFIGS.forEach((config, index) => {
    if (!config.pattern) {
      errors.push(`Configuration ${index} missing pattern`);
    }
    if (!config.rateLimitFunction) {
      errors.push(`Configuration ${index} missing rateLimitFunction`);
    }
    if (!config.description) {
      errors.push(`Configuration ${index} missing description`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
