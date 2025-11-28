'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowDownCircle, ArrowUpCircle, Edit, Eye, FileText } from 'lucide-react';
import { STATUS_LABELS } from '@/lib/financial/constants';
import { formatCurrency, formatTransactionDate } from '@/lib/financial/calculations';
import type { FinanceRecord } from '@/lib/financial/calculations';

interface TransactionListProps {
  records: FinanceRecord[];
  isLoading?: boolean;
  total?: number;
  onViewRecord?: (record: FinanceRecord) => void;
  onEditRecord?: (record: FinanceRecord) => void;
}

export function TransactionList({
  records,
  isLoading,
  total,
  onViewRecord,
  onEditRecord,
}: TransactionListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gelir Gider Listesi</CardTitle>
          <CardDescription>Yükleniyor...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-4" />
                <div className="grid grid-cols-6 gap-4">
                  {[...Array(6)].map((_, j) => (
                    <div key={j} className="h-3 bg-muted rounded" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gelir Gider Listesi</CardTitle>
        <CardDescription>
          {total ? `Toplam ${total} kayıt bulundu` : 'Kayıt bulunamadı'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <FileText className="h-12 w-12 mx-auto mb-4" />
            <p className="text-lg font-medium">Kayıt bulunamadı</p>
            <p className="text-sm mt-2">
              Henüz kayıt eklenmemiş veya arama kriterlerinize uygun kayıt yok
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {records.map((record) => (
              <TransactionRow
                key={record._id}
                record={record}
                onView={onViewRecord}
                onEdit={onEditRecord}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface TransactionRowProps {
  record: FinanceRecord;
  onView?: (record: FinanceRecord) => void;
  onEdit?: (record: FinanceRecord) => void;
}

function TransactionRow({ record, onView, onEdit }: TransactionRowProps) {
  const statusInfo = STATUS_LABELS[record.status];

  return (
    <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {/* Transaction Header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2">
              {record.record_type === 'income' ? (
                <ArrowUpCircle className="h-5 w-5 text-green-600" />
              ) : (
                <ArrowDownCircle className="h-5 w-5 text-red-600" />
              )}
              <Badge className={statusInfo?.color}>{statusInfo?.label}</Badge>
            </div>
            <h3 className="font-semibold">{record.description}</h3>
            <span className="text-sm text-muted-foreground">
              {formatTransactionDate(record.transaction_date)}
            </span>
          </div>

          {/* Transaction Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
            <DetailField label="Tür" value={record.record_type === 'income' ? 'Gelir' : 'Gider'} />
            <DetailField label="Kategori" value={record.category} />
            <DetailField
              label="Tutar"
              value={formatCurrency(record.amount)}
              valueClassName={`font-bold ${record.record_type === 'income' ? 'text-green-600' : 'text-red-600'}`}
            />
            <DetailField label="Ödeme Yöntemi" value={record.payment_method || '-'} />
            <DetailField label="Makbuz No" value={record.receipt_number || '-'} />
            <DetailField label="İlgili" value={record.related_to || '-'} />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1" onClick={() => onView?.(record)}>
            <Eye className="h-4 w-4" />
            Görüntüle
          </Button>
          <Button size="sm" variant="outline" className="gap-1" onClick={() => onEdit?.(record)}>
            <Edit className="h-4 w-4" />
            Düzenle
          </Button>
        </div>
      </div>
    </div>
  );
}

interface DetailFieldProps {
  label: string;
  value: string | number;
  valueClassName?: string;
}

function DetailField({ label, value, valueClassName = 'font-medium' }: DetailFieldProps) {
  return (
    <div>
      <span className="text-muted-foreground">{label}:</span>
      <p className={valueClassName}>{value}</p>
    </div>
  );
}
