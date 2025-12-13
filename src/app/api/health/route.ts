import { NextResponse } from 'next/server';

// Cache for detailed health checks (30 seconds)
let healthCache: { data: unknown; timestamp: number } | null = null;
const CACHE_DURATION = 30 * 1000; // 30 seconds

export async function GET(request: Request) {
  const url = new URL(request.url);
  const detailed = url.searchParams.get('detailed') === 'true';

  // Appwrite configuration checks
  const appwriteEndpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? '';
  const appwriteProjectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? '';
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
  const { testAppwriteConnectivity, generateValidationReport, generateNotConfiguredReport } = await import('./health-checks');
  
  const { report: connectivityReport, error: connectivityError } = await testAppwriteConnectivity(
    appwriteEndpoint,
    appwriteProjectId
  );

  const validationReport = connectivityReport
    ? generateValidationReport(appwriteApiKey, connectivityError)
    : generateNotConfiguredReport();

  // Aggregate recommendations and determine status
  const { aggregateRecommendations, determineStatusCode } = await import('./health-helpers');
  const recommendations = aggregateRecommendations(validationReport, connectivityReport);
  const statusCode = determineStatusCode(connectivityReport);

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
