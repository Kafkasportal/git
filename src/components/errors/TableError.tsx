/**
 * Table/List-specific Error Fallback
 * Used for data tables and list views
 */

import { Database, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TableErrorProps {
  error?: Error;
  resetError?: () => void;
  message?: string;
}

export function TableError({ error, resetError, message }: TableErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
        <Database className="h-8 w-8 text-red-600 dark:text-red-400" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Veriler Yüklenemedi
      </h3>

      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mb-4">
        {message || 'Liste verileri yüklenirken bir hata oluştu. Lütfen tekrar deneyin.'}
      </p>

      {process.env.NODE_ENV === 'development' && error && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-md p-3 border border-red-200 dark:border-red-900/30 mb-4 max-w-lg">
          <p className="text-xs font-mono text-red-800 dark:text-red-300 break-all text-left">
            {error.message}
          </p>
        </div>
      )}

      {resetError && (
        <Button onClick={resetError} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Yeniden Yükle
        </Button>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
        Sorun devam ederse internet bağlantınızı kontrol edin veya sistem yöneticinize başvurun.
      </p>
    </div>
  );
}
