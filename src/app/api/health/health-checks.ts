import logger from '@/lib/logger';

export interface ConnectivityReport {
  summary: {
    overallHealth: number;
    passedTests: number;
    failedTests: number;
  };
  tests: Array<{
    name: string;
    passed: boolean;
    responseTime?: number;
    message: string;
  }>;
  recommendations: string[];
}

export interface ValidationReport {
  summary: {
    errors: number;
    warnings: number;
  };
  errors: string[];
  warnings: string[];
}

/**
 * Test Appwrite connectivity
 */
export async function testAppwriteConnectivity(
  appwriteEndpoint: string | undefined,
  appwriteProjectId: string | undefined
): Promise<{ report: ConnectivityReport | null; error: string | null }> {
  if (!appwriteEndpoint || !appwriteProjectId) {
    return { report: null, error: null };
  }

  try {
    const { serverDatabases } = await import('@/lib/appwrite/server');
    const { appwriteConfig } = await import('@/lib/appwrite/config');

    if (!serverDatabases || !appwriteConfig.databaseId) {
      throw new Error('Appwrite not configured');
    }

    const startTime = Date.now();
    await serverDatabases.list();
    const responseTime = Date.now() - startTime;

    const report: ConnectivityReport = {
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

    return { report, error: null };
  } catch (_error: unknown) {
    const error = _error instanceof Error ? _error.message : 'Bilinmeyen hata';
    logger.error('Appwrite connectivity test failed', _error, {
      endpoint: '/api/health',
      provider: 'appwrite',
      detailed: true,
    });

    const report: ConnectivityReport = {
      summary: {
        overallHealth: 0,
        passedTests: 0,
        failedTests: 1,
      },
      tests: [
        {
          name: 'Appwrite Connection',
          passed: false,
          message: error,
        },
      ],
      recommendations: [
        'Check NEXT_PUBLIC_APPWRITE_ENDPOINT configuration',
        'Check NEXT_PUBLIC_APPWRITE_PROJECT_ID configuration',
        'Check APPWRITE_API_KEY configuration',
      ],
    };

    return { report, error };
  }
}

/**
 * Generate validation report
 */
export function generateValidationReport(
  appwriteApiKey: string | undefined,
  connectivityError: string | null
): ValidationReport {
  if (connectivityError) {
    return {
      summary: {
        errors: 1,
        warnings: 0,
      },
      errors: [`Appwrite connection failed: ${connectivityError}`],
      warnings: [],
    };
  }

  return {
    summary: {
      errors: 0,
      warnings: appwriteApiKey ? 0 : 1,
    },
    errors: [],
    warnings: appwriteApiKey ? [] : ['APPWRITE_API_KEY is not set (server-side operations will fail)'],
  };
}

/**
 * Generate validation report when Appwrite is not configured
 */
export function generateNotConfiguredReport(): ValidationReport {
  return {
    summary: {
      errors: 1,
      warnings: 0,
    },
    errors: ['Appwrite is not configured'],
    warnings: [],
  };
}

