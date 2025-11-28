/**
 * Beneficiary Form Wizard
 * 927 satırlık AdvancedBeneficiaryForm'un refactor edilmiş versiyonu
 * Küçük, yönetilebilir step'lere bölünmüş
 */

'use client';

import { useState } from 'react';
import { useForm, FormProvider, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { FormError } from '@/components/errors/FormError';

// Import step components
import { PersonalInfoStep } from './beneficiary-steps/PersonalInfoStep';
import { AddressInfoStep } from './beneficiary-steps/AddressInfoStep';
import { FamilyInfoStep } from './beneficiary-steps/FamilyInfoStep';
import { FinancialInfoStep } from './beneficiary-steps/FinancialInfoStep';
import { HealthInfoStep } from './beneficiary-steps/HealthInfoStep';

// Import validation and types
import { beneficiarySchema, type BeneficiaryFormData } from '@/lib/validations/beneficiary';
import { apiClient as api } from '@/lib/api/api-client';
import { formatErrorMessage } from '@/lib/errors';
import type { CreateDocumentData, BeneficiaryDocument } from '@/types/database';

interface BeneficiaryFormWizardProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: Partial<BeneficiaryFormData>;
  isUpdateMode?: boolean;
  beneficiaryId?: string;
}

const FORM_STEPS = [
  { id: 'personal', title: 'Kişisel Bilgiler', component: PersonalInfoStep },
  { id: 'address', title: 'Adres Bilgileri', component: AddressInfoStep },
  { id: 'family', title: 'Aile Bilgileri', component: FamilyInfoStep },
  { id: 'financial', title: 'Maddi Durum', component: FinancialInfoStep },
  { id: 'health', title: 'Sağlık Durumu', component: HealthInfoStep },
] as const;

