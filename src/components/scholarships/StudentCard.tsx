'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Eye,
  Edit,
  GraduationCap,
  BookOpen,
  User,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  Heart,
} from 'lucide-react';
import { Student } from '@/types/scholarship';
import { getStudentStatusBadge, getEducationLevelBadge } from '@/lib/utils/scholarship-helpers';

interface StudentCardProps {
  student: Student;
  onEdit?: (student: Student) => void;
}

export function StudentCard({ student, onEdit }: StudentCardProps) {
  return (
    <Card key={student.id} className="border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold">
                {student.firstName} {student.lastName}
              </h3>
              {getStudentStatusBadge(student.status)}
              {student.isOrphan && (
                <Badge variant="outline" className="text-red-600 border-red-600">
                  <Heart className="h-3 w-3 mr-1" />
                  Yetim
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                <span>{student.institution}</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>{getEducationLevelBadge(student.educationLevel)}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{student.grade}</span>
              </div>
              {student.gpa && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span>GPA: {student.gpa}</span>
                </div>
              )}
            </div>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
              {student.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  <span>{student.phone}</span>
                </div>
              )}
              {student.email && (
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  <span>{student.email}</span>
                </div>
              )}
              {student.city && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{student.city}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Öğrenci Detayları</DialogTitle>
                  <DialogDescription>
                    {student.firstName} {student.lastName} - {student.institution}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Ad Soyad</Label>
                      <p className="text-sm text-muted-foreground">
                        {student.firstName} {student.lastName}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">TC No</Label>
                      <p className="text-sm text-muted-foreground">{student.nationalId || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Durum</Label>
                      <div className="mt-1">{getStudentStatusBadge(student.status)}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Eğitim Seviyesi</Label>
                      <div className="mt-1">{getEducationLevelBadge(student.educationLevel)}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Eğitim Kurumu</Label>
                      <p className="text-sm text-muted-foreground">{student.institution}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Bölüm</Label>
                      <p className="text-sm text-muted-foreground">{student.department || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Sınıf</Label>
                      <p className="text-sm text-muted-foreground">{student.grade || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">GPA</Label>
                      <p className="text-sm text-muted-foreground">{student.gpa || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">E-posta</Label>
                      <p className="text-sm text-muted-foreground">{student.email || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Telefon</Label>
                      <p className="text-sm text-muted-foreground">{student.phone || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Şehir</Label>
                      <p className="text-sm text-muted-foreground">{student.city || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Aile Geliri</Label>
                      <p className="text-sm text-muted-foreground">
                        {student.familyIncome ? `${student.familyIncome} TL` : '-'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Aile Büyüklüğü</Label>
                      <p className="text-sm text-muted-foreground">{student.familySize || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Yetim Durumu</Label>
                      <p className="text-sm text-muted-foreground">
                        {student.isOrphan ? 'Evet' : 'Hayır'}
                      </p>
                    </div>
                  </div>
                  {student.isOrphan && student.guardianName && (
                    <div>
                      <Label className="text-sm font-medium">Veli Bilgileri</Label>
                      <p className="text-sm text-muted-foreground">
                        {student.guardianName} ({student.guardianRelation}) -{' '}
                        {student.guardianPhone}
                      </p>
                    </div>
                  )}
                  {student.notes && (
                    <div>
                      <Label className="text-sm font-medium">Notlar</Label>
                      <p className="text-sm text-muted-foreground">{student.notes}</p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            {onEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(student)}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
