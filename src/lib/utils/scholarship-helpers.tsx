import { Badge } from '@/components/ui/badge';
import { StudentStatus, ApplicationStatus, EducationLevel } from '@/types/scholarship';
import { FileText, Clock, Eye, CheckCircle, XCircle, UserCheck } from 'lucide-react';

/**
 * Öğrenci durumu için badge döndürür
 */
export function getStudentStatusBadge(status: StudentStatus) {
  const statusConfig = {
    [StudentStatus.ACTIVE]: { variant: 'default' as const, text: 'Aktif' },
    [StudentStatus.GRADUATED]: { variant: 'secondary' as const, text: 'Mezun' },
    [StudentStatus.SUSPENDED]: { variant: 'destructive' as const, text: 'Askıya Alındı' },
    [StudentStatus.DROPPED_OUT]: { variant: 'outline' as const, text: 'Okulu Bıraktı' },
    [StudentStatus.TRANSFERRED]: { variant: 'outline' as const, text: 'Transfer' },
  };

  const config = statusConfig[status];

  return <Badge variant={config.variant}>{config.text}</Badge>;
}

/**
 * Başvuru durumu için badge döndürür
 */
export function getApplicationStatusBadge(status: ApplicationStatus) {
  const statusConfig = {
    [ApplicationStatus.DRAFT]: { variant: 'secondary' as const, icon: FileText, text: 'Taslak' },
    [ApplicationStatus.SUBMITTED]: { variant: 'default' as const, icon: Clock, text: 'Gönderildi' },
    [ApplicationStatus.UNDER_REVIEW]: {
      variant: 'default' as const,
      icon: Eye,
      text: 'İnceleniyor',
    },
    [ApplicationStatus.APPROVED]: {
      variant: 'default' as const,
      icon: CheckCircle,
      text: 'Onaylandı',
    },
    [ApplicationStatus.REJECTED]: {
      variant: 'destructive' as const,
      icon: XCircle,
      text: 'Reddedildi',
    },
    [ApplicationStatus.WAITLIST]: { variant: 'secondary' as const, icon: Clock, text: 'Beklemede' },
    [ApplicationStatus.WITHDRAWN]: {
      variant: 'outline' as const,
      icon: UserCheck,
      text: 'Çekildi',
    },
    [ApplicationStatus.CANCELLED]: {
      variant: 'destructive' as const,
      icon: XCircle,
      text: 'İptal',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {config.text}
    </Badge>
  );
}

/**
 * Eğitim seviyesi için badge döndürür
 */
export function getEducationLevelBadge(level: EducationLevel) {
  const levelConfig = {
    [EducationLevel.PRIMARY]: { text: 'İlkokul' },
    [EducationLevel.SECONDARY]: { text: 'Ortaokul' },
    [EducationLevel.HIGH_SCHOOL]: { text: 'Lise' },
    [EducationLevel.BACHELOR]: { text: 'Lisans' },
    [EducationLevel.MASTER]: { text: 'Yüksek Lisans' },
    [EducationLevel.DOCTORATE]: { text: 'Doktora' },
    [EducationLevel.VOCATIONAL]: { text: 'Meslek' },
  };

  const config = levelConfig[level];

  return <Badge variant="outline">{config.text}</Badge>;
}
