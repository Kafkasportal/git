'use client';

import React, { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, CheckCircle2, Users, Eye, XCircle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface DuplicateMatch {
  id: string;
  name: string;
  tc_no?: string;
  phone?: string;
  address?: string;
  matchType: 'exact_tc' | 'exact_phone' | 'similar_name' | 'similar_address';
  matchScore: number;
  createdAt?: string;
}

interface DuplicateCheckResult {
  hasDuplicates: boolean;
  matches: DuplicateMatch[];
  warnings: string[];
}

interface DuplicateCheckInput {
  tc_no?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  excludeId?: string;
}

interface DuplicateCheckerProps {
  input: DuplicateCheckInput;
  onDuplicateFound?: (result: DuplicateCheckResult) => void;
  onNoDuplicate?: () => void;
  autoCheck?: boolean;
  className?: string;
}

const MATCH_TYPE_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  exact_tc: {
    label: 'TC Eşleşmesi',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    icon: <XCircle className="h-4 w-4" />,
  },
  exact_phone: {
    label: 'Telefon Eşleşmesi',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  similar_name: {
    label: 'Benzer İsim',
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
    icon: <Users className="h-4 w-4" />,
  },
  similar_address: {
    label: 'Benzer Adres',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    icon: <Users className="h-4 w-4" />,
  },
};

/**
 * Mükerrer kayıt kontrol bileşeni
 */
export function DuplicateChecker({
  input,
  onDuplicateFound,
  onNoDuplicate,
  autoCheck = false,
  className,
}: DuplicateCheckerProps) {
  const [result, setResult] = useState<DuplicateCheckResult | null>(null);
  const [hasChecked, setHasChecked] = useState(false);

  const checkMutation = useMutation({
    mutationFn: async (data: DuplicateCheckInput) => {
      const response = await fetch('/api/beneficiaries/check-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Kontrol başarısız');
      }

      return await response.json();
    },
    onSuccess: (data) => {
      const checkResult = data.data as DuplicateCheckResult;
      setResult(checkResult);
      setHasChecked(true);

      if (checkResult.hasDuplicates) {
        onDuplicateFound?.(checkResult);
      } else {
        onNoDuplicate?.();
      }
    },
  });

  const handleCheck = useCallback(() => {
    checkMutation.mutate(input);
  }, [input, checkMutation]);

  // Auto check on mount or input change
  React.useEffect(() => {
    if (autoCheck && !hasChecked) {
      const hasValidInput = input.tc_no || (input.firstName && input.lastName) || input.phone;
      if (hasValidInput) {
        handleCheck();
      }
    }
  }, [autoCheck, hasChecked, input, handleCheck]);

  const maskTcNo = (tc: string) => {
    if (!tc || tc.length !== 11) return tc;
    return tc.slice(0, 3) + '****' + tc.slice(-4);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Kontrol Butonu */}
      {!autoCheck && (
        <Button
          type="button"
          variant="outline"
          onClick={handleCheck}
          disabled={checkMutation.isPending}
          className="w-full"
        >
          {checkMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Kontrol Ediliyor...
            </>
          ) : (
            <>
              <Users className="mr-2 h-4 w-4" />
              Mükerrer Kayıt Kontrolü
            </>
          )}
        </Button>
      )}

      {/* Loading State */}
      {checkMutation.isPending && autoCheck && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Kontrol Ediliyor</AlertTitle>
          <AlertDescription>Mükerrer kayıt kontrolü yapılıyor...</AlertDescription>
        </Alert>
      )}

      {/* Error State */}
      {checkMutation.isError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Hata</AlertTitle>
          <AlertDescription>
            {checkMutation.error?.message || 'Kontrol sırasında bir hata oluştu'}
          </AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {result && hasChecked && (
        <>
          {/* No Duplicates */}
          {!result.hasDuplicates && (
            <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-700 dark:text-green-400">
                Mükerrer Kayıt Bulunamadı
              </AlertTitle>
              <AlertDescription className="text-green-600 dark:text-green-500">
                Girilen bilgilerle eşleşen kayıt bulunamadı. Kayda devam edebilirsiniz.
              </AlertDescription>
            </Alert>
          )}

          {/* Duplicates Found */}
          {result.hasDuplicates && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Olası Mükerrer Kayıt!</AlertTitle>
                <AlertDescription>
                  {result.warnings.map((warning, i) => (
                    <div key={i}>{warning}</div>
                  ))}
                </AlertDescription>
              </Alert>

              {/* Match List */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Bulunan Eşleşmeler ({result.matches.length})
                  </CardTitle>
                  <CardDescription>
                    Aşağıdaki kayıtlar girilen bilgilerle eşleşiyor
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.matches.map((match) => (
                    <div
                      key={match.id}
                      className="flex items-start justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{match.name}</span>
                          <Badge
                            variant="secondary"
                            className={cn(
                              'text-xs',
                              MATCH_TYPE_LABELS[match.matchType]?.color
                            )}
                          >
                            {MATCH_TYPE_LABELS[match.matchType]?.icon}
                            <span className="ml-1">
                              {MATCH_TYPE_LABELS[match.matchType]?.label}
                            </span>
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            %{match.matchScore}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {match.tc_no && (
                            <span className="mr-3">TC: {maskTcNo(match.tc_no)}</span>
                          )}
                          {match.phone && <span className="mr-3">Tel: {match.phone}</span>}
                        </div>
                        {match.address && (
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {match.address}
                          </div>
                        )}
                      </div>
                      <Link href={`/yardim/ihtiyac-sahipleri/${match.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="mr-1 h-4 w-4" />
                          Görüntüle
                        </Button>
                      </Link>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * TC Kimlik No için inline duplicate checker
 * Form alanı değiştiğinde otomatik kontrol yapar
 */
interface TcNoDuplicateCheckerProps {
  tcNo: string;
  excludeId?: string;
  onResult?: (exists: boolean, existingName?: string) => void;
}

export function TcNoDuplicateChecker({
  tcNo,
  excludeId,
  onResult,
}: TcNoDuplicateCheckerProps) {
  const [checked, setChecked] = useState(false);

  const checkMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/beneficiaries/check-duplicate?type=tc_only', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tc_no: tcNo, excludeId }),
      });

      if (!response.ok) {
        throw new Error('Kontrol başarısız');
      }

      return await response.json();
    },
    onSuccess: (data) => {
      setChecked(true);
      onResult?.(data.data.exists, data.data.existingName);
    },
  });

  // TC No 11 hane olduğunda otomatik kontrol
  React.useEffect(() => {
    if (tcNo && tcNo.length === 11 && /^\d{11}$/.test(tcNo)) {
      setChecked(false);
      checkMutation.mutate();
    }
  }, [tcNo]);

  if (!tcNo || tcNo.length !== 11) return null;

  if (checkMutation.isPending) {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Kontrol ediliyor...
      </div>
    );
  }

  if (checked && checkMutation.data) {
    const { exists, existingName } = checkMutation.data.data;

    if (exists) {
      return (
        <div className="flex items-center gap-1 text-xs text-destructive">
          <XCircle className="h-3 w-3" />
          Bu TC ile kayıtlı: {existingName}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1 text-xs text-green-600">
        <CheckCircle2 className="h-3 w-3" />
        TC doğrulandı
      </div>
    );
  }

  return null;
}
