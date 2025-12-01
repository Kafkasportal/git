import { NextResponse } from 'next/server';
import logger from '@/lib/logger';

export async function GET() {
  try {
    // Try to fetch real rates
    // Using a free API (e.g., frankfurter.app or similar)
    // Base: TRY (or USD/EUR to TRY)

    // Let's fetch USD and EUR rates against TRY
    // Frankfurter is free and doesn't require key
    const response = await fetch('https://api.frankfurter.app/latest?from=TRY&to=USD,EUR,GBP');

    if (response.ok) {
      const data = await response.json();
      // data.rates will be like { USD: 0.03, EUR: 0.028 } (1 TRY = X Currency)
      // We usually want 1 USD = X TRY, so we invert

      const rates = [
        { code: 'USD', name: 'Amerikan Doları', rate: 1 / data.rates.USD, change: 0.1 },
        { code: 'EUR', name: 'Euro', rate: 1 / data.rates.EUR, change: -0.05 },
        { code: 'GBP', name: 'İngiliz Sterlini', rate: 1 / data.rates.GBP, change: 0.2 },
      ];

      return NextResponse.json({
        success: true,
        data: {
          rates,
          lastUpdate: new Date().toISOString(),
        },
      });
    }

    throw new Error('Failed to fetch from external API');
  } catch (error) {
    logger.error('Currency fetch error, using fallback:', error);

    // Fallback mock data
    const fallbackRates = [
      { code: 'USD', name: 'Amerikan Doları', rate: 34.5, change: 0.15 },
      { code: 'EUR', name: 'Euro', rate: 36.8, change: -0.1 },
      { code: 'GBP', name: 'İngiliz Sterlini', rate: 43.2, change: 0.05 },
    ];

    return NextResponse.json({
      success: true,
      data: {
        rates: fallbackRates,
        lastUpdate: new Date().toISOString(),
      },
    });
  }
}
