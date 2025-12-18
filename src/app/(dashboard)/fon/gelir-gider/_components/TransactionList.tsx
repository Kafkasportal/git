import { memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowDownCircle, ArrowUpCircle, Edit, Eye, FileText, Trash2 } from 'lucide-react';
import { STATUS_LABELS } from '@/lib/financial/constants';
import { formatCurrency, formatTransactionDate } from '@/lib/financial/calculations';
import type { FinanceRecord } from '@/lib/financial/calculations';

interface TransactionListProps {
  records: FinanceRecord[];
  isLoading?: boolean;
  total?: number;
  onViewRecord?: (record: FinanceRecord) => void;
  onEditRecord?: (record: FinanceRecord) => void;
  onDeleteRecord?: (record: FinanceRecord) => void;
}

function TransactionListComponent({
  records,
  isLoading,
  total,
  onViewRecord,
  onEditRecord,
  onDeleteRecord,
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
          {(total != null) ? `Toplam ${total} kayıt bulundu` : 'Kayıt bulunamadı'}
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
                onDelete={onDeleteRecord}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Memoized TransactionList component for performance optimization
export const TransactionList = memo(TransactionListComponent);

interface TransactionRowProps {
  record: FinanceRecord;
  onView?: (record: FinanceRecord) => void;
  onEdit?: (record: FinanceRecord) => void;
  onDelete?: (record: FinanceRecord) => void;
}

const TransactionRow = memo(function TransactionRow({ record, onView, onEdit, onDelete }: TransactionRowProps) {
  const statusInfo = STATUS_LABELS[record.status];

  // Memoize click handlers
  const handleView = useCallback(() => {
    onView?.(record);
  }, [onView, record]);

  const handleEdit = useCallback(() => {
    onEdit?.(record);
  }, [onEdit, record]);

  const handleDelete = useCallback(() => {
    onDelete?.(record);
  }, [onDelete, record]);

  // Map status to Badge status prop
  const getBadgeStatus = (status: string) => {
    switch (status) {
      case 'completed':
        return 'active' as const;
      case 'pending':
        return 'pending' as const;
      case 'cancelled':
        return 'error' as const;
      default:
        return undefined;
    }
  };

  return (
    <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {/* Transaction Header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2">
              {record.record_type === 'income' ? (
                <ArrowUpCircle className="h-5 w-5 text-success" />
              ) : (
                <ArrowDownCircle className="h-5 w-5 text-error" />
              )}
              <Badge status={getBadgeStatus(record.status)} variant={getBadgeStatus(record.status) ? undefined : 'outline'}>
                {statusInfo?.label}
              </Badge>
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
              valueClassName={`font-bold ${record.record_type === 'income' ? 'text-success' : 'text-error'}`}
            />
            <DetailField label="Ödeme Yöntemi" value={record.payment_method || '-'} />
            <DetailField label="Makbuz No" value={record.receipt_number || '-'} />
            <DetailField label="İlgili" value={record.related_to || '-'} />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1" onClick={handleView}>
            <Eye className="h-4 w-4" />
            Görüntüle
          </Button>
          <Button size="sm" variant="outline" className="gap-1" onClick={handleEdit}>
            <Edit className="h-4 w-4" />
            Düzenle
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
            Sil
          </Button>
        </div>
      </div>
    </div>
  );
});

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
