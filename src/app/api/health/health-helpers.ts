import type { ConnectivityReport, ValidationReport } from './health-checks';

/**
 * Aggregate recommendations from reports
 */
export function aggregateRecommendations(
  validationReport: ValidationReport,
  connectivityReport: ConnectivityReport | null
): string[] {
  const recommendations: string[] = [];

  if (validationReport.summary.errors > 0) {
    recommendations.push('Fix environment variable configuration errors');
  }

  if (connectivityReport && connectivityReport.summary.failedTests > 0) {
    recommendations.push(...connectivityReport.recommendations);
  }

  return recommendations;
}

/**
 * Determine HTTP status code based on health reports
 */
export function determineStatusCode(connectivityReport: ConnectivityReport | null): number {
  if (connectivityReport && connectivityReport.summary.overallHealth < 50) {
    return 503; // Service unavailable
  }
  return 200;
}

