import { NextResponse } from 'next/server';
import logger from '@/lib/logger';

// Cache for detailed health checks (30 seconds)
let healthCache: { data: unknown; timestamp: number } | null = null;
const CACHE_DURATION = 30 * 1000; // 30 seconds

export async function GET(request: Request) {
  const url = new URL(request.url);
  const detailed = url.searchParams.get('detailed') === 'true';

  // Appwrite configuration checks
  const appwriteEndpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '';
  const appwriteProjectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
  const appwriteApiKey = process.env.APPWRITE_API_KEY || '';
  const appwriteDatabaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';

  const appwriteOk = Boolean(appwriteEndpoint && appwriteProjectId && appwriteApiKey);
  const configOk = appwriteOk;

  const baseResponse = {
    ok: true,
    provider: 'appwrite' as const,
    appwrite: {
      endpoint: Boolean(appwriteEndpoint),
      projectId: Boolean(appwriteProjectId),
      databaseId: Boolean(appwriteDatabaseId),
      apiKey: Boolean(appwriteApiKey),
      configured: appwriteOk,
      active: true,
    },
    timestamp: new Date().toISOString(),
    readyForProduction: configOk,
  };

  // Return basic response if not detailed
  if (!detailed) {
    return NextResponse.json(baseResponse);
  }

  // Check cache for detailed checks
  const now = Date.now();
  if (healthCache && now - healthCache.timestamp < CACHE_DURATION) {
    return NextResponse.json({
      ...baseResponse,
      ...(healthCache.data as object),
      cached: true,
    });
  }

  // Run comprehensive checks
  let connectivityReport: Record<string, unknown> | null = null;
  let connectivityError: string | null = null;
  let validationReport: Record<string, unknown> | null = null;

  if (appwriteEndpoint && appwriteProjectId) {
    try {
      // Dynamic import for Appwrite
      const { serverDatabases } = await import('@/lib/appwrite/server');
      const { appwriteConfig } = await import('@/lib/appwrite/config');

      if (!serverDatabases || !appwriteConfig.databaseId) {
        throw new Error('Appwrite not configured');
      }

      // Test Appwrite connectivity by listing databases
      const startTime = Date.now();
      await serverDatabases.list();
      const responseTime = Date.now() - startTime;

      connectivityReport = {
        summary: {
          overallHealth: responseTime < 1000 ? 100 : responseTime < 3000 ? 75 : 50,
          passedTests: 1,
          failedTests: responseTime > 3000 ? 1 : 0,
        },
        tests: [
          {
            name: 'Appwrite Connection',
            passed: true,
            responseTime,
            message: `Connected in ${responseTime}ms`,
          },
        ],
        recommendations: responseTime > 3000 ? ['Appwrite connection is slow'] : [],
      };

      validationReport = {
        summary: {
          errors: 0,
          warnings: appwriteApiKey ? 0 : 1,
        },
        errors: [],
        warnings: appwriteApiKey ? [] : ['APPWRITE_API_KEY is not set (server-side operations will fail)'],
      };
    } catch (_error: unknown) {
      connectivityError = _error instanceof Error ? _error.message : 'Bilinmeyen hata';
      logger.error('Appwrite connectivity test failed', _error, {
        endpoint: '/api/health',
        provider: 'appwrite',
        detailed: true,
      });

      connectivityReport = {
        summary: {
          overallHealth: 0,
          passedTests: 0,
          failedTests: 1,
        },
        tests: [
          {
            name: 'Appwrite Connection',
            passed: false,
            message: connectivityError,
          },
        ],
        recommendations: [
          'Check NEXT_PUBLIC_APPWRITE_ENDPOINT configuration',
          'Check NEXT_PUBLIC_APPWRITE_PROJECT_ID configuration',
          'Check APPWRITE_API_KEY configuration',
        ],
      };

      validationReport = {
        summary: {
          errors: 1,
          warnings: 0,
        },
        errors: [`Appwrite connection failed: ${connectivityError}`],
        warnings: [],
      };
    }
  } else {
    // Appwrite not configured
    validationReport = {
      summary: {
        errors: 1,
        warnings: 0,
      },
      errors: ['Appwrite is not properly configured. Check NEXT_PUBLIC_APPWRITE_ENDPOINT and NEXT_PUBLIC_APPWRITE_PROJECT_ID'],
      warnings: [],
    };
  }

  // Aggregate recommendations
  const recommendations: string[] = [];

  if (
    validationReport.summary &&
    typeof validationReport.summary === 'object' &&
    'errors' in validationReport.summary &&
    (validationReport.summary as { errors: number }).errors > 0
  ) {
    recommendations.push('Fix environment variable configuration errors');
  }

  if (
    connectivityReport &&
    connectivityReport.summary &&
    typeof connectivityReport.summary === 'object' &&
    'failedTests' in connectivityReport.summary &&
    (connectivityReport.summary as { failedTests: number }).failedTests > 0
  ) {
    const recs = connectivityReport.recommendations as string[] | undefined;
    if (recs) recommendations.push(...recs);
  }

  // Determine status code
  let statusCode = 200;
  if (
    connectivityReport &&
    connectivityReport.summary &&
    typeof connectivityReport.summary === 'object' &&
    'overallHealth' in connectivityReport.summary &&
    (connectivityReport.summary as { overallHealth: number }).overallHealth < 50
  ) {
    statusCode = 503; // Service unavailable
  }

  const detailedData = {
    validation: validationReport,
    connectivity: connectivityReport,
    connectivityError,
    recommendations,
  };

  // Cache the detailed results
  healthCache = {
    data: detailedData,
    timestamp: now,
  };

  return NextResponse.json(
    {
      ...baseResponse,
      ...detailedData,
    },
    { status: statusCode }
  );
}
