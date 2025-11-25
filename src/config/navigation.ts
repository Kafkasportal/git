// Navigation modules configuration
// Single source of truth for all navigation items

import {
  Home,
  Heart,
  HelpingHand,
  GraduationCap,
  Wallet,
  MessageSquare,
  Calendar,
  Users,
  Building2,
  Settings,
  BarChart3,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { MODULE_PERMISSIONS, SPECIAL_PERMISSIONS, type PermissionValue } from '@/types/permissions';

export interface SubPage {
  name: string;
  href: string;
  description?: string;
  badge?: number | string;
  permission?: PermissionValue;
}

export interface NavigationModule {
  id: string;
  name: string;
  icon: ComponentType<{ className?: string }>;
  subPages: SubPage[];
  badge?: number | string;
  description?: string;
  category?: 'core' | 'management' | 'reports' | 'settings';
  permission?: PermissionValue;
}

export const navigationModules: NavigationModule[] = [
  {
    id: 'genel',
    name: 'Ana Sayfa',
    icon: Home,
    category: 'core',
    subPages: [{ name: 'Dashboard', href: '/genel', description: 'Sistem genel görünümü' }],
  },
  {
    id: 'bagis',
    name: 'Bağış Yönetimi',
    icon: Heart,
    category: 'management',
    description: 'Bağış süreçlerini yönet',
    permission: MODULE_PERMISSIONS.DONATIONS,
    subPages: [
      { name: 'Bağış Listesi', href: '/bagis/liste', description: 'Tüm bağış kayıtları' },
      {
        name: 'Bağış Raporları',
        href: '/bagis/raporlar',
        description: 'Detaylı analiz ve raporlar',
        permission: MODULE_PERMISSIONS.REPORTS,
      },
      { name: 'Kumbara', href: '/bagis/kumbara', description: 'Bağış kampanyaları' },
    ],
  },
  {
    id: 'yardim',
    name: 'Yardım Programları',
    icon: HelpingHand,
    category: 'management',
    description: 'Yardım süreçlerini koordine et',
    permission: MODULE_PERMISSIONS.BENEFICIARIES,
    subPages: [
      {
        name: 'İhtiyaç Sahipleri',
        href: '/yardim/ihtiyac-sahipleri',
        description: 'Kayıtlı ihtiyaç sahipleri',
      },
      {
        name: 'Başvurular',
        href: '/yardim/basvurular',
        description: 'Yardım başvurularını yönet',
        permission: MODULE_PERMISSIONS.AID_APPLICATIONS,
      },
      { name: 'Yardım Listesi', href: '/yardim/liste', description: 'Verilen yardımlar' },
      { name: 'Nakit Vezne', href: '/yardim/nakdi-vezne', description: 'Nakit yardım yönetimi' },
    ],
  },
  {
    id: 'burs',
    name: 'Burs Sistemi',
    icon: GraduationCap,
    category: 'management',
    description: 'Burs başvuru ve takip sistemi',
    permission: MODULE_PERMISSIONS.SCHOLARSHIPS,
    subPages: [
      { name: 'Öğrenciler', href: '/burs/ogrenciler', description: 'Kayıtlı öğrenciler' },
      { name: 'Başvurular', href: '/burs/basvurular', description: 'Burs başvuruları' },
      { name: 'Yetimler', href: '/burs/yetim', description: 'Yetim burs sistemi' },
    ],
  },
  {
    id: 'fon',
    name: 'Finansal Yönetim',
    icon: Wallet,
    category: 'management',
    description: 'Mali işlemler ve raporlama',
    permission: MODULE_PERMISSIONS.FINANCE,
    subPages: [
      { name: 'Gelir Gider', href: '/fon/gelir-gider', description: 'Mali durum takibi' },
      {
        name: 'Raporlar',
        href: '/fon/raporlar',
        description: 'Mali raporlar',
        permission: MODULE_PERMISSIONS.REPORTS,
      },
    ],
  },
  {
    id: 'mesaj',
    name: 'İletişim',
    icon: MessageSquare,
    category: 'core',
    description: 'İletişim ve bildirim sistemi',
    permission: MODULE_PERMISSIONS.MESSAGES,
    subPages: [
      { name: 'Kurum İçi', href: '/mesaj/kurum-ici', description: 'İç iletişim' },
      { name: 'Toplu Mesaj', href: '/mesaj/toplu', description: 'Toplu bildirimler' },
      { name: 'İletişim Geçmişi', href: '/mesaj/gecmis', description: 'E-posta ve SMS kayıtları' },
    ],
  },
  {
    id: 'is',
    name: 'İş Yönetimi',
    icon: Calendar,
    category: 'core',
    description: 'Görev ve toplantı yönetimi',
    permission: MODULE_PERMISSIONS.WORKFLOW,
    subPages: [
      {
        name: 'Yönetim Paneli',
        href: '/is/yonetim',
        description: 'Toplantı sonrası görev dağılımı',
      },
      { name: 'Görevler', href: '/is/gorevler', description: 'Proje görevleri' },
      { name: 'Toplantılar', href: '/is/toplantilar', description: 'Toplantı takvimi' },
    ],
  },
  {
    id: 'partner',
    name: 'Ortak Yönetimi',
    icon: Building2,
    category: 'management',
    description: 'Partner kuruluş yönetimi',
    permission: MODULE_PERMISSIONS.PARTNERS,
    subPages: [
      { name: 'Ortak Listesi', href: '/partner/liste', description: 'Partner kuruluşlar' },
    ],
  },
  {
    id: 'analitik',
    name: 'Analitik',
    icon: BarChart3,
    category: 'reports',
    description: 'Kullanıcı davranışı ve performans takibi',
    permission: MODULE_PERMISSIONS.REPORTS,
    subPages: [{ name: 'Dashboard', href: '/analitik', description: 'Analitik raporları' }],
  },
  {
    id: 'kullanici',
    name: 'Kullanıcı Yönetimi',
    icon: Users,
    category: 'settings',
    description: 'Kullanıcı ve yetki yönetimi',
    permission: SPECIAL_PERMISSIONS.USERS_MANAGE,
    subPages: [
      {
        name: 'Kullanıcı Yönetimi',
        href: '/kullanici',
        description: 'Kullanıcı rolleri ve yetkileri',
      },
      {
        name: 'Denetim Kayıtları',
        href: '/denetim-kayitlari',
        description: 'KVKK/GDPR uyumluluk kayıtları',
        permission: SPECIAL_PERMISSIONS.USERS_MANAGE,
      },
    ],
  },
  {
    id: 'ayarlar',
    name: 'Sistem Ayarları',
    icon: Settings,
    category: 'settings',
    description: 'Sistem konfigürasyonu',
    permission: MODULE_PERMISSIONS.SETTINGS,
    subPages: [
      { name: 'Genel Ayarlar', href: '/ayarlar', description: 'Sistem ayarları ana sayfası' },
      { name: 'Tema Ayarları', href: '/ayarlar/tema', description: 'Renk ve tema özelleştirme' },
      {
        name: 'Marka ve Organizasyon',
        href: '/ayarlar/marka',
        description: 'Logo ve kurumsal kimlik',
      },
      {
        name: 'İletişim Ayarları',
        href: '/ayarlar/iletisim',
        description: 'Email, SMS, WhatsApp yapılandırması',
      },
      {
        name: 'Güvenlik Ayarları',
        href: '/ayarlar/guvenlik',
        description: 'Şifre, oturum ve 2FA ayarları',
        permission: SPECIAL_PERMISSIONS.USERS_MANAGE,
      },
      { name: 'Parametreler', href: '/ayarlar/parametreler', description: 'Sistem parametreleri' },
    ],
  },
];
