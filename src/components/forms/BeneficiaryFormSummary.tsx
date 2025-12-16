'use client';

import { BeneficiaryCategory, FundRegion, FileConnection } from '@/types/beneficiary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface BeneficiaryFormSummaryProps {
  data: {
    firstName?: string;
    lastName?: string;
    category?: BeneficiaryCategory;
    mobilePhone?: string;
    city?: string;
    district?: string;
    fundRegion?: FundRegion;
    fileNumber?: string;
  };
}

const categoryLabels: Record<BeneficiaryCategory, string> = {
  [BeneficiaryCategory.YETIM_AILESI]: 'Yetim Ailesi',
  [BeneficiaryCategory.MULTECI_AILE]: 'Mülteci Aile',
  [BeneficiaryCategory.IHTIYAC_SAHIBI_AILE]: 'İhtiyaç Sahibi Aile',
  [BeneficiaryCategory.YETIM_COCUK]: 'Yetim Çocuk',
  [BeneficiaryCategory.MULTECI_COCUK]: 'Mülteci Çocuk',
  [BeneficiaryCategory.IHTIYAC_SAHIBI_COCUK]: 'İhtiyaç Sahibi Çocuk',
  [BeneficiaryCategory.YETIM_GENCLIK]: 'Yetim Gençlik',
  [BeneficiaryCategory.MULTECI_GENCLIK]: 'Mülteci Gençlik',
  [BeneficiaryCategory.IHTIYAC_SAHIBI_GENCLIK]: 'İhtiyaç Sahibi Gençlik',
};

const fundRegionLabels: Record<FundRegion, string> = {
  [FundRegion.AVRUPA]: 'Avrupa',
  [FundRegion.SERBEST]: 'Serbest',
};

export function BeneficiaryFormSummary({ data }: BeneficiaryFormSummaryProps) {
  const fullName = data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : 'Ad Soyad Girilmedi';
  const category = data.category ? categoryLabels[data.category] : '-';
  const location = [data.city, data.district].filter(Boolean).join(' / ') || '-';
  const fundRegion = data.fundRegion ? fundRegionLabels[data.fundRegion] : '-';

  const missingFields = [];
  if (!data.firstName || !data.lastName) missingFields.push('Ad/Soyad');
  if (!data.mobilePhone) missingFields.push('Telefon');
  if (!data.city) missingFields.push('Şehir');
  if (!data.fileNumber) missingFields.push('Dosya Numarası');

  return (
    <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg text-slate-900 dark:text-slate-100">{fullName}</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">Kayıt Özeti</CardDescription>
          </div>
          {missingFields.length === 0 ? (
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Tamamlandı
            </Badge>
          ) : (
            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Eksik Alanlar
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">KATEGORİ</p>
            <p className="text-slate-900 dark:text-slate-100 font-medium">{category}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">FON BÖLGESİ</p>
            <p className="text-slate-900 dark:text-slate-100 font-medium">{fundRegion}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">TELEFON</p>
            <p className="text-slate-900 dark:text-slate-100 font-medium">{data.mobilePhone || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">DOSYA NO</p>
            <p className="text-slate-900 dark:text-slate-100 font-medium font-mono text-xs">{data.fileNumber || '-'}</p>
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">KONUM</p>
          <p className="text-slate-900 dark:text-slate-100">{location}</p>
        </div>

        {missingFields.length > 0 && (
          <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
            <p className="text-xs font-medium text-yellow-800 dark:text-yellow-300">
              ⚠️ Eksik alanlar: {missingFields.join(', ')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
