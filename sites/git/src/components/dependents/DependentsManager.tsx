'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, Trash2, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { appwriteDependents } from '@/lib/appwrite/api';
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

interface DependentsManagerProps {
  beneficiaryId: string;
}

export function DependentsManager({ beneficiaryId }: DependentsManagerProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    relationship: 'child',
    birthDate: '',
    gender: '',
    tcNo: '',
    phone: '',
    educationLevel: '',
    occupation: '',
    healthStatus: '',
    hasDisability: false,
    disabilityDetail: '',
    monthlyIncome: '',
    notes: '',
  });

  const { data: dependentsData, isLoading } = useQuery({
    queryKey: ['dependents', beneficiaryId],
    queryFn: async () => {
      const response = await appwriteDependents.list({ beneficiary_id: beneficiaryId });
      return response.documents || [];
    },
    enabled: !!beneficiaryId,
    placeholderData: [],
  });

  const dependents = dependentsData || [];

  const createMutation = useMutation({
    mutationFn: async () => {
      return await appwriteDependents.create({
        beneficiary_id: beneficiaryId,
        name: formData.name,
        relationship: formData.relationship,
        birth_date: formData.birthDate || undefined,
        gender: formData.gender || undefined,
        tc_no: formData.tcNo || undefined,
        phone: formData.phone || undefined,
        education_level: formData.educationLevel || undefined,
        occupation: formData.occupation || undefined,
        health_status: formData.healthStatus || undefined,
        has_disability: formData.hasDisability,
        disability_detail: formData.disabilityDetail || undefined,
        monthly_income: formData.monthlyIncome ? parseFloat(formData.monthlyIncome) : undefined,
        notes: formData.notes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dependents', beneficiaryId] });
      toast.success('Bağımlı kişi başarıyla eklendi');
      setShowForm(false);
      setFormData({
        name: '',
        relationship: 'child',
        birthDate: '',
        gender: '',
        tcNo: '',
        phone: '',
        educationLevel: '',
        occupation: '',
        healthStatus: '',
        hasDisability: false,
        disabilityDetail: '',
        monthlyIncome: '',
        notes: '',
      });
    },
    onError: () => toast.error('Bağımlı kişi eklenirken hata oluştu'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (dependentId: string) => {
      return await appwriteDependents.remove(dependentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dependents', beneficiaryId] });
      toast.success('Bağımlı kişi silindi');
    },
    onError: () => toast.error('Silme işlemi başarısız'),
  });

  const getRelationshipLabel = (relationship: string) => {
    const labels: Record<string, string> = {
      spouse: 'Eş',
      child: 'Çocuk',
      parent: 'Ebeveyn',
      sibling: 'Kardeş',
      other: 'Diğer',
    };
    return labels[relationship] || relationship;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Baktığı Kişiler</h3>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Yeni Kişi
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Yeni Bağımlı Kişi</DialogTitle>
              <DialogDescription>Bağımlı kişi bilgilerini girin</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ad Soyad *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Yakınlık Derecesi *</Label>
                  <Select
                    value={formData.relationship}
                    onValueChange={(v) => setFormData({ ...formData, relationship: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spouse">Eş</SelectItem>
                      <SelectItem value="child">Çocuk</SelectItem>
                      <SelectItem value="parent">Ebeveyn</SelectItem>
                      <SelectItem value="sibling">Kardeş</SelectItem>
                      <SelectItem value="other">Diğer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Doğum Tarihi</Label>
                  <Input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => {
                      setFormData({ ...formData, birthDate: e.target.value });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cinsiyet</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(v) => {
                      setFormData({ ...formData, gender: v });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ERKEK">Erkek</SelectItem>
                      <SelectItem value="KADIN">Kadın</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>TC Kimlik No</Label>
                  <Input
                    value={formData.tcNo}
                    onChange={(e) => {
                      setFormData({ ...formData, tcNo: e.target.value });
                    }}
                    maxLength={11}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Telefon</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Eğitim Durumu</Label>
                  <Input
                    value={formData.educationLevel}
                    onChange={(e) => {
                      setFormData({ ...formData, educationLevel: e.target.value });
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Meslek</Label>
                  <Input
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Aylık Gelir (TL)</Label>
                  <Input
                    type="number"
                    value={formData.monthlyIncome}
                    onChange={(e) => setFormData({ ...formData, monthlyIncome: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Sağlık Durumu</Label>
                <Input
                  value={formData.healthStatus}
                  onChange={(e) => setFormData({ ...formData, healthStatus: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Engellilik Detayı</Label>
                <Textarea
                  value={formData.disabilityDetail}
                  onChange={(e) => {
                    setFormData({ ...formData, disabilityDetail: e.target.value });
                  }}
                  rows={2}
                  placeholder="Engellilik durumu detayları..."
                />
              </div>
              <div className="space-y-2">
                <Label>Notlar</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => {
                    setFormData({ ...formData, notes: e.target.value });
                  }}
                  rows={2}
                  placeholder="Ek notlar..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  İptal
                </Button>
                <Button
                  onClick={() => {
                    createMutation.mutate();
                  }}
                  disabled={createMutation.isPending || !formData.name}
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
      ) : dependents && dependents.length > 0 ? (
        <div className="space-y-2">
          {dependents.map((dependent: { _id?: string; $id?: string; [key: string]: unknown }) => {
            const dependentId = dependent._id || dependent.$id || '';
            return (
            <Card key={dependentId} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{String(dependent.name || '')}</span>
                      <Badge variant="secondary">
                        {getRelationshipLabel(String(dependent.relationship || ''))}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {Boolean(dependent.birth_date) && (
                        <p>Doğum: {new Date(String(dependent.birth_date)).toLocaleDateString('tr-TR')}</p>
                      )}
                      {Boolean(dependent.tc_no) && <p>TC: {String(dependent.tc_no)}</p>}
                      {Boolean(dependent.phone) && <p>Telefon: {String(dependent.phone)}</p>}
                      {Boolean(dependent.education_level) && <p>Eğitim: {String(dependent.education_level)}</p>}
                      {Boolean(dependent.occupation) && <p>Meslek: {String(dependent.occupation)}</p>}
                      {Boolean(dependent.monthly_income) && (
                        <p>Gelir: {Number(dependent.monthly_income).toLocaleString('tr-TR')} ₺</p>
                      )}
                      {Boolean(dependent.has_disability) && (
                        <p className="text-orange-600">Engellilik durumu var</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(dependentId)}
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
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Henüz bağımlı kişi bulunmuyor</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
