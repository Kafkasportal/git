import { AlertTriangle } from 'lucide-react';

/**
 * Demo Mode Banner
 * Displays a prominent warning when mock/demo data is being shown
 * Only shows when NEXT_PUBLIC_DEMO_MODE=true
 */
export function DemoBanner() {
  // Only show in demo mode
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') {
    return null;
  }

  return (
    <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-amber-900">Demo Veriler Gösteriliyor</h3>
          <p className="mt-1 text-sm text-amber-800">
            Bu sayfada gösterilen veriler demo amaçlıdır. Production ortamında gerçek veriler
            kullanılacaktır. Detaylar için{' '}
            <a
              href="https://github.com/kafkasder-org/Kafkasportal/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-amber-900"
            >
              GitHub Issues
            </a>{' '}
            sayfasına bakabilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
}
