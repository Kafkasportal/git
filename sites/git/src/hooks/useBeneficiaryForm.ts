/**
 * Beneficiary Form Hook
 * Extracted form logic for better organization
 */

import React, { useState, useCallback } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, UseMutationResult } from '@tanstack/react-query';
import logger from '@/lib/logger';

import { docSchema, type FormValues } from '@/types/beneficiary-form';
import { beneficiaries } from '@/lib/api/crud-factory';
import type { BeneficiaryDocument } from '@/types/database';

/**
 * Mernis TC validation response type
 */
interface MernisValidationResponse {
  valid: boolean;
}

/**
 * Beneficiary form hook return type
 */
interface UseBeneficiaryFormReturn {
  // Form
  form: UseFormReturn<FormValues>;
  onSubmit: (data: FormValues) => void;
  resetForm: () => void;

  // State
  openModal: string | null;
  setOpenModal: (modal: string | null) => void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  selectedDistrict: string;
  setSelectedDistrict: (district: string) => void;
  selectedNeighborhood: string;
  setSelectedNeighborhood: (neighborhood: string) => void;
  selectedDiseaseCategory: string;
  setSelectedDiseaseCategory: (category: string) => void;

  // Data
  beneficiary: BeneficiaryDocument | undefined;
  isLoading: boolean;
  error: Error | null;

  // Mutations
  updateMutation: UseMutationResult<unknown, Error, FormValues, unknown>;
  deleteMutation: UseMutationResult<void, Error, void, unknown>;

  // Handlers
  handleDelete: () => void;
  handleMernisCheck: () => Promise<void>;
}

/**
 * Stub function for Mernis TC Kimlik validation
 */
const checkMernis = async (tcNo: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/mernis/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tc_no: tcNo }),
    });

    if (!response.ok) {
      throw new Error('Mernis validation failed');
    }

    const data = (await response.json()) as MernisValidationResponse;
    return data.valid;
  } catch (error) {
    logger.error('Mernis validation error:', error);
    return false;
  }
};

/**
 * Hook for managing beneficiary form state and mutations
 */
export function useBeneficiaryForm(beneficiaryId: string): UseBeneficiaryFormReturn {
  const router = useRouter();

  // Form state
  const [openModal, setOpenModal] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('');
  const [selectedDiseaseCategory, setSelectedDiseaseCategory] = useState<string>('');

  // React Hook Form
  const form = useForm<FormValues>({
    resolver: zodResolver(docSchema),
    mode: 'onChange',
  });

  // Fetch beneficiary data
  const {
    data: beneficiary,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['beneficiary', beneficiaryId],
    queryFn: async () => {
      const response = await beneficiaries.getById(beneficiaryId);
      return response.data as BeneficiaryDocument;
    },
  });

  // Populate form when data is available
  React.useEffect(() => {
    if (beneficiary) {
      // Split name into first and last name if possible
      // Note: This assumes Western naming convention (first name space last name)
      // For names with multiple words, first word = first name, rest = surname
      const nameParts = beneficiary.name ? beneficiary.name.trim().split(/\s+/) : [''];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      form.reset({
        name: firstName,
        surname: lastName,
        tc_no: beneficiary.tc_no || '',
        phone: beneficiary.phone || '',
        email: beneficiary.email || '',
        address: beneficiary.address || '',
        city: beneficiary.city || '',
        district: beneficiary.district || '',
        neighborhood: beneficiary.neighborhood || '',
        postal_code: '', // postal_code field doesn't exist in BeneficiaryDocument
        birth_date: beneficiary.birth_date || '',
        gender: beneficiary.gender || '',
        marital_status: beneficiary.marital_status || '',
        education_status: beneficiary.education_level || '', // use education_level
        occupation: beneficiary.occupation || '',
        blood_type: '', // blood_type field doesn't exist in BeneficiaryDocument
        chronic_disease: beneficiary.chronic_illness_detail || '', // use chronic_illness_detail
        disease_category: '', // disease_category field doesn't exist in BeneficiaryDocument
        disability_status: beneficiary.has_disability ? 'var' : 'yok', // convert boolean to string
        disability_percentage: '', // disability_percentage field doesn't exist in BeneficiaryDocument
        contact_preference: beneficiary.contact_preference || '',
      });

      // Set dropdown selections
      if (beneficiary.city) setSelectedCity(beneficiary.city);
      if (beneficiary.district) setSelectedDistrict(beneficiary.district);
      if (beneficiary.neighborhood) setSelectedNeighborhood(beneficiary.neighborhood);
      // disease_category doesn't exist in BeneficiaryDocument
    }
  }, [beneficiary, form]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Merge name and surname into the name field for the backend
      // Ensure at least name exists (surname is optional)
      const fullName = `${data.name} ${data.surname || ''}`.trim();

      if (!fullName) {
        throw new Error('Ad gerekli');
      }

      const updateData = {
        ...data,
        name: fullName,
      };
      const response = await beneficiaries.update(beneficiaryId, updateData);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Başvuru sahibi bilgileri güncellendi');
    },
    onError: (error) => {
      toast.error('Güncelleme başarısız oldu');
      logger.error('Update error:', error);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await beneficiaries.delete(beneficiaryId);
    },
    onSuccess: () => {
      toast.success('Başvuru sahibi silindi');
      router.push('/yardim/ihtiyac-sahipleri');
    },
    onError: (error) => {
      toast.error('Silme işlemi başarısız oldu');
      logger.error('Delete error:', error);
    },
  });

  // Form handlers with useCallback for optimization
  const onSubmit = useCallback(
    (data: FormValues): void => {
      updateMutation.mutate(data);
    },
    [updateMutation]
  );

  const handleDelete = useCallback((): void => {
    if (confirm('Bu başvuru sahibini silmek istediğinizden emin misiniz?')) {
      deleteMutation.mutate();
    }
  }, [deleteMutation]);

  const handleMernisCheck = useCallback(async (): Promise<void> => {
    const tcNo = form.getValues('tc_no');
    if (!tcNo || tcNo.length !== 11) {
      toast.error('Geçerli TC Kimlik No giriniz');
      return;
    }

    const isValid = await checkMernis(tcNo);
    if (isValid) {
      toast.success('TC Kimlik No doğrulandı');
    } else {
      toast.error('TC Kimlik No geçersiz');
    }
  }, [form]);

  // Reset form
  const resetForm = useCallback((): void => {
    form.reset();
    setSelectedCity('');
    setSelectedDistrict('');
    setSelectedNeighborhood('');
    setSelectedDiseaseCategory('');
  }, [form]);

  return {
    // Form
    form,
    onSubmit,
    resetForm,

    // State
    openModal,
    setOpenModal,
    selectedCity,
    setSelectedCity,
    selectedDistrict,
    setSelectedDistrict,
    selectedNeighborhood,
    setSelectedNeighborhood,
    selectedDiseaseCategory,
    setSelectedDiseaseCategory,

    // Data
    beneficiary,
    isLoading,
    error,

    // Mutations
    updateMutation,
    deleteMutation,

    // Handlers
    handleDelete,
    handleMernisCheck,
  };
}
