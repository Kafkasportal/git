'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { scholarshipApplicationsApi } from '@/lib/api/client';
import { PageLayout } from '@/components/ui/page-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Edit, FileText, User, GraduationCap, Wallet } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { ScholarshipApplicationDocument } from '@/types/database';

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

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

  if (isLoading) {
    return (
      <PageLayout title="Öğrenci Detayı" description="Yükleniyor...">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  if (error || !student) {
    return (
      <PageLayout title="Öğrenci Detayı" description="Hata oluştu">
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

  const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    active: 'default',
    pending: 'secondary',
    rejected: 'destructive',
    completed: 'outline',
    draft: 'secondary',
    submitted: 'secondary',
    under_review: 'default',
    approved: 'default',
    waitlisted: 'secondary',
  };

  return (
    <PageLayout
      title={student.applicant_name}
      description="Öğrenci ve burs başvuru detayları"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri
          </Button>
          <Button onClick={() => router.push(`/burs/ogrenciler/${id}/duzenle`)}>
            <Edit className="mr-2 h-4 w-4" />
            Düzenle
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Kişisel Bilgiler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">TC Kimlik No:</span>
              <span className="font-medium">{student.applicant_tc_no}</span>

              <span className="text-muted-foreground">Telefon:</span>
              <span className="font-medium">{student.applicant_phone}</span>

              <span className="text-muted-foreground">E-posta:</span>
              <span className="font-medium">{student.applicant_email || '-'}</span>

              <span className="text-muted-foreground">Yetim Durumu:</span>
              <span className="font-medium">{student.is_orphan ? 'Evet' : 'Hayır'}</span>

              <span className="text-muted-foreground">Engel Durumu:</span>
              <span className="font-medium">{student.has_disability ? 'Evet' : 'Hayır'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Education Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Eğitim Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">Üniversite:</span>
              <span className="font-medium">{student.university}</span>

              <span className="text-muted-foreground">Bölüm:</span>
              <span className="font-medium">{student.department}</span>

              <span className="text-muted-foreground">Sınıf:</span>
              <span className="font-medium">
                {student.grade_level ? `${student.grade_level}. Sınıf` : '-'}
              </span>

              <span className="text-muted-foreground">Not Ortalaması (GPA):</span>
              <span className="font-medium">{student.gpa || '-'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Financial Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Mali Durum
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">Aylık Gelir:</span>
              <span className="font-medium">
                {student.monthly_income ? formatCurrency(student.monthly_income) : '-'}
              </span>

              <span className="text-muted-foreground">Aile Geliri:</span>
              <span className="font-medium">
                {student.family_income ? formatCurrency(student.family_income) : '-'}
              </span>

              <span className="text-muted-foreground">Kardeş Sayısı:</span>
              <span className="font-medium">{student.sibling_count || '-'}</span>

              <span className="text-muted-foreground">Baba Mesleği:</span>
              <span className="font-medium">{student.father_occupation || '-'}</span>

              <span className="text-muted-foreground">Anne Mesleği:</span>
              <span className="font-medium">{student.mother_occupation || '-'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Application Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Başvuru Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">Durum:</span>
              <Badge variant={statusColors[student.status] || 'default'}>
                {student.status === 'active'
                  ? 'Aktif'
                  : student.status === 'pending'
                    ? 'Beklemede'
                    : student.status === 'rejected'
                      ? 'Reddedildi'
                      : student.status === 'completed'
                        ? 'Tamamlandı'
                        : student.status === 'approved'
                          ? 'Onaylandı'
                          : student.status}
              </Badge>

              <span className="text-muted-foreground">Başvuru Tarihi:</span>
              <span className="font-medium">
                {student.$createdAt
                  ? format(new Date(student.$createdAt), 'd MMMM yyyy', { locale: tr })
                  : '-'}
              </span>

              {student.essay && (
                <div className="col-span-2 mt-4">
                  <span className="block text-muted-foreground mb-1">Başvuru Yazısı:</span>
                  <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">
                    {student.essay}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
