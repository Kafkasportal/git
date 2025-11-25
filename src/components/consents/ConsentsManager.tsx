'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FileSignature, CheckCircle2, XCircle, Clock, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { appwriteConsents } from '@/lib/appwrite/api';
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

interface ConsentsManagerProps {
  beneficiaryId: string;
}

export function ConsentsManager({ beneficiaryId }: ConsentsManagerProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    consentType: 'data_processing',
    consentText: '',
    status: 'active' as 'active' | 'revoked' | 'expired',
    signedAt: new Date().toISOString().split('T')[0],
    signedBy: '',
    expiresAt: '',
    notes: '',
  });

  const { data: consentsData, isLoading } = useQuery({
    queryKey: ['consents', beneficiaryId],
    queryFn: async () => {
      const response = await appwriteConsents.list({ beneficiary_id: beneficiaryId });
      return response.documents || [];
    },
    enabled: !!beneficiaryId,
    placeholderData: [],
  });

  const consents = consentsData || [];

  const createMutation = useMutation({
    mutationFn: async () => {
      return await appwriteConsents.create({
        beneficiary_id: beneficiaryId,
        consent_type: formData.consentType,
        consent_text: formData.consentText,
        status: formData.status,
        signed_at: formData.signedAt,
        signed_by: formData.signedBy || undefined,
        expires_at: formData.expiresAt || undefined,
        notes: formData.notes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consents', beneficiaryId] });
      toast.success('Rıza beyanı başarıyla eklendi');
      setShowForm(false);
      setFormData({
        consentType: 'data_processing',
        consentText: '',
        status: 'active',
        signedAt: new Date().toISOString().split('T')[0],
        signedBy: '',
        expiresAt: '',
        notes: '',
      });
    },
    onError: () => toast.error('Rıza beyanı eklenirken hata oluştu'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (consentId: string) => {
      return await appwriteConsents.remove(consentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consents', beneficiaryId] });
      toast.success('Rıza beyanı silindi');
    },
    onError: () => toast.error('Silme işlemi başarısız'),
  });

  const getStatusBadge = (status: string) => {
    type IconComponent = React.ComponentType<{ className?: string }>;
    const variants: Record<
      string,
      { variant: 'default' | 'secondary' | 'destructive'; icon: IconComponent }
    > = {
      active: { variant: 'default', icon: CheckCircle2 },
      revoked: { variant: 'destructive', icon: XCircle },
      expired: { variant: 'secondary', icon: Clock },
    };
    const { variant, icon: Icon } = variants[status] || {
      variant: 'secondary',
      icon: CheckCircle2,
    };
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status === 'active' ? 'Aktif' : status === 'revoked' ? 'İptal Edildi' : 'Süresi Doldu'}
      </Badge>
    );
  };

  const getConsentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      data_processing: 'Veri İşleme',
      photo_usage: 'Fotoğraf Kullanımı',
      communication: 'İletişim',
      marketing: 'Pazarlama',
      other: 'Diğer',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Rıza Beyanları</h3>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Yeni Rıza Beyanı
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Yeni Rıza Beyanı</DialogTitle>
              <DialogDescription>Rıza beyanı bilgilerini girin</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Rıza Türü</Label>
                <Select
                  value={formData.consentType}
                  onValueChange={(v) => setFormData({ ...formData, consentType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="data_processing">Veri İşleme</SelectItem>
                    <SelectItem value="photo_usage">Fotoğraf Kullanımı</SelectItem>
                    <SelectItem value="communication">İletişim</SelectItem>
                    <SelectItem value="marketing">Pazarlama</SelectItem>
                    <SelectItem value="other">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Rıza Metni *</Label>
                <Textarea
                  value={formData.consentText}
                  onChange={(e) => {
                    setFormData({ ...formData, consentText: e.target.value });
                  }}
                  rows={4}
                  placeholder="Rıza beyanı metnini girin..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>İmza Tarihi *</Label>
                  <Input
                    type="date"
                    value={formData.signedAt}
                    onChange={(e) => setFormData({ ...formData, signedAt: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bitiş Tarihi</Label>
                  <Input
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>İmzalayan</Label>
                <Input
                  value={formData.signedBy}
                  onChange={(e) => setFormData({ ...formData, signedBy: e.target.value })}
                  placeholder="İmzalayan kişinin adı"
                />
              </div>
              <div className="space-y-2">
                <Label>Durum</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v: 'active' | 'revoked' | 'expired') => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="revoked">İptal Edildi</SelectItem>
                    <SelectItem value="expired">Süresi Doldu</SelectItem>
                  </SelectContent>
                </Select>
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
                  disabled={createMutation.isPending || !formData.consentText}
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
      ) : consents && consents.length > 0 ? (
        <div className="space-y-2">
          {consents.map((consent: { _id?: string; $id?: string; consent_type?: string; consent_text?: string; status?: string; signed_at?: string; signed_by?: string; expires_at?: string; notes?: string; [key: string]: unknown }) => {
            const consentId = consent._id || consent.$id || '';
            return (
            <Card key={consentId} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileSignature className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {getConsentTypeLabel(consent.consent_type || '')}
                      </span>
                      {getStatusBadge(consent.status || '')}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {consent.consent_text || ''}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>İmza: {consent.signed_at ? new Date(consent.signed_at).toLocaleDateString('tr-TR') : '-'}</span>
                      {consent.expires_at && (
                        <span>
                          Bitiş: {new Date(consent.expires_at).toLocaleDateString('tr-TR')}
                        </span>
                      )}
                      {consent.signed_by && <span>İmzalayan: {consent.signed_by}</span>}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(consentId)}
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
            <FileSignature className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Henüz rıza beyanı bulunmuyor</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
