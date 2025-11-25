'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, CreditCard, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { appwriteBankAccounts } from '@/lib/appwrite/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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

interface BankAccountsManagerProps {
  beneficiaryId: string;
}

export function BankAccountsManager({ beneficiaryId }: BankAccountsManagerProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    bankName: '',
    accountHolder: '',
    iban: '',
    currency: 'TRY' as 'TRY' | 'USD' | 'EUR',
    status: 'active' as 'active' | 'inactive' | 'closed',
    notes: '',
  });

  const { data: accountsData, isLoading } = useQuery({
    queryKey: ['bank-accounts', beneficiaryId],
    queryFn: async () => {
      const response = await appwriteBankAccounts.list({ beneficiary_id: beneficiaryId });
      return response.documents || [];
    },
    enabled: !!beneficiaryId,
    placeholderData: [],
  });

  const accounts = accountsData || [];

  const createMutation = useMutation({
    mutationFn: async () => {
      return await appwriteBankAccounts.create({
        beneficiary_id: beneficiaryId,
        bank_name: formData.bankName,
        account_holder: formData.accountHolder,
        account_number: '', // Empty default
        iban: formData.iban || undefined,
        branch_name: undefined,
        branch_code: undefined,
        account_type: 'checking', // Default to checking
        currency: formData.currency,
        is_primary: false, // Default to false
        status: formData.status,
        notes: formData.notes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts', beneficiaryId] });
      toast.success('Banka hesabı başarıyla eklendi');
      setShowForm(false);
      setFormData({
        bankName: '',
        accountHolder: '',
        iban: '',
        currency: 'TRY',
        status: 'active',
        notes: '',
      });
    },
    onError: () => toast.error('Banka hesabı eklenirken hata oluştu'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (accountId: string) => {
      return await appwriteBankAccounts.remove(accountId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts', beneficiaryId] });
      toast.success('Banka hesabı silindi');
    },
    onError: () => toast.error('Silme işlemi başarısız'),
  });

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: 'Aktif',
      inactive: 'Pasif',
      closed: 'Kapatıldı',
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Banka Hesapları</h3>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Yeni Hesap
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Yeni Banka Hesabı</DialogTitle>
              <DialogDescription>Banka hesabı bilgilerini girin</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Banka Adı *</Label>
                  <Input
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="Örn: Ziraat Bankası"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hesap Sahibi *</Label>
                  <Input
                    value={formData.accountHolder}
                    onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>IBAN</Label>
                <Input
                  value={formData.iban}
                  onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                  placeholder="TR00 0000 0000 0000 0000 0000 00"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Para Birimi</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(v: 'TRY' | 'USD' | 'EUR') => setFormData({ ...formData, currency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRY">TRY</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Durum</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v: 'active' | 'inactive' | 'closed') => setFormData({ ...formData, status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="inactive">Pasif</SelectItem>
                      <SelectItem value="closed">Kapatıldı</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notlar</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  placeholder="Ek notlar..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  İptal
                </Button>
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={
                    createMutation.isPending || !formData.bankName || !formData.accountHolder
                  }
                >
                  {createMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Kaydet'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : accounts && accounts.length > 0 ? (
        <div className="space-y-2">
          {accounts.map((account: { _id?: string; $id?: string; bank_name?: string; account_holder?: string; iban?: string; currency?: string; status?: string; notes?: string; [key: string]: unknown }) => {
            const accountId = account._id || account.$id || '';
            return (
            <Card key={accountId} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{account.bank_name}</span>
                      <Badge variant="secondary">{getStatusLabel(account.status || 'active')}</Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground">
                        Hesap Sahibi: {account.account_holder}
                      </p>
                      {account.iban && (
                        <p className="text-muted-foreground">IBAN: {account.iban}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{account.currency}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(accountId)}
                    disabled={deleteMutation.isPending}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Henüz banka hesabı bulunmuyor</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