export function BeneficiaryFormWizard({
  onSuccess,
  onCancel,
  initialData,
  isUpdateMode = false,
  beneficiaryId,
}: BeneficiaryFormWizardProps) {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods = useForm<BeneficiaryFormData>({
    resolver: zodResolver(beneficiarySchema) as any,
    defaultValues: {
      mernisCheck: false,
      familyMemberCount: 1,
      children_count: 0,
      orphan_children_count: 0,
      elderly_count: 0,
      disabled_count: 0,
      has_debt: false,
      has_vehicle: false,
      hasChronicIllness: false,
      hasDisability: false,
      has_health_insurance: false,
      previous_aid: false,
      other_organization_aid: false,
      emergency: false,
      ...initialData,
    },
  });

  const { handleSubmit, trigger } = methods;

  // CREATE MUTATION
  const createMutation = useMutation({
    mutationFn: (data: BeneficiaryFormData) => {
      const beneficiaryData: CreateDocumentData<BeneficiaryDocument> = {
        name: `${data.firstName} ${data.lastName}`.trim(),
        tc_no: data.identityNumber || '',
        phone: data.mobilePhone || '',
        address: data.address || '',
        city: data.city || '',
        district: data.district || '',
        neighborhood: data.neighborhood || '',
        family_size: data.familyMemberCount || 1,
        email: data.email,
        birth_date: data.birthDate,
        gender: data.gender,
        nationality: data.nationality,
        religion: data.religion,
        marital_status: data.maritalStatus,
        children_count: data.children_count,
        orphan_children_count: data.orphan_children_count,
        elderly_count: data.elderly_count,
        disabled_count: data.disabled_count,
        income_level: data.income_level,
        income_source: data.incomeSources?.join(', '),
        has_debt: data.has_debt,
        housing_type: data.livingPlace,
        has_vehicle: data.has_vehicle,
        health_status: data.hasChronicIllness ? 'chronic' : undefined,
        has_chronic_illness: data.hasChronicIllness,
        chronic_illness_detail: data.chronicIllnessDetail,
        has_disability: data.hasDisability,
        disability_detail: data.disabilityDetail,
        has_health_insurance: data.has_health_insurance,
        education_level: data.educationLevel,
        occupation: data.occupation,
        employment_status: data.employment_status,
        aid_type: data.aidType,
        totalAidAmount: data.totalAidAmount,
        aid_duration: data.aid_duration,
        priority: data.priority,
        reference_name: data.referenceName,
        reference_phone: data.referencePhone,
        reference_relation: data.referenceRelation,
        notes: data.notes,
        previous_aid: data.previous_aid,
        other_organization_aid: data.other_organization_aid,
        emergency: data.emergency,
        contact_preference: data.contactPreference,
        status: 'AKTIF',
        approval_status: 'pending',
      };

      return api.beneficiaries.createBeneficiary(beneficiaryData);
    },
    onSuccess: () => {
      toast.success('İhtiyaç sahibi başarıyla eklendi');
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
      onSuccess?.();
    },
    onError: (err: unknown) => {
      const error = err as Error;
      const userMessage = formatErrorMessage(error);
      toast.error(`İhtiyaç sahibi eklenirken hata oluştu: ${userMessage}`);
    },
  });

  // Handle step navigation
  const nextStep = async () => {
    const stepFields = getFieldsForStep(currentStep);
    const isValid = await trigger(stepFields);

    if (isValid && currentStep < FORM_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Get fields to validate for current step
  const getFieldsForStep = (step: number): (keyof BeneficiaryFormData)[] => {
    switch (step) {
      case 0: // Personal Info
        return ['firstName', 'lastName', 'identityNumber', 'mobilePhone'];
      case 1: // Address Info
        return ['address', 'city', 'district', 'neighborhood'];
      case 2: // Family Info
        return ['familyMemberCount'];
      case 3: // Financial Info
        return []; // Optional fields
      case 4: // Health Info
        return []; // Optional fields
      default:
        return [];
    }
  };

  // UPDATE MUTATION
  const updateMutation = useMutation({
    mutationFn: (data: BeneficiaryFormData) => {
      if (!beneficiaryId) {
        throw new Error('Beneficiary ID is required for update');
      }

      const updateData: Partial<BeneficiaryDocument> = {
        name: `${data.firstName} ${data.lastName}`.trim(),
        tc_no: data.identityNumber || '',
        phone: data.mobilePhone || '',
        address: data.address || '',
        city: data.city || '',
        district: data.district || '',
        neighborhood: data.neighborhood || '',
        family_size: data.familyMemberCount || 1,
        email: data.email,
        birth_date: data.birthDate,
        gender: data.gender,
        nationality: data.nationality,
        religion: data.religion,
        marital_status: data.maritalStatus,
        children_count: data.children_count,
        orphan_children_count: data.orphan_children_count,
        elderly_count: data.elderly_count,
        disabled_count: data.disabled_count,
        income_level: data.income_level,
        income_source: data.incomeSources?.join(', '),
        has_debt: data.has_debt,
        housing_type: data.livingPlace,
        has_vehicle: data.has_vehicle,
        has_chronic_illness: data.hasChronicIllness,
        chronic_illness_detail: data.chronicIllnessDetail,
        has_disability: data.hasDisability,
        disability_detail: data.disabilityDetail,
        has_health_insurance: data.has_health_insurance,
        education_level: data.educationLevel,
        occupation: data.occupation,
        employment_status: data.employment_status,
        notes: data.notes,
        contact_preference: data.contactPreference,
      };

      return api.beneficiaries.updateBeneficiary(beneficiaryId, updateData);
    },
    onSuccess: () => {
      toast.success('İhtiyaç sahibi başarıyla güncellendi');
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
      queryClient.invalidateQueries({ queryKey: ['beneficiaries', beneficiaryId] });
      onSuccess?.();
    },
    onError: (err: unknown) => {
      const error = err as Error;
      const userMessage = formatErrorMessage(error);
      toast.error(`Güncelleme sırasında hata oluştu: ${userMessage}`);
    },
  });

  // Handle form submission
  const onSubmit: SubmitHandler<BeneficiaryFormData> = async (data) => {
    setIsSubmitting(true);
    try {
      if (isUpdateMode && beneficiaryId) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
    } catch (_error) {
      // Error is handled in mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = ((currentStep + 1) / FORM_STEPS.length) * 100;
  const CurrentStepComponent = FORM_STEPS[currentStep].component;

  return (
    <ErrorBoundary fallback={<FormError onClose={onCancel} />}>
      <FormProvider {...methods}>
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                Adım {currentStep + 1} / {FORM_STEPS.length}
              </span>
              <span>{Math.round(progress)}% tamamlandı</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Tabs */}
          <Tabs value={FORM_STEPS[currentStep].id} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              {FORM_STEPS.map((step, index) => (
                <TabsTrigger
                  key={step.id}
                  value={step.id}
                  disabled={index !== currentStep}
                  className="flex items-center gap-2"
                >
                  <span className="hidden sm:inline">{step.title}</span>
                  <span className="sm:hidden">Adım {index + 1}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={FORM_STEPS[currentStep].id} className="mt-6">
              <form onSubmit={handleSubmit(onSubmit)}>
                {/* Current Step Component */}
                <CurrentStepComponent isUpdateMode={isUpdateMode} />

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-6">
                  <div className="flex gap-2">
                    {currentStep > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={prevStep}
                        className="flex items-center gap-2"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Önceki
                      </Button>
                    )}
                    {onCancel && (
                      <Button type="button" variant="ghost" onClick={onCancel}>
                        İptal
                      </Button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {currentStep < FORM_STEPS.length - 1 ? (
                      <Button type="button" onClick={nextStep} className="flex items-center gap-2">
                        Sonraki
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-2"
                      >
                        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isUpdateMode ? 'Güncelle' : 'Kaydet'}
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </FormProvider>
    </ErrorBoundary>
  );
}
