/**
 * Form-specific Error Fallback
 * Used for complex multi-step forms
 */

import { AlertTriangle, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FormErrorProps {
  error?: Error;
  resetError?: () => void;
  onClose?: () => void;
}

export function FormError({ error, resetError, onClose }: FormErrorProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md mx-auto my-8">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-6 w-6 text-amber-500" />
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Form Hatası
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Form işlenirken bir sorun oluştu. Verileriniz kaybolmamış olabilir.
            </p>
          </div>

          {process.env.NODE_ENV === 'development' && error && (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-md p-2 border border-amber-200 dark:border-amber-900/30">
              <p className="text-xs font-mono text-amber-800 dark:text-amber-300 break-all">
                {error.message}
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            {resetError && (
              <Button size="sm" onClick={resetError} className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" />
                Tekrar Dene
              </Button>
            )}
            {onClose && (
              <Button size="sm" variant="outline" onClick={onClose} className="gap-1.5">
                <X className="h-3.5 w-3.5" />
                Kapat
              </Button>
            )}
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-2 border border-blue-200 dark:border-blue-900/30">
            <p className="text-xs text-blue-800 dark:text-blue-300">
              <strong>Önemli:</strong> Formu kapatmadan önce doldurduğunuz bilgileri kaydetmeyi
              deneyin. Tarayıcınızın geri butonunu kullanarak önceki adıma dönebilirsiniz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
