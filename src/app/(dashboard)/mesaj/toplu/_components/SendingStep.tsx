'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import type { SendingResult } from '@/lib/messages/calculations';

interface SendingStepProps {
  progress: number;
  result?: SendingResult;
  isCompleted: boolean;
  isFailed?: boolean;
}

export function SendingStep({ progress, result, isCompleted, isFailed }: SendingStepProps) {
  return (
    <div className="space-y-6">
      {/* Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Gönderme İşlemi
          </CardTitle>
          <CardDescription>Mesajlar gönderiliyor...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">İlerleme</span>
              <span className="text-sm font-bold text-blue-600">{progress}%</span>
            </div>
            <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Status Messages */}
          {!isCompleted && !isFailed && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Mesajlar gönderiliyor</p>
                <p className="text-sm text-blue-700 mt-1">Lütfen bu sayfadan ayrılmayın</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Card */}
      {isCompleted && result && <SendingResultsCard result={result} isFailed={isFailed} />}
    </div>
  );
}

interface SendingResultsCardProps {
  result: SendingResult;
  isFailed?: boolean;
}

function SendingResultsCard({ result, isFailed }: SendingResultsCardProps) {
  const total = result.success + result.failed;
  const successRate = total > 0 ? Math.round((result.success / total) * 100) : 0;

  return (
    <Card className={isFailed ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isFailed ? (
            <>
              <XCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-900">Gönderme Tamamlandı (Hatalar Var)</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-900">Gönderme Tamamlandı</span>
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <span className="text-sm font-medium text-muted-foreground">Başarılı</span>
            <p className="text-2xl font-bold text-green-600">{result.success}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-muted-foreground">Başarısız</span>
            <p className="text-2xl font-bold text-red-600">{result.failed}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-muted-foreground">Başarı Oranı</span>
            <p className="text-2xl font-bold">{successRate}%</p>
          </div>
        </div>

        {/* Error List */}
        {result.errors.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <h4 className="font-medium text-red-900">Hata Detayları</h4>
            </div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {result.errors.slice(0, 10).map((error, index) => (
                <div key={index} className="text-sm bg-white bg-opacity-50 rounded p-2">
                  <p className="font-medium text-red-900">{error.recipient}</p>
                  <p className="text-red-700 text-xs">{error.error}</p>
                </div>
              ))}
              {result.errors.length > 10 && (
                <p className="text-sm text-red-700 font-medium">
                  + {result.errors.length - 10} daha...
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
