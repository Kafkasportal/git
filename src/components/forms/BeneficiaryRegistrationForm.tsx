'use client';

import { useState, useCallback, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, X, ChevronRight, ChevronLeft, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';

import { BeneficiaryCategory, FundRegion, Gender, MaritalStatus, EducationStatus, Religion, BeneficiaryStatus, FileConnection } from '@/types/beneficiary';
import type { BeneficiaryFormData } from '@/lib/validations/beneficiary';
import { beneficiaries } from '@/lib/api/crud-factory';
import type { BeneficiaryDocument, CreateDocumentData } from '@/types/database';
import { getCities, getDistrictsByCity } from '@/lib/services/address-service';
import { BeneficiaryFormSummary } from './BeneficiaryFormSummary';

interface BeneficiaryRegistrationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Label mappings
const categoryLabels: Record<BeneficiaryCategory, string> = {
  [BeneficiaryCategory.YETIM_AILESI]: 'Yetim Ailesi',
  [BeneficiaryCategory.MULTECI_AILE]: 'Mülteci Aile',
  [BeneficiaryCategory.IHTIYAC_SAHIBI_AILE]: 'İhtiyaç Sahibi Aile',
  [BeneficiaryCategory.YETIM_COCUK]: 'Yetim Çocuk',
  [BeneficiaryCategory.MULTECI_COCUK]: 'Mülteci Çocuk',
  [BeneficiaryCategory.IHTIYAC_SAHIBI_COCUK]: 'İhtiyaç Sahibi Çocuk',
  [BeneficiaryCategory.YETIM_GENCLIK]: 'Yetim Gençlik',
  [BeneficiaryCategory.MULTECI_GENCLIK]: 'Mülteci Gençlik',
  [BeneficiaryCategory.IHTIYAC_SAHIBI_GENCLIK]: 'İhtiyaç Sahibi Gençlik',
};

const fundRegionLabels: Record<FundRegion, string> = {
  [FundRegion.AVRUPA]: 'Avrupa',
  [FundRegion.SERBEST]: 'Serbest',
};

const fileConnectionLabels: Record<FileConnection, string> = {
  [FileConnection.BAGIMSIZ]: 'Bağımsız',
  [FileConnection.PARTNER_KURUM]: 'Partner Kurum',
  [FileConnection.CALISMA_SAHASI]: 'Çalışma Sahası',
};

const genderLabels: Record<Gender, string> = {
  [Gender.ERKEK]: 'Erkek',
  [Gender.KADIN]: 'Kadın',
};

const maritalStatusLabels: Record<MaritalStatus, string> = {
  [MaritalStatus.BEKAR]: 'Bekar',
  [MaritalStatus.EVLI]: 'Evli',
  [MaritalStatus.BOŞANMIŞ]: 'Boşanmış',
  [MaritalStatus.DUL]: 'Dul',
};

const educationLabels: Record<EducationStatus, string> = {
  [EducationStatus.OKUMA_YAZMA_BILMIYOR]: 'Okuma Yazma Bilmiyor',
  [EducationStatus.OKUMA_YAZMA_BILIYOR]: 'Okuma Yazma Biliyor',
  [EducationStatus.ILKOKUL]: 'İlkokul',
  [EducationStatus.ORTAOKUL]: 'Ortaokul',
  [EducationStatus.LISE]: 'Lise',
  [EducationStatus.UNIVERSITE]: 'Üniversite',
  [EducationStatus.YUKSEK_LISANS]: 'Yüksek Lisans',
  [EducationStatus.DOKTORA]: 'Doktora',
};

const religionLabels: Record<Religion, string> = {
  [Religion.MUSLUMAN]: 'Müslüman',
  [Religion.HRISTIYAN]: 'Hristiyan',
  [Religion.YAHUDI]: 'Yahudi',
  [Religion.BUDIST]: 'Budist',
  [Religion.HINDU]: 'Hindu',
  [Religion.ATEIST]: 'Ateist',
  [Religion.DIGER]: 'Diğer',
};

// Get available cities from service
const availableCities = getCities();

export function BeneficiaryRegistrationForm({ open, onOpenChange }: BeneficiaryRegistrationFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [emergencyContacts, setEmergencyContacts] = useState<Array<{ name: string; relationship: string; phone: string }>>([]);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);

  const methods = useForm<BeneficiaryFormData>({
    mode: 'onBlur',
    defaultValues: {
      firstName: '',
      lastName: '',
      nationality: '',
      birthDate: '',
      identityNumber: '',
      mernisCheck: false,
      category: undefined,
      fundRegion: undefined,
      fileConnection: undefined,
      fileNumber: '',
      mobilePhone: '+90 000 000 0000',
      landlinePhone: '+90 000 000 0000',
      email: 'default@example.com',
      country: undefined,
      city: undefined,
      district: '',
      neighborhood: '',
      address: '',
      gender: undefined,
      maritalStatus: undefined,
      educationStatus: undefined,
      religion: undefined,
      monthlyIncome: 0,
      monthlyExpense: 0,
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
      status: BeneficiaryStatus.TASLAK,
    },
  });

  const { watch, setValue, reset, formState: { errors, isValid } } = methods;

  const watchedCategory = watch('category');
  const watchedFundRegion = watch('fundRegion');

  // Determine if showing refugee-specific fields
  const isRefugee = useMemo(() => {
    return watchedCategory?.includes('MULTECI') || false;
  }, [watchedCategory]);

  // Determine if showing child/youth specific fields
  const isChildOrYouth = useMemo(() => {
    return watchedCategory?.includes('COCUK') || watchedCategory?.includes('GENCLIK') || false;
  }, [watchedCategory]);

  const tabs = useMemo(() => [
    { id: 'basic', label: 'Temel Bilgiler', description: 'Kişisel bilgiler ve iletişim' },
    { id: 'identity', label: 'Kimlik Bilgileri', description: 'Kimlik ve adres bilgileri' },
    { id: 'personal', label: 'Kişisel Veriler', description: 'Eğitim, istihdam, gelir' },
    { id: 'health', label: 'Sağlık Durumu', description: 'Sağlık ve acil durum bilgileri' },
  ], []);

  const handleGenerateFileNumber = useCallback(() => {
    if (!watchedCategory || !watchedFundRegion) {
      toast.error('Önce kategori ve fon bölgesi seçiniz');
      return;
    }

    const prefix = watchedFundRegion === FundRegion.AVRUPA ? 'AV' : 'SR';
    const categoryCode = watchedCategory.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    const fileNumber = `${prefix}${categoryCode}${timestamp}`;

    setValue('fileNumber', fileNumber, { shouldValidate: true });
    toast.success('Dosya numarası oluşturuldu');
  }, [watchedCategory, watchedFundRegion, setValue]);

  const handleAddEmergencyContact = useCallback(() => {
    setEmergencyContacts((prev) => [
      ...prev,
      { name: '', relationship: '', phone: '' },
    ]);
  }, []);

  const handleRemoveEmergencyContact = useCallback((index: number) => {
    setEmergencyContacts((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleEmergencyContactChange = useCallback((index: number, field: 'name' | 'relationship' | 'phone', value: string) => {
    setEmergencyContacts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const onSubmit = async (data: BeneficiaryFormData) => {
    setIsLoading(true);
    try {
      // Map form data to BeneficiaryDocument structure
      const beneficiaryData: CreateDocumentData<BeneficiaryDocument> = {
        name: `${data.firstName} ${data.lastName}`,
        tc_no: data.identityNumber || '',
        phone: data.mobilePhone || '',
        email: data.email,
        birth_date: data.birthDate ? new Date(data.birthDate).toISOString() : undefined,
        gender: data.gender,
        nationality: data.nationality,
        religion: data.religion,
        marital_status: data.maritalStatus,
        
        // Address
        address: data.address || '',
        city: data.city || '',
        district: data.district || '',
        neighborhood: data.neighborhood || '',
        
        // Family info
        family_size: data.familyMemberCount || 1,
        children_count: data.children_count,
        orphan_children_count: data.orphan_children_count,
        elderly_count: data.elderly_count,
        disabled_count: data.disabled_count,
        
        // Economic
        income_level: data.income_level,
        has_debt: data.has_debt,
        has_vehicle: data.has_vehicle,
        
        // Health
        has_chronic_illness: data.hasChronicIllness,
        chronic_illness_detail: data.chronicIllnessDetail,
        has_disability: data.hasDisability,
        disability_detail: data.disabilityDetail,
        has_health_insurance: data.has_health_insurance,
        
        // Employment
        education_level: data.educationStatus,
        occupation: data.occupation,
        employment_status: data.employment_status,
        
        // Aid
        aid_type: data.aidType,
        totalAidAmount: data.totalAidAmount,
        aid_duration: data.aid_duration,
        priority: data.priority,
        
        // Reference
        reference_name: data.referenceName,
        reference_phone: data.referencePhone,
        reference_relation: data.referenceRelation,
        application_source: data.applicationSource,
        
        // Notes
        notes: data.notes || '',
        previous_aid: data.previous_aid,
        other_organization_aid: data.other_organization_aid,
        emergency: data.emergency,
        contact_preference: data.contactPreference,
        
        // Status
        status: 'AKTIF' as const,
      };

      const result = await beneficiaries.create(beneficiaryData);

      if (result.data) {
        toast.success('İhtiyaç sahibi başarıyla oluşturuldu');
        reset();
        setEmergencyContacts([]);
        onOpenChange(false);
        router.push(`/yardim/ihtiyac-sahipleri/${result.data._id}`);
      } else {
        toast.error(result.error || 'İhtiyaç sahibi oluşturulamadı');
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || 'İhtiyaç sahibi oluşturulurken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setEmergencyContacts([]);
    setActiveTab('basic');
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isLoading) {
      handleClose();
    } else if (newOpen) {
      onOpenChange(true);
    }
  };

  const tabs_count = tabs.length;
  const current_tab_index = tabs.findIndex((t) => t.id === activeTab);
  const canGoNext = current_tab_index < tabs_count - 1;
  const canGoPrev = current_tab_index > 0;

  const handleNextTab = () => {
    if (canGoNext) {
      setActiveTab(tabs[current_tab_index + 1].id);
    }
  };

  const handlePrevTab = () => {
    if (canGoPrev) {
      setActiveTab(tabs[current_tab_index - 1].id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-slate-900 dark:text-slate-100">
            <span>İhtiyaç Sahibi Kayıt Formu</span>
            <Button variant="ghost" size="sm" onClick={handleClose} disabled={isLoading}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="flex gap-6 w-full">
            {/* Main form section */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Progress indicator */}
              <div className="px-4 sm:px-6 pb-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex gap-2">
                  {tabs.map((tab, index) => (
                    <div key={tab.id} className="flex items-center flex-1">
                      <button
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 text-center py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                          activeTab === tab.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {tab.label}
                      </button>
                      {index < tabs.length - 1 && <div className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full mx-1" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full">
              <TabsContent value="basic" className="space-y-6 px-4 sm:px-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">Temel Bilgiler</h3>
                  
                  {/* Kategori */}
                  <div className="space-y-2">
                    <Label>Kategori *</Label>
                    <Select
                      value={watch('category') || ''}
                      onValueChange={(value) => setValue('category', value as BeneficiaryCategory, { shouldValidate: true })}
                    >
                      <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Kategori seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(categoryLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category && <p className="text-sm text-red-500">{errors.category.message}</p>}
                  </div>

                  {/* Category Info Alert */}
                  {watchedCategory && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                      {isRefugee && (
                        <p>🏠 <strong>Mülteci kategorisi:</strong> Ek kimlik ve geçiş bilgileri talep edilecektir.</p>
                      )}
                      {isChildOrYouth && (
                        <p>👶 <strong>Çocuk/Gençlik kategorisi:</strong> Vasi ve eğitim bilgileri talep edilecektir.</p>
                      )}
                      {!isRefugee && !isChildOrYouth && (
                        <p>✓ Standart ihtiyaç sahibi formu uygulanacaktır.</p>
                      )}
                    </div>
                  )}

                  {/* Ad Soyad */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Ad *</Label>
                      <Input
                        {...methods.register('firstName')}
                        placeholder="Ad"
                        disabled={isLoading}
                      />
                      {errors.firstName && <p className="text-sm text-red-500">{errors.firstName.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Soyad *</Label>
                      <Input
                        {...methods.register('lastName')}
                        placeholder="Soyad"
                        disabled={isLoading}
                      />
                      {errors.lastName && <p className="text-sm text-red-500">{errors.lastName.message}</p>}
                    </div>
                  </div>

                  {/* Uyruk */}
                  <div className="space-y-2">
                    <Label>Uyruk *</Label>
                    <Input
                      {...methods.register('nationality')}
                      placeholder="Uyruk"
                      disabled={isLoading}
                    />
                    {errors.nationality && <p className="text-sm text-red-500">{errors.nationality.message}</p>}
                  </div>

                  {/* Doğum Tarihi */}
                  <div className="space-y-2">
                    <Label>Doğum Tarihi</Label>
                    <DatePicker
                      value={watch('birthDate') ? new Date(watch('birthDate') as string) : undefined}
                      onChange={(date) => setValue('birthDate', date?.toISOString() || '', { shouldValidate: true })}
                      disabled={isLoading}
                    />
                    {errors.birthDate && <p className="text-sm text-red-500">{errors.birthDate.message}</p>}
                  </div>

                  {/* Kimlik No */}
                  <div className="space-y-2">
                    <Label>TC Kimlik No</Label>
                    <Input
                      {...methods.register('identityNumber')}
                      placeholder="11 haneli kimlik numarası"
                      maxLength={11}
                      disabled={isLoading}
                    />
                    {errors.identityNumber && <p className="text-sm text-red-500">{errors.identityNumber.message}</p>}
                  </div>

                  {/* Mernis Kontrolü */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="mernisCheck"
                      checked={watch('mernisCheck')}
                      onCheckedChange={(checked) => setValue('mernisCheck', !!checked)}
                      disabled={isLoading}
                    />
                    <Label htmlFor="mernisCheck">Mernis Kontrolü Yap</Label>
                  </div>

                  <Separator className="my-6" />

                  {/* Fon Bölgesi ve Dosya */}
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">Dosya Bilgileri</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fon Bölgesi *</Label>
                      <Select
                        value={watch('fundRegion') || ''}
                        onValueChange={(value) => setValue('fundRegion', value as FundRegion, { shouldValidate: true })}
                      >
                        <SelectTrigger className={errors.fundRegion ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(fundRegionLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.fundRegion && <p className="text-sm text-red-500">{errors.fundRegion.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label>Dosya Bağlantısı *</Label>
                      <Select
                        value={watch('fileConnection') || ''}
                        onValueChange={(value) => setValue('fileConnection', value as FileConnection, { shouldValidate: true })}
                      >
                        <SelectTrigger className={errors.fileConnection ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(fileConnectionLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.fileConnection && <p className="text-sm text-red-500">{errors.fileConnection.message}</p>}
                    </div>
                  </div>

                  {/* Dosya Numarası */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Dosya Numarası *</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateFileNumber}
                        disabled={!watchedCategory || !watchedFundRegion || isLoading}
                      >
                        Otomatik Oluştur
                      </Button>
                    </div>
                    <Input
                      {...methods.register('fileNumber')}
                      placeholder="Dosya numarası"
                      disabled={isLoading}
                    />
                    {errors.fileNumber && <p className="text-sm text-red-500">{errors.fileNumber.message}</p>}
                  </div>

                  <Separator className="my-6" />

                  {/* İletişim Bilgileri */}
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">İletişim Bilgileri</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cep Telefonu *</Label>
                      <Input
                        {...methods.register('mobilePhone')}
                        placeholder="+90 5XX XXX XXXX"
                        disabled={isLoading}
                      />
                      {errors.mobilePhone && <p className="text-sm text-red-500">{errors.mobilePhone.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label>E-posta</Label>
                      <Input
                        {...methods.register('email')}
                        placeholder="example@email.com"
                        type="email"
                        disabled={isLoading}
                      />
                      {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Identity Tab */}
              <TabsContent value="identity" className="space-y-6 px-4 sm:px-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">Adres Bilgileri</h3>

                  <div className="space-y-2">
                    <Label>Şehir</Label>
                    <Select
                      value={watch('city') || ''}
                      onValueChange={(value) => {
                        setValue('city', value as any, { shouldValidate: true });
                        // Load districts for selected city
                        const districts = getDistrictsByCity(value);
                        setAvailableDistricts(districts);
                        // Clear district field when city changes
                        setValue('district', '');
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Şehir seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCities.map((city) => (
                          <SelectItem key={city.value} value={city.value}>
                            {city.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>İlçe</Label>
                      <Select
                        value={watch('district') || ''}
                        onValueChange={(value) => setValue('district', value, { shouldValidate: true })}
                        disabled={availableDistricts.length === 0 || isLoading}
                      >
                        <SelectTrigger className={availableDistricts.length === 0 ? 'opacity-50' : ''}>
                          <SelectValue placeholder={availableDistricts.length === 0 ? 'Önce şehir seçiniz' : 'İlçe seçiniz'} />
                        </SelectTrigger>
                        {availableDistricts.length > 0 && (
                          <SelectContent>
                            {availableDistricts.map((district) => (
                              <SelectItem key={district} value={district}>
                                {district}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        )}
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Mahalle</Label>
                      <Input
                        {...methods.register('neighborhood')}
                        placeholder="Mahalle"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Adres</Label>
                    <textarea
                      {...methods.register('address')}
                      placeholder="Tam adres"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      disabled={isLoading}
                    />
                    {errors.address && <p className="text-sm text-red-500">{errors.address.message}</p>}
                  </div>

                  <Separator className="my-6" />

                  <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">Kimlik Bilgileri</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Baba Adı</Label>
                      <Input
                        {...methods.register('fatherName')}
                        placeholder="Baba adı"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Anne Adı</Label>
                      <Input
                        {...methods.register('motherName')}
                        placeholder="Anne adı"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Personal Tab */}
              <TabsContent value="personal" className="space-y-6 px-4 sm:px-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">Kişisel Bilgiler</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cinsiyet</Label>
                      <Select
                        value={watch('gender') || ''}
                        onValueChange={(value) => setValue('gender', value as Gender, { shouldValidate: true })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(genderLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Medeni Durum</Label>
                      <Select
                        value={watch('maritalStatus') || ''}
                        onValueChange={(value) => setValue('maritalStatus', value as MaritalStatus, { shouldValidate: true })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(maritalStatusLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Eğitim Seviyesi</Label>
                      <Select
                        value={watch('educationStatus') || ''}
                        onValueChange={(value) => setValue('educationStatus', value as EducationStatus, { shouldValidate: true })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(educationLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Din/İnanç</Label>
                      <Select
                        value={watch('religion') || ''}
                        onValueChange={(value) => setValue('religion', value as Religion, { shouldValidate: true })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(religionLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">Aile Bilgileri</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Ailede Toplam Kişi</Label>
                      <Input
                        {...methods.register('familyMemberCount', { valueAsNumber: true })}
                        type="number"
                        min={1}
                        max={20}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Çocuk Sayısı</Label>
                      <Input
                        {...methods.register('children_count', { valueAsNumber: true })}
                        type="number"
                        min={0}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Yetim Çocuk Sayısı</Label>
                      <Input
                        {...methods.register('orphan_children_count', { valueAsNumber: true })}
                        type="number"
                        min={0}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Yaşlı Sayısı</Label>
                      <Input
                        {...methods.register('elderly_count', { valueAsNumber: true })}
                        type="number"
                        min={0}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Engelli Sayısı</Label>
                    <Input
                      {...methods.register('disabled_count', { valueAsNumber: true })}
                      type="number"
                      min={0}
                      disabled={isLoading}
                    />
                  </div>

                  <Separator className="my-6" />

                  <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">Ekonomik Durum</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Aylık Gelir (₺)</Label>
                      <Input
                        {...methods.register('monthlyIncome', { valueAsNumber: true })}
                        type="number"
                        min={0}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Aylık Gider (₺)</Label>
                      <Input
                        {...methods.register('monthlyExpense', { valueAsNumber: true })}
                        type="number"
                        min={0}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Meslek</Label>
                    <Input
                      {...methods.register('occupation')}
                      placeholder="Meslek"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hasDebt"
                        checked={watch('has_debt')}
                        onCheckedChange={(checked) => setValue('has_debt', !!checked)}
                        disabled={isLoading}
                      />
                      <Label htmlFor="hasDebt">Borçlu</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hasVehicle"
                        checked={watch('has_vehicle')}
                        onCheckedChange={(checked) => setValue('has_vehicle', !!checked)}
                        disabled={isLoading}
                      />
                      <Label htmlFor="hasVehicle">Araç Sahibi</Label>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Health Tab */}
              <TabsContent value="health" className="space-y-6 px-4 sm:px-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">Sağlık Durumu</h3>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasChronicIllness"
                      checked={watch('hasChronicIllness')}
                      onCheckedChange={(checked) => setValue('hasChronicIllness', !!checked)}
                      disabled={isLoading}
                    />
                    <Label htmlFor="hasChronicIllness">Kronik Hastalık Var</Label>
                  </div>

                  {watch('hasChronicIllness') && (
                    <div className="space-y-2 pl-6 border-l-4 border-blue-500">
                      <Label>Kronik Hastalık Detayı</Label>
                      <Input
                        {...methods.register('chronicIllnessDetail')}
                        placeholder="Hastalık detayı"
                        disabled={isLoading}
                      />
                      {errors.chronicIllnessDetail && (
                        <p className="text-sm text-red-500">{errors.chronicIllnessDetail.message}</p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasDisability"
                      checked={watch('hasDisability')}
                      onCheckedChange={(checked) => setValue('hasDisability', !!checked)}
                      disabled={isLoading}
                    />
                    <Label htmlFor="hasDisability">Engelli</Label>
                  </div>

                  {watch('hasDisability') && (
                    <div className="space-y-2 pl-6 border-l-4 border-blue-500">
                      <Label>Engellilik Detayı</Label>
                      <Input
                        {...methods.register('disabilityDetail')}
                        placeholder="Engel türü"
                        disabled={isLoading}
                      />
                      {errors.disabilityDetail && (
                        <p className="text-sm text-red-500">{errors.disabilityDetail.message}</p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasHealthInsurance"
                      checked={watch('has_health_insurance')}
                      onCheckedChange={(checked) => setValue('has_health_insurance', !!checked)}
                      disabled={isLoading}
                    />
                    <Label htmlFor="hasHealthInsurance">Sağlık Sigortası Var</Label>
                  </div>

                  <Separator className="my-6" />

                  <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">Acil Durum İletişimi</h3>

                  {emergencyContacts.length > 0 && (
                    <div className="space-y-3">
                      {emergencyContacts.map((contact, index) => (
                        <Card key={index}>
                          <CardContent className="pt-6">
                            <div className="space-y-3">
                              <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-xs">Ad</Label>
                                  <Input
                                    value={contact.name}
                                    onChange={(e) =>
                                      handleEmergencyContactChange(index, 'name', e.target.value)
                                    }
                                    placeholder="Ad"
                                    disabled={isLoading}
                                  />
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-xs">Yakınlık Derecesi</Label>
                                  <Input
                                    value={contact.relationship}
                                    onChange={(e) =>
                                      handleEmergencyContactChange(index, 'relationship', e.target.value)
                                    }
                                    placeholder="Yakınlık"
                                    disabled={isLoading}
                                  />
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-xs">Telefon</Label>
                                  <div className="flex gap-2">
                                    <Input
                                      value={contact.phone}
                                      onChange={(e) =>
                                        handleEmergencyContactChange(index, 'phone', e.target.value)
                                      }
                                      placeholder="Telefon"
                                      disabled={isLoading}
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      onClick={() => handleRemoveEmergencyContact(index)}
                                      disabled={isLoading}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddEmergencyContact}
                    disabled={emergencyContacts.length >= 2 || isLoading}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Acil Durum İletişimi Ekle (Max 2)
                  </Button>

                  <Separator className="my-6" />

                  <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">İlave Bilgiler</h3>

                  <div className="space-y-2">
                    <Label>Notlar</Label>
                    <textarea
                      {...methods.register('notes')}
                      placeholder="Ek notlar..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={4}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="previousAid"
                      checked={watch('previous_aid')}
                      onCheckedChange={(checked) => setValue('previous_aid', !!checked)}
                      disabled={isLoading}
                    />
                    <Label htmlFor="previousAid">Daha Önce Yardım Aldı</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="otherOrgAid"
                      checked={watch('other_organization_aid')}
                      onCheckedChange={(checked) => setValue('other_organization_aid', !!checked)}
                      disabled={isLoading}
                    />
                    <Label htmlFor="otherOrgAid">Başka Kurumlardan Yardım Alıyor</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="emergency"
                      checked={watch('emergency')}
                      onCheckedChange={(checked) => setValue('emergency', !!checked)}
                      disabled={isLoading}
                    />
                    <Label htmlFor="emergency">Acil Durum</Label>
                  </div>
                </div>
              </TabsContent>
                </Tabs>
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-between px-4 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevTab}
                disabled={!canGoPrev || isLoading}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Geri
              </Button>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  İptal
                </Button>

                {canGoNext ? (
                  <Button
                    type="button"
                    onClick={handleNextTab}
                    disabled={isLoading}
                  >
                    İleri
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isLoading || !isValid}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Kaydediliyor...
                      </>
                    ) : (
                      'Kaydet'
                    )}
                  </Button>
                )}
              </div>
            </div>
            </div>

            {/* Sidebar - Summary */}
            <div className="flex w-80 flex-col border-l border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 p-4 overflow-y-auto">
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Kayıt Özeti</h3>
                <BeneficiaryFormSummary
                  data={{
                    firstName: watch('firstName'),
                    lastName: watch('lastName'),
                    category: watch('category'),
                    mobilePhone: watch('mobilePhone'),
                    city: watch('city'),
                    district: watch('district'),
                    fundRegion: watch('fundRegion'),
                    fileNumber: watch('fileNumber'),
                  }}
                />
              </div>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
