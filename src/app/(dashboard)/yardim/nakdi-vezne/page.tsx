'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appwriteFinanceRecords } from '@/lib/appwrite/api';
import type { FinanceRecordCreateInput } from '@/lib/api/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageLayout } from '@/components/layouts/PageLayout';
import { Plus, ArrowDownToLine, ArrowUpFromLine, AlertTriangle, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';
import logger from '@/lib/logger';
import { useAuthStore } from '@/stores/authStore';

type TransactionType = 'deposit' | 'withdrawal' | 'transfer';

const CATEGORIES = [
  'Nakdi Yardım',
  'Acil Yardım',
  'Eğitim Desteği',
  'Sağlık Desteği',
  'Kira Yardımı',
  'Gıda Yardımı',
  'Diğer',
];

const MINIMUM_BALANCE_THRESHOLD = 5000; // TRY

export default function CashVaultPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<TransactionType>('withdrawal');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch vault balance
  const { data: vaultData } = useQuery({
    queryKey: ['vault-balance'],
    queryFn: async () => {
      // Calculate balance from all finance records
      const response = await appwriteFinanceRecords.list({ limit: 1000 });
      const records = response.documents || [];
      
      let balance = 0;
      let cashIn = 0;
      let cashOut = 0;
      
      records.forEach((r: { type?: string; amount?: number; payment_method?: string; [key: string]: unknown }) => {
        const amount = r.amount || 0;
        if (r.payment_method === 'cash') {
          if (r.type === 'income') {
            cashIn += amount;
            balance += amount;
          } else if (r.type === 'expense') {
            cashOut += amount;
            balance -= amount;
          }
        }
      });

      return {
        balance,
        cashIn,
        cashOut,
        transactionCount: records.filter((r: { payment_method?: string; [key: string]: unknown }) => r.payment_method === 'cash').length,
      };
    },
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const vaultBalance = vaultData;

  // Fetch recent transactions
  const { data: recentTransactionsData } = useQuery({
    queryKey: ['vault-transactions'],
    queryFn: async () => {
      const response = await appwriteFinanceRecords.list({ limit: 50 });
      return response.documents || [];
    },
    refetchInterval: 5000,
  });

  const recentTransactions = recentTransactionsData || [];

  // Mutation for creating vault transaction
  const createTransaction = useMutation({
    mutationFn: async (data: { type: string; amount: number; category: string; receipt_number?: string; notes?: string }) => {
      const createData: FinanceRecordCreateInput = {
        record_type: data.type === 'deposit' ? 'income' : 'expense',
        amount: data.amount,
        category: data.category,
        currency: 'TRY',
        description: data.notes || '',
        transaction_date: new Date().toISOString(),
        payment_method: 'cash',
        receipt_number: data.receipt_number,
        status: 'approved',
        created_by: '' as FinanceRecordCreateInput['created_by'], // Will be set by backend
      };
      return await appwriteFinanceRecords.create(createData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault-balance'] });
      queryClient.invalidateQueries({ queryKey: ['vault-transactions'] });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !category) {
      toast.error('Lütfen tüm gerekli alanları doldurun');
      return;
    }

    const amountNumber = parseFloat(amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      toast.error('Geçerli bir tutar girin');
      return;
    }

    // Check if withdrawal would cause negative balance
    if (transactionType === 'withdrawal' && vaultBalance) {
      if (amountNumber > vaultBalance.balance) {
        toast.error('Yetersiz bakiye!');
        return;
      }
    }

    try {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser?.id) {
        toast.error('Kullanıcı bilgisi bulunamadı');
        return;
      }

      await createTransaction.mutateAsync({
        type: transactionType,
        amount: amountNumber,
        category,
        receipt_number: receiptNumber || undefined,
        notes: notes || undefined,
      });

      toast.success('İşlem başarıyla kaydedildi');
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error('İşlem kaydedilirken hata oluştu');
      logger.error('Nakdi vezne error', { error });
    }
  };

  const resetForm = () => {
    setAmount('');
    setCategory('');
    setReceiptNumber('');
    setNotes('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const cashTransactions =
    recentTransactions?.filter((record: { payment_method?: string; [key: string]: unknown }) => record.payment_method === 'cash') || [];

  const isLowBalance = vaultBalance && vaultBalance.balance < MINIMUM_BALANCE_THRESHOLD;

  return (
    <PageLayout title="Nakdi Vezne" description="Nakdi yardım kasasını yönetin">
      {/* Low Balance Alert */}
      {isLowBalance && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Kasa bakiyesi minimum eşik değerin ({formatCurrency(MINIMUM_BALANCE_THRESHOLD)})
            altında! Mevcut bakiye: {formatCurrency(vaultBalance?.balance || 0)}
          </AlertDescription>
        </Alert>
      )}

      {/* Vault Overview */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kasa Bakiyesi</CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vaultBalance ? formatCurrency(vaultBalance.balance) : '...'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {vaultBalance?.transactionCount || 0} işlem
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Giriş</CardTitle>
            <ArrowDownToLine className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {vaultBalance ? formatCurrency(vaultBalance.cashIn) : '...'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Çıkış</CardTitle>
            <ArrowUpFromLine className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {vaultBalance ? formatCurrency(vaultBalance.cashOut) : '...'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Entry Dialog */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium">İşlem Geçmişi</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yeni İşlem
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Kasa İşlemi</DialogTitle>
              <DialogDescription>Kasa giriş veya çıkış işlemi oluşturun</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">İşlem Tipi</Label>
                  <Select
                    value={transactionType}
                    onValueChange={(value) => setTransactionType(value as TransactionType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deposit">Giriş (Nakit Tahsilat)</SelectItem>
                      <SelectItem value="withdrawal">Çıkış (Yardım Ödeme)</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="amount">Tutar (TRY)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                    }}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="category">Kategori</Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Kategori seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="receipt">Fiş/Makbuz No (Opsiyonel)</Label>
                  <Input
                    id="receipt"
                    placeholder="FIS-2025-001"
                    value={receiptNumber}
                    onChange={(e) => {
                      setReceiptNumber(e.target.value);
                    }}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="notes">Açıklama</Label>
                  <Textarea
                    id="notes"
                    placeholder="İşlem detayları..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  İptal
                </Button>
                <Button type="submit">Kaydet</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Transaction History Table */}
      <Card>
        <CardHeader>
          <CardTitle>İşlem Geçmişi</CardTitle>
          <CardDescription>Son {cashTransactions.length} kasa işlemi</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">Tutar</TableHead>
                <TableHead>Fiş No</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead>Durum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cashTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Henüz işlem yok
                  </TableCell>
                </TableRow>
              ) : (
                cashTransactions.map((transaction) => (
                  <TableRow key={transaction._id}>
                    <TableCell>
                      {format(new Date(transaction.transaction_date), 'dd MMM yyyy HH:mm', {
                        locale: tr,
                      })}
                    </TableCell>
                    <TableCell>
                      {transaction.record_type === 'income' ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Giriş
                        </Badge>
                      ) : (
                        <Badge variant="default" className="bg-red-100 text-red-800">
                          Çıkış
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{transaction.category}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {transaction.receipt_number || '-'}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {transaction.description}
                    </TableCell>
                    <TableCell>
                      <Badge variant={transaction.status === 'approved' ? 'default' : 'secondary'}>
                        {transaction.status === 'approved' ? 'Onaylı' : 'Beklemede'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
