'use client';

import { useForm } from 'react-hook-form';
import logger from '@/lib/logger';
import { zodResolver } from '@hookform/resolvers/zod';
import { studentFormSchema, type StudentFormValues } from '@/lib/validations/student';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useQuery } from '@tanstack/react-query';
import { scholarshipsApi } from '@/lib/api/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface StudentFormProps {
  initialData?: Partial<StudentFormValues>;
  onSubmit: (data: StudentFormValues) => Promise<void>;
  isLoading?: boolean;
}

export function StudentForm({ initialData, onSubmit, isLoading }: StudentFormProps) {
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema) as any,
    defaultValues: {
      applicant_name: initialData?.applicant_name || '',
      applicant_tc_no: initialData?.applicant_tc_no || '',
      applicant_phone: initialData?.applicant_phone || '',
      applicant_email: initialData?.applicant_email || '',
      university: initialData?.university || '',
      department: initialData?.department || '',
      grade_level: initialData?.grade_level || '',
      gpa: initialData?.gpa,
      scholarship_id: initialData?.scholarship_id || '',
      monthly_income: initialData?.monthly_income,
      family_income: initialData?.family_income,
      father_occupation: initialData?.father_occupation || '',
      mother_occupation: initialData?.mother_occupation || '',
      sibling_count: initialData?.sibling_count,
      is_orphan: initialData?.is_orphan ?? false,
      has_disability: initialData?.has_disability ?? false,
      essay: initialData?.essay || '',
    },
  });

  // Fetch active scholarships for selection
  const { data: scholarships, isLoading: isLoadingScholarships } = useQuery({
    queryKey: ['scholarships', 'active'],
    enabled: process.env.NODE_ENV !== 'test',
    queryFn: async () => {
      const res = await scholarshipsApi.list({ isActive: true });
      if (!res.success) throw new Error(res.error || 'Failed to fetch scholarships');
      return res.data;
    },
  });

  const handleSubmit = async (data: StudentFormValues) => {
    try {
      await onSubmit(data);
      form.reset();
    } catch (error) {
      logger.error('Form submission error', { error });
      toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 grid-cols-2 gap-4">
          {/* Kişisel Bilgiler */}
          <div className="col-span-2">
            <h3 className="text-lg font-medium mb-4">Kişisel Bilgiler</h3>
          </div>

          <FormField
            control={form.control}
            name="applicant_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ad Soyad</FormLabel>
                <FormControl>
                  <Input placeholder="Ad Soyad" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="applicant_tc_no"
            render={({ field }) => (
              <FormItem>
                <FormLabel>TC Kimlik No</FormLabel>
                <FormControl>
                  <Input placeholder="11 haneli TC No" maxLength={11} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="applicant_phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefon</FormLabel>
                <FormControl>
                  <Input placeholder="0555 555 55 55" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="applicant_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-posta</FormLabel>
                <FormControl>
                  <Input placeholder="ornek@email.com" type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Eğitim Bilgileri */}
          <div className="col-span-2 mt-4">
            <h3 className="text-lg font-medium mb-4">Eğitim Bilgileri</h3>
          </div>

          <FormField
            control={form.control}
            name="university"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Üniversite</FormLabel>
                <FormControl>
                  <Input placeholder="Üniversite Adı" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bölüm</FormLabel>
                <FormControl>
                  <Input placeholder="Bölüm Adı" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="grade_level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sınıf</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sınıf Seçiniz" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="hazirlik">Hazırlık</SelectItem>
                    <SelectItem value="1">1. Sınıf</SelectItem>
                    <SelectItem value="2">2. Sınıf</SelectItem>
                    <SelectItem value="3">3. Sınıf</SelectItem>
                    <SelectItem value="4">4. Sınıf</SelectItem>
                    <SelectItem value="5">5. Sınıf</SelectItem>
                    <SelectItem value="6">6. Sınıf</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gpa"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Not Ortalaması (GPA)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" max="4" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Burs Bilgileri */}
          <div className="col-span-2 mt-4">
            <h3 className="text-lg font-medium mb-4">Burs Başvurusu</h3>
          </div>

          <FormField
            control={form.control}
            name="scholarship_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Başvurulan Burs Programı</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          isLoadingScholarships ? 'Yükleniyor...' : 'Burs Programı Seçiniz'
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {scholarships?.map((scholarship: any) => (
                      <SelectItem key={scholarship.$id} value={scholarship.$id}>
                        {scholarship.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Aile ve Gelir Bilgileri */}
          <div className="col-span-2 mt-4">
            <h3 className="text-lg font-medium mb-4">Aile ve Gelir Durumu</h3>
          </div>

          <FormField
            control={form.control}
            name="monthly_income"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kişisel Aylık Gelir (TL)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="family_income"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Aile Aylık Gelir (TL)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sibling_count"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kardeş Sayısı</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="col-span-2 grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="is_orphan"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Yetim Durumu</FormLabel>
                    <FormDescription>Anne veya baba vefat etmiş mi?</FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="has_disability"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Engel Durumu</FormLabel>
                    <FormDescription>Herhangi bir engel durumu var mı?</FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>

          <div className="col-span-2">
            <FormField
              control={form.control}
              name="essay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Başvuru Yazısı / Notlar</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Kendinizi tanıtın ve neden bursa ihtiyacınız olduğunu anlatın..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Kaydet
          </Button>
        </div>
      </form>
    </Form>
  );
}
