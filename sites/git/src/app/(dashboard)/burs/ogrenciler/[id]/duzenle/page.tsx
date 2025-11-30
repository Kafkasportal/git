'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scholarshipApplicationsApi } from '@/lib/api';
import { PageLayout } from '@/components/layouts/PageLayout';
import { StudentForm } from '@/components/forms/StudentForm';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { ScholarshipApplicationDocument } from '@/types/database';
import type { StudentFormValues } from '@/lib/validations/student';

export default function EditStudentPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const queryClient = useQueryClient();

  const {
    data: student,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['scholarship-application', id],
    queryFn: async () => {
      const res = await scholarshipApplicationsApi.get(id);
      if (!res.success) throw new Error(res.error || 'Failed to fetch student details');
      return res.data as ScholarshipApplicationDocument;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: StudentFormValues) => {
      const res = await scholarshipApplicationsApi.update(id, data);
      if (!res.success) throw new Error(res.error || 'Failed to update student');
      return res;
    },
    onSuccess: () => {
      toast.success('Öğrenci bilgileri güncellendi');
      queryClient.invalidateQueries({ queryKey: ['scholarship-application', id] });
      queryClient.invalidateQueries({ queryKey: ['scholarship-applications'] });
      router.push(`/burs/ogrenciler/${id}`);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Güncelleme başarısız oldu');
    },
  });

  if (isLoading) {
    return (
      <PageLayout title="Öğrenci Düzenle" description="Yükleniyor...">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  if (error || !student) {
    return (
      <PageLayout title="Öğrenci Düzenle" description="Hata oluştu">
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <p className="text-destructive">Öğrenci bilgileri yüklenemedi.</p>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri Dön
          </Button>
        </div>
      </PageLayout>
    );
  }

  const initialData: Partial<StudentFormValues> = {
    applicant_name: student.applicant_name,
    applicant_tc_no: student.applicant_tc_no,
    applicant_phone: student.applicant_phone,
    applicant_email: student.applicant_email,
    university: student.university,
    department: student.department,
    grade_level: student.grade_level,
    gpa: student.gpa,
    scholarship_id: student.scholarship_id,
    monthly_income: student.monthly_income,
    family_income: student.family_income,
    father_occupation: student.father_occupation,
    mother_occupation: student.mother_occupation,
    sibling_count: student.sibling_count,
    is_orphan: student.is_orphan,
    has_disability: student.has_disability,
    essay: student.essay,
  };

  return (
    <PageLayout
      title="Öğrenci Düzenle"
      description={`${student.applicant_name} isimli öğrencinin bilgilerini düzenleyin`}
      actions={
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Geri
        </Button>
      }
    >
      <div className="max-w-3xl mx-auto">
        <StudentForm
          initialData={initialData}
          onSubmit={async (data) => {
            await updateMutation.mutateAsync(data);
          }}
          isLoading={updateMutation.isPending}
        />
      </div>
    </PageLayout>
  );
}
