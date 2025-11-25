'use client';

import { use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AdvancedBeneficiaryForm } from '@/components/forms/AdvancedBeneficiaryForm';
import { apiClient as api } from '@/lib/api/api-client';
import type { BeneficiaryDocument } from '@/types/database';
import type { BeneficiaryFormData } from '@/lib/validations/beneficiary';

export default function BeneficiaryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch beneficiary data
  const {
    data: beneficiary,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['beneficiary', id],
    queryFn: async () => {
      const result = await api.beneficiaries.getBeneficiary(id);
      if (result.error) throw new Error(result.error);
      return result.data as BeneficiaryDocument;
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: BeneficiaryFormData) => {
      const result = await api.beneficiaries.updateBeneficiary(id, data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiary', id] });
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
      toast.success('İhtiyaç sahibi başarıyla güncellendi');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Güncelleme sırasında hata oluştu');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const result = await api.beneficiaries.deleteBeneficiary(id);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
      toast.success('İhtiyaç sahibi başarıyla silindi');
      router.push('/yardim/ihtiyac-sahipleri');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Silme sırasında hata oluştu');
    },
  });

  const handleDelete = () => {
    if (window.confirm('Bu ihtiyaç sahibini silmek istediğinize emin misiniz?')) {
      deleteMutation.mutate();
    }
  };

  const handleSuccess = () => {
    router.push('/yardim/ihtiyac-sahipleri');
  };

  const handleCancel = () => {
    router.push('/yardim/ihtiyac-sahipleri');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Yükleniyor...</span>
      </div>
    );
  }

  if (error || !beneficiary) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Hata</h2>
          <p className="text-muted-foreground">
            Başvuru sahibi bulunamadı veya yüklenirken hata oluştu.
          </p>
          <Button asChild className="mt-4">
            <Link href="/yardim/ihtiyac-sahipleri">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Listeye Dön
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Convert beneficiary data to form data format
  // Split name into firstName and lastName
  const nameParts = (beneficiary.name || '').split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const initialData: Partial<BeneficiaryFormData> = {
    firstName,
    lastName,
    identityNumber: beneficiary.tc_no || undefined,
    mobilePhone: beneficiary.phone || undefined,
    email: beneficiary.email || undefined,
    address: beneficiary.address || undefined,
    city: beneficiary.city as any,
    district: beneficiary.district || undefined,
    neighborhood: beneficiary.neighborhood || undefined,
    birthDate: beneficiary.birth_date || undefined,
    gender: beneficiary.gender as any,
    maritalStatus: beneficiary.marital_status as any,
    educationStatus: beneficiary.education_level as any,
    occupation: beneficiary.occupation || undefined,
    familyMemberCount: beneficiary.family_size || 1,
    notes: beneficiary.notes || undefined,
    mernisCheck: false,
    nationality: 'Türkiye',
    category: 'GENEL' as any,
    fundRegion: 'TR' as any,
    fileConnection: 'DERNEK' as any,
    fileNumber: beneficiary.tc_no || 'AUTO',
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" asChild>
            <Link href="/yardim/ihtiyac-sahipleri">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Listeye Dön
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{beneficiary.name}</h1>
            <p className="text-muted-foreground">İhtiyaç Sahibi Detayları</p>
          </div>
        </div>
        <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
          <Trash2 className="h-4 w-4 mr-2" />
          {deleteMutation.isPending ? 'Siliniyor...' : 'Sil'}
        </Button>
      </div>

      {/* Advanced Beneficiary Form */}
      <AdvancedBeneficiaryForm
        initialData={initialData}
        isUpdateMode={true}
        beneficiaryId={id}
        updateMutation={updateMutation}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}
