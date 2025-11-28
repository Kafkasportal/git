/**
 * Advanced Beneficiary Form
 * Tab-based detailed form for beneficiary registration/update
 * Used in: /yardim/ihtiyac-sahipleri/[id] detail page
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient as api } from '@/lib/api/api-client';
import type { CreateDocumentData } from '@/types/database';
import type { BeneficiaryDocument } from '@/types/database';
import { toast } from 'sonner';
import {
  Loader2,
  User,
  MapPin,
  Users,
  Wallet,
  Heart,
  GraduationCap,
  HandHeart,
  UserCheck,
} from 'lucide-react';
import { ParameterSelect } from './ParameterSelect';

// Central validation schema
import { beneficiarySchema } from '@/lib/validations/beneficiary';

// Sanitization functions
import {
  sanitizeTcNo,
  sanitizePhone,
  sanitizeEmail,
  sanitizeObject,
  sanitizeNumber,
  sanitizeDate,
} from '@/lib/sanitization';

// Error handling
import { formatErrorMessage } from '@/lib/errors';
import logger from '@/lib/logger';

// Use central validation schema (mernisCheck is already included)
const advancedBeneficiarySchema = beneficiarySchema;

// Use central type with mernisCheck required
import type { BeneficiaryFormData } from '@/lib/validations/beneficiary';
type AdvancedBeneficiaryFormData = BeneficiaryFormData;

interface AdvancedBeneficiaryFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: Partial<AdvancedBeneficiaryFormData>;
  isUpdateMode?: boolean;
  updateMutation?: { mutateAsync: (data: AdvancedBeneficiaryFormData) => Promise<unknown> };
  beneficiaryId?: string;
}

export function AdvancedBeneficiaryForm({
  onSuccess,
  onCancel,
  initialData,
  isUpdateMode = false,
  updateMutation,
  beneficiaryId,
}: AdvancedBeneficiaryFormProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AdvancedBeneficiaryFormData>({
    resolver: zodResolver(advancedBeneficiarySchema) as any,
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

  const createBeneficiaryMutation = useMutation({
    mutationFn: (data: AdvancedBeneficiaryFormData) => {
      // Transform form data to API format (BeneficiaryDocument)
      const beneficiaryData: CreateDocumentData<BeneficiaryDocument> = {
        // Required fields
        name: `${data.firstName} ${data.lastName}`.trim(),
        tc_no: data.identityNumber || '',
        phone: data.mobilePhone || '',
        address: data.address || '',
        city: data.city || '',
        district: data.district || '',
        neighborhood: data.neighborhood || '',
        family_size: data.familyMemberCount || 1,

        // Optional fields
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
      void queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
      onSuccess?.();
    },
    onError: (err: unknown) => {
      const error = err as Error;
      // ✅ Enhanced error handling
      const userMessage = formatErrorMessage(error);
      toast.error(`İhtiyaç sahibi eklenirken hata oluştu: ${userMessage}`);
      logger.error('Create beneficiary failed', { error, userMessage });
    },
  });

  // UPDATE MUTATION (yeni - internal)
  const internalUpdateMutation = useMutation({
    mutationFn: (data: AdvancedBeneficiaryFormData) => {
      if (!beneficiaryId) throw new Error('Beneficiary ID bulunamadı');
      return api.beneficiaries.updateBeneficiary(beneficiaryId, data);
    },
    onSuccess: () => {
      toast.success('İhtiyaç sahibi başarıyla güncellendi');
      queryClient.invalidateQueries({ queryKey: ['beneficiary', beneficiaryId] });
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
      onSuccess?.();
    },
    onError: (err: unknown) => {
      const error = err as Error;
      // ✅ Enhanced error handling
      const userMessage = formatErrorMessage(error);
      toast.error(`İhtiyaç sahibi güncellenirken hata oluştu: ${userMessage}`);
      logger.error('Update beneficiary failed', { error, userMessage });
    },
  });

  // Sanitization helper function
  const sanitizeFormData = (data: AdvancedBeneficiaryFormData): AdvancedBeneficiaryFormData => {
    const sanitized = { ...data };

    // TC Kimlik No
    if (sanitized.identityNumber) {
      const cleanTc = sanitizeTcNo(sanitized.identityNumber);
      if (cleanTc) {
        sanitized.identityNumber = cleanTc;
      } else {
        // Invalid TC - validation should catch this, but double-check
        delete sanitized.identityNumber;
      }
    }

    // Phone numbers
    if (sanitized.mobilePhone) {
      const cleanPhone = sanitizePhone(sanitized.mobilePhone);
      sanitized.mobilePhone = cleanPhone || undefined;
    }

    if (sanitized.landlinePhone) {
      const cleanLandline = sanitizePhone(sanitized.landlinePhone);
      sanitized.landlinePhone = cleanLandline || undefined;
    }

    // Email
    if (sanitized.email) {
      const cleanEmail = sanitizeEmail(sanitized.email);
      sanitized.email = cleanEmail || undefined;
    }

    // Numbers (income, expense, amounts)
    if (sanitized.monthlyIncome !== undefined) {
      const cleanIncome = sanitizeNumber(sanitized.monthlyIncome);
      sanitized.monthlyIncome = cleanIncome !== null ? cleanIncome : undefined;
    }

    if (sanitized.monthlyExpense !== undefined) {
      const cleanExpense = sanitizeNumber(sanitized.monthlyExpense);
      sanitized.monthlyExpense = cleanExpense !== null ? cleanExpense : undefined;
    }

    if (sanitized.totalAidAmount !== undefined) {
      const cleanAmount = sanitizeNumber(sanitized.totalAidAmount);
      sanitized.totalAidAmount = cleanAmount !== null ? cleanAmount : undefined;
    }

    // Dates (convert to ISO strings if Date objects)
    const dateFields = [
      'birthDate',
      'identityIssueDate',
      'identityExpiryDate',
      'passportExpiryDate',
      'visaExpiryDate',
    ] as const;

    dateFields.forEach((field) => {
      // Type-safe property access to prevent object injection
      if (Object.prototype.hasOwnProperty.call(sanitized, field) && sanitized[field]) {
        const dateValue = sanitized[field];
        if (typeof dateValue === 'string') {
          // String tarih varsa ISO format'a çevir
          const cleanDate = sanitizeDate(dateValue);
          sanitized[field] = cleanDate ? cleanDate.toISOString().split('T')[0] : undefined;
        }
      }
    });

    // Emergency contacts - sanitize phone numbers
    if (sanitized.emergencyContacts && Array.isArray(sanitized.emergencyContacts)) {
      sanitized.emergencyContacts = sanitized.emergencyContacts.map(
        (contact: { name?: string; phone?: string; relation?: string }) => ({
          name: contact.name || '',
          relationship: contact.relation || '',
          phone: sanitizePhone(contact.phone || '') || contact.phone || '',
        })
      );
    }

    // Text fields - sanitize object (recursive)
    const textFields = [
      'notes',
      'additionalNotesTurkish',
      'additionalNotesEnglish',
      'additionalNotesArabic',
      'consentStatement',
      'healthProblem',
      'chronicIllnessDetail',
      'disabilityDetail',
      'jobDescription',
      'prosthetics',
      'surgeries',
      'healthNotes',
    ] as const;

    textFields.forEach((field) => {
      // Type-safe property access to prevent object injection
      if (
        Object.prototype.hasOwnProperty.call(sanitized, field) &&
        sanitized[field] &&
        typeof sanitized[field] === 'string'
      ) {
        const fieldValue = sanitized[field] as string;
        const sanitizedObj = sanitizeObject({ [field]: fieldValue }, { allowHtml: false });
        sanitized[field] = sanitizedObj[field];
      }
    });

    return sanitized;
  };

  const onSubmit = async (data: AdvancedBeneficiaryFormData) => {
    setIsSubmitting(true);

    try {
      // 1. Sanitize form data
      const sanitizedData = sanitizeFormData(data as AdvancedBeneficiaryFormData);

      // 2. Call mutation directly with sanitized data (no mapping needed since we use camelCase)
      if (isUpdateMode && updateMutation) {
        await updateMutation.mutateAsync(sanitizedData);
      } else if (isUpdateMode && beneficiaryId) {
        await internalUpdateMutation.mutateAsync(sanitizedData);
      } else {
        await createBeneficiaryMutation.mutateAsync(sanitizedData);
      }

      // Success handled by mutation onSuccess callback
    } catch (err: unknown) {
      const error = err as Error;
      // Enhanced error handling
      const userMessage = formatErrorMessage(error);
      toast.error(userMessage);
      logger.error('Form submission failed', { error, userMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle>Yeni İhtiyaç Sahibi Ekle</CardTitle>
        <CardDescription>
          Portal Plus tarzı kapsamlı kayıt formu - Tüm bilgileri girerek yeni kayıt oluşturun
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
              <TabsTrigger value="personal" className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Kişisel</span>
              </TabsTrigger>
              <TabsTrigger value="address" className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span className="hidden sm:inline">Adres</span>
              </TabsTrigger>
              <TabsTrigger value="family" className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Aile</span>
              </TabsTrigger>
              <TabsTrigger value="economic" className="flex items-center gap-1">
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline">Ekonomik</span>
              </TabsTrigger>
              <TabsTrigger value="health" className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">Sağlık</span>
              </TabsTrigger>
              <TabsTrigger value="education" className="flex items-center gap-1">
                <GraduationCap className="h-4 w-4" />
                <span className="hidden sm:inline">Eğitim</span>
              </TabsTrigger>
              <TabsTrigger value="aid" className="flex items-center gap-1">
                <HandHeart className="h-4 w-4" />
                <span className="hidden sm:inline">Yardım</span>
              </TabsTrigger>
              <TabsTrigger value="reference" className="flex items-center gap-1">
                <UserCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Referans</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Kişisel Bilgiler */}
            <TabsContent value="personal" className="space-y-4 mt-6">
              <h3 className="text-lg font-medium">Kişisel Bilgiler</h3>
              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Ad *</Label>
                  <Input
                    id="firstName"
                    data-testid="firstName"
                    {...register('firstName')}
                    placeholder="Ahmet"
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-600">{errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Soyad *</Label>
                  <Input
                    id="lastName"
                    data-testid="lastName"
                    {...register('lastName')}
                    placeholder="Yılmaz"
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-600">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="identityNumber">TC Kimlik No *</Label>
                  <Input
                    id="identityNumber"
                    data-testid="identityNumber"
                    {...register('identityNumber')}
                    placeholder="12345678901"
                    maxLength={11}
                  />
                  {errors.identityNumber && (
                    <p className="text-sm text-red-600">{errors.identityNumber.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mobilePhone">Telefon *</Label>
                  <Input
                    id="mobilePhone"
                    data-testid="mobilePhone"
                    {...register('mobilePhone')}
                    placeholder="0555 123 45 67"
                  />
                  {errors.mobilePhone && (
                    <p className="text-sm text-red-600">{errors.mobilePhone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-posta</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="ornek@email.com"
                  />
                  {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Doğum Tarihi</Label>
                  <Input
                    id="birthDate"
                    data-testid="birthDate"
                    type="date"
                    {...register('birthDate')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nationality">Uyruk</Label>
                  <Input id="nationality" {...register('nationality')} placeholder="Türkiye" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ParameterSelect
                  category="gender"
                  value={watch('gender')}
                  onChange={(value) => setValue('gender', value as any)}
                  label="Cinsiyet"
                  error={errors.gender?.message}
                />

                <ParameterSelect
                  category="religion"
                  value={watch('religion')}
                  onChange={(value) => setValue('religion', value as any)}
                  label="İnanç"
                  error={errors.religion?.message}
                />

                <ParameterSelect
                  category="marital_status"
                  value={watch('maritalStatus')}
                  onChange={(value) => setValue('maritalStatus', value as any)}
                  label="Medeni Durum"
                  error={errors.maritalStatus?.message}
                />
              </div>
            </TabsContent>

            {/* TAB 2: Adres Bilgileri */}
            <TabsContent value="address" className="space-y-4 mt-6">
              <h3 className="text-lg font-medium">Adres Bilgileri</h3>
              <Separator />

              <div className="space-y-2">
                <Label htmlFor="address">Adres *</Label>
                <Textarea
                  id="address"
                  {...register('address')}
                  placeholder="Mahalle, Cadde, Sokak, Bina No, Daire"
                  rows={3}
                />
                {errors.address && <p className="text-sm text-red-600">{errors.address.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Şehir *</Label>
                  <Input id="city" {...register('city')} placeholder="İstanbul" />
                  {errors.city && <p className="text-sm text-red-600">{errors.city.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="district">İlçe *</Label>
                  <Input id="district" {...register('district')} placeholder="Başakşehir" />
                  {errors.district && (
                    <p className="text-sm text-red-600">{errors.district.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Mahalle *</Label>
                  <Input id="neighborhood" {...register('neighborhood')} placeholder="Kayaşehir" />
                  {errors.neighborhood && (
                    <p className="text-sm text-red-600">{errors.neighborhood.message}</p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: Aile Bilgileri */}
            <TabsContent value="family" className="space-y-4 mt-6">
              <h3 className="text-lg font-medium">Aile Bilgileri</h3>
              <Separator />

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="familyMemberCount">Toplam Aile Büyüklüğü *</Label>
                  <Input
                    id="familyMemberCount"
                    data-testid="familyMemberCount"
                    type="number"
                    min={1}
                    {...register('familyMemberCount', { valueAsNumber: true })}
                  />
                  {errors.familyMemberCount && (
                    <p className="text-sm text-red-600">{errors.familyMemberCount.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="children_count">Çocuk Sayısı</Label>
                  <Input
                    id="children_count"
                    type="number"
                    min={0}
                    {...register('children_count', { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orphan_children_count">Yetim Çocuk Sayısı</Label>
                  <Input
                    id="orphan_children_count"
                    type="number"
                    min={0}
                    {...register('orphan_children_count', { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="elderly_count">Yaşlı Sayısı (65+)</Label>
                  <Input
                    id="elderly_count"
                    type="number"
                    min={0}
                    {...register('elderly_count', { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="disabled_count">Engelli Sayısı</Label>
                  <Input
                    id="disabled_count"
                    type="number"
                    min={0}
                    {...register('disabled_count', { valueAsNumber: true })}
                  />
                </div>
              </div>
            </TabsContent>

            {/* TAB 4: Ekonomik Durum */}
            <TabsContent value="economic" className="space-y-4 mt-6">
              <h3 className="text-lg font-medium">Ekonomik Durum</h3>
              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ParameterSelect
                  category="income_level"
                  value={watch('income_level')}
                  onChange={(value) => setValue('income_level', value)}
                  label="Gelir Düzeyi"
                  error={errors.income_level?.message}
                />

                <div className="space-y-2">
                  <Label htmlFor="incomeSources">Gelir Kaynağı</Label>
                  <Input
                    id="incomeSources"
                    {...register('incomeSources')}
                    placeholder="Maaş, Emekli Maaşı, Yardım..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ParameterSelect
                  category="housing_type"
                  value={watch('livingPlace')}
                  onChange={(value) => setValue('livingPlace', value as any)}
                  label="Konut Durumu"
                  error={errors.livingPlace?.message}
                />

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="has_debt"
                      checked={watch('has_debt') ?? false}
                      onCheckedChange={(checked) => setValue('has_debt', !!checked)}
                    />
                    <Label htmlFor="has_debt" className="cursor-pointer">
                      Borcu var
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="has_vehicle"
                      checked={watch('has_vehicle') ?? false}
                      onCheckedChange={(checked) => setValue('has_vehicle', !!checked)}
                    />
                    <Label htmlFor="has_vehicle" className="cursor-pointer">
                      Aracı var
                    </Label>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 5: Sağlık Bilgileri */}
            <TabsContent value="health" className="space-y-4 mt-6">
              <h3 className="text-lg font-medium">Sağlık Bilgileri</h3>
              <Separator />

              <div className="space-y-2">
                <Label htmlFor="healthProblem">Genel Sağlık Durumu</Label>
                <Textarea
                  id="healthProblem"
                  {...register('healthProblem')}
                  placeholder="Sağlık durumu hakkında genel bilgi..."
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasChronicIllness"
                  checked={watch('hasChronicIllness')}
                  onCheckedChange={(checked) => setValue('hasChronicIllness', checked as boolean)}
                />
                <Label htmlFor="hasChronicIllness" className="cursor-pointer">
                  Kronik hastalığı var
                </Label>
              </div>
              {/* Kronik Hastalık Detayı - Conditional */}
              {watch('hasChronicIllness') && (
                <>
                  <div className="col-span-full">
                    <Label>
                      Kronik Hastalık Detayı <span className="text-red-600">*</span>
                    </Label>
                    <Textarea
                      {...register('chronicIllnessDetail')}
                      placeholder="Kronik hastalık detaylarını girin"
                      rows={3}
                    />
                    {errors.chronicIllnessDetail && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.chronicIllnessDetail.message}
                      </p>
                    )}
                  </div>
                </>
              )}
            </TabsContent>

            {/* TAB 6: Eğitim ve İstihdam */}
            <TabsContent value="education" className="space-y-4 mt-6">
              <h3 className="text-lg font-medium">Eğitim ve İstihdam</h3>
              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ParameterSelect
                  category="education_level"
                  value={watch('educationLevel')}
                  onChange={(value) => setValue('educationLevel', value)}
                  label="Eğitim Düzeyi"
                  error={errors.educationLevel?.message}
                />

                <ParameterSelect
                  category="occupation"
                  value={watch('occupation')}
                  onChange={(value) => setValue('occupation', value)}
                  label="Meslek"
                  error={errors.occupation?.message}
                />

                <ParameterSelect
                  category="employment_status"
                  value={watch('employment_status')}
                  onChange={(value) => setValue('employment_status', value)}
                  label="İstihdam Durumu"
                  error={errors.employment_status?.message}
                />
              </div>
            </TabsContent>

            {/* TAB 7: Yardım Talebi */}
            <TabsContent value="aid" className="space-y-4 mt-6">
              <h3 className="text-lg font-medium">Yardım Talebi</h3>
              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="aidType">Yardım Türü</Label>
                  <Input
                    id="aidType"
                    {...register('aidType')}
                    placeholder="Nakdi, Gıda, Eğitim..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalAidAmount">Talep Edilen Miktar (₺)</Label>
                  <Input
                    id="totalAidAmount"
                    type="number"
                    min={0}
                    step={0.01}
                    {...register('totalAidAmount', { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                  {errors.totalAidAmount && (
                    <p className="text-sm text-red-600">{errors.totalAidAmount.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="aid_duration">Yardım Süresi</Label>
                  <Input
                    id="aid_duration"
                    {...register('aid_duration')}
                    placeholder="Geçici, Sürekli..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Öncelik Durumu</Label>
                  <Input
                    id="priority"
                    {...register('priority')}
                    placeholder="Acil, Normal, Düşük"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="emergency"
                    checked={watch('emergency')}
                    onCheckedChange={(checked) => setValue('emergency', checked as boolean)}
                  />
                  <Label htmlFor="emergency" className="cursor-pointer text-red-600 font-medium">
                    Acil durum - Öncelikli yardım gerekiyor
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="previous_aid"
                    checked={watch('previous_aid')}
                    onCheckedChange={(checked) => setValue('previous_aid', checked as boolean)}
                  />
                  <Label htmlFor="previous_aid" className="cursor-pointer">
                    Daha önce yardım aldı
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="other_organization_aid"
                    checked={watch('other_organization_aid')}
                    onCheckedChange={(checked) =>
                      setValue('other_organization_aid', checked as boolean)
                    }
                  />
                  <Label htmlFor="other_organization_aid" className="cursor-pointer">
                    Başka kuruluştan yardım alıyor
                  </Label>
                </div>
              </div>
            </TabsContent>

            {/* TAB 8: Referans Bilgileri */}
            <TabsContent value="reference" className="space-y-4 mt-6">
              <h3 className="text-lg font-medium">Referans ve Ek Bilgiler</h3>
              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="referenceName">Referans Kişi</Label>
                  <Input
                    id="referenceName"
                    {...register('referenceName')}
                    placeholder="Referans adı soyadı"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referencePhone">Referans Telefon</Label>
                  <Input
                    id="referencePhone"
                    {...register('referencePhone')}
                    placeholder="0555 123 45 67"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="referenceRelation">Referans İlişkisi</Label>
                  <Input
                    id="referenceRelation"
                    {...register('referenceRelation')}
                    placeholder="Akraba, Komşu, Dost..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="applicationSource">Başvuru Kaynağı</Label>
                  <Input
                    id="applicationSource"
                    {...register('applicationSource')}
                    placeholder="Nasıl duydu?"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPreference">İletişim Tercihi</Label>
                <Input
                  id="contactPreference"
                  {...register('contactPreference')}
                  placeholder="SMS, E-posta, Telefon..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notlar ve Özel Durumlar</Label>
                <Textarea
                  id="notes"
                  {...register('notes')}
                  placeholder="Ek bilgiler, özel durumlar, önemli notlar..."
                  rows={4}
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Form Actions */}
          <Separator />
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <Button
              type="submit"
              data-testid="saveButton"
              disabled={isSubmitting}
              className="flex-1 sm:flex-none"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                'İhtiyaç Sahibi Kaydet'
              )}
            </Button>

            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none"
                size="lg"
              >
                İptal
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
