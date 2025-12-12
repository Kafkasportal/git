'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  UserPlus,
  Loader2,
  Heart,
  Baby,
  User,
  Users2,
  GraduationCap,
  Briefcase,
  AlertCircle,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  Home,
} from 'lucide-react';

/**
 * Aile ilişki türleri
 */
const FAMILY_RELATIONS = [
  { value: 'spouse', label: 'Eş', icon: Heart },
  { value: 'child', label: 'Çocuk', icon: Baby },
  { value: 'mother', label: 'Anne', icon: User },
  { value: 'father', label: 'Baba', icon: User },
  { value: 'sibling', label: 'Kardeş', icon: Users2 },
  { value: 'grandmother', label: 'Büyükanne', icon: User },
  { value: 'grandfather', label: 'Büyükbaba', icon: User },
  { value: 'grandchild', label: 'Torun', icon: Baby },
  { value: 'other_relative', label: 'Diğer Akraba', icon: Users },
  { value: 'dependent', label: 'Bakmakla Yükümlü', icon: User },
] as const;

/**
 * Durum türleri
 */
const MEMBER_STATUSES = [
  { value: 'active', label: 'Aktif', color: 'bg-green-500' },
  { value: 'separated', label: 'Ayrı Yaşıyor', color: 'bg-yellow-500' },
  { value: 'deceased', label: 'Vefat', color: 'bg-gray-500' },
  { value: 'missing', label: 'Kayıp', color: 'bg-red-500' },
] as const;

/**
 * Aile üyesi tipi
 */
interface FamilyMember {
  id: string;
  beneficiaryId: string;
  firstName: string;
  lastName: string;
  relation: string;
  tcKimlikNo?: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other';
  status: string;
  occupation?: string;
  income?: number;
  healthCondition?: string;
  educationLevel?: string;
  school?: string;
  notes?: string;
  isDependent: boolean;
  contactPhone?: string;
}

/**
 * Aile özeti tipi
 */
interface FamilySummary {
  totalMembers: number;
  dependents: number;
  children: number;
  workingMembers: number;
  totalFamilyIncome: number;
  averageAge: number;
  hasElderly: boolean;
  hasDisabled: boolean;
}

interface FamilyTreeProps {
  beneficiaryId: string;
  beneficiaryName?: string;
  className?: string;
  editable?: boolean;
}

/**
 * Aile Ağacı Bileşeni
 * Yardım alıcının aile yapısını görselleştirir
 */
export function FamilyTree({
  beneficiaryId,
  beneficiaryName,
  className,
  editable = true,
}: FamilyTreeProps) {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['spouse', 'child']);

  // Aile verilerini getir
  const { data, isLoading, error } = useQuery({
    queryKey: ['family', beneficiaryId],
    queryFn: async () => {
      const response = await fetch(`/api/beneficiaries/${beneficiaryId}/family`);
      if (!response.ok) throw new Error('Aile bilgileri alınamadı');
      return response.json();
    },
  });

  // Üye ekleme mutation
  const addMemberMutation = useMutation({
    mutationFn: async (memberData: Partial<FamilyMember>) => {
      const response = await fetch(`/api/beneficiaries/${beneficiaryId}/family`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberData),
      });
      if (!response.ok) throw new Error('Üye eklenemedi');
      return response.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['family', beneficiaryId] });
      setIsAddDialogOpen(false);
    },
  });

  // Üye güncelleme mutation
  const updateMemberMutation = useMutation({
    mutationFn: async ({ memberId, ...data }: { memberId: string } & Partial<FamilyMember>) => {
      const response = await fetch(`/api/beneficiaries/${beneficiaryId}/family`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, ...data }),
      });
      if (!response.ok) throw new Error('Güncelleme başarısız');
      return response.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['family', beneficiaryId] });
      setEditingMember(null);
    },
  });

  // Üye silme mutation
  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const response = await fetch(`/api/beneficiaries/${beneficiaryId}/family`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, softDelete: true }),
      });
      if (!response.ok) throw new Error('Silme başarısız');
      return response.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['family', beneficiaryId] });
    },
  });

  const members: FamilyMember[] = data?.data?.members || [];
  const summary: FamilySummary = data?.data?.summary || {
    totalMembers: 0,
    dependents: 0,
    children: 0,
    workingMembers: 0,
    totalFamilyIncome: 0,
    averageAge: 0,
    hasElderly: false,
    hasDisabled: false,
  };

  // Üyeleri ilişki türüne göre grupla
  const membersByRelation = members.reduce((acc, member) => {
    if (!acc[member.relation]) {
      acc[member.relation] = [];
    }
    acc[member.relation].push(member);
    return acc;
  }, {} as Record<string, FamilyMember[]>);

  const toggleGroup = (relation: string) => {
    setExpandedGroups(prev =>
      prev.includes(relation)
        ? prev.filter(r => r !== relation)
        : [...prev, relation]
    );
  };

  const getStatusInfo = (status: string) => {
    return MEMBER_STATUSES.find(s => s.value === status) || {
      value: status,
      label: status,
      color: 'bg-gray-500',
    };
  };

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12 text-destructive">
          <AlertCircle className="h-5 w-5 mr-2" />
          Aile bilgileri yüklenemedi
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Özet Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          icon={Users}
          label="Toplam Üye"
          value={summary.totalMembers}
          color="text-blue-600"
        />
        <SummaryCard
          icon={Baby}
          label="Çocuk"
          value={summary.children}
          color="text-pink-600"
        />
        <SummaryCard
          icon={Briefcase}
          label="Çalışan"
          value={summary.workingMembers}
          color="text-green-600"
        />
        <SummaryCard
          icon={Home}
          label="Bakmakla Yükümlü"
          value={summary.dependents}
          color="text-orange-600"
        />
      </div>

      {/* Gelir Özeti */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Toplam Aile Geliri</p>
              <p className="text-2xl font-bold">
                {new Intl.NumberFormat('tr-TR', {
                  style: 'currency',
                  currency: 'TRY',
                }).format(summary.totalFamilyIncome)}
              </p>
            </div>
            <div className="flex gap-2">
              {summary.hasElderly && (
                <Badge variant="secondary">Yaşlı Birey</Badge>
              )}
              {summary.hasDisabled && (
                <Badge variant="secondary">Engelli Birey</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Aile Ağacı */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Aile Yapısı</CardTitle>
            <CardDescription>
              {beneficiaryName && `${beneficiaryName} - `}
              {summary.totalMembers} aile üyesi
            </CardDescription>
          </div>
          {editable && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Üye Ekle
                </Button>
              </DialogTrigger>
              <FamilyMemberDialog
                onSubmit={(data) => addMemberMutation.mutate(data)}
                isSubmitting={addMemberMutation.isPending}
              />
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Henüz aile üyesi eklenmemiş</p>
            </div>
          ) : (
            <div className="space-y-4">
              {FAMILY_RELATIONS.map((relation) => {
                const relationMembers = membersByRelation[relation.value] || [];
                if (relationMembers.length === 0) return null;

                const isExpanded = expandedGroups.includes(relation.value);
                const Icon = relation.icon;

                return (
                  <div key={relation.value} className="border rounded-lg">
                    {/* Grup Başlığı */}
                    <button
                      onClick={() => toggleGroup(relation.value)}
                      className="flex items-center justify-between w-full p-3 hover:bg-muted/50 rounded-t-lg"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{relation.label}</span>
                        <Badge variant="secondary" className="ml-2">
                          {relationMembers.length}
                        </Badge>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>

                    {/* Üye Listesi */}
                    {isExpanded && (
                      <div className="border-t divide-y">
                        {relationMembers.map((member) => (
                          <FamilyMemberCard
                            key={member.id}
                            member={member}
                            onEdit={editable ? () => setEditingMember(member) : undefined}
                            onDelete={editable ? () => deleteMemberMutation.mutate(member.id) : undefined}
                            calculateAge={calculateAge}
                            getStatusInfo={getStatusInfo}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Düzenleme Dialog */}
      {editingMember && (
        <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
          <FamilyMemberDialog
            initialData={editingMember}
            onSubmit={(data) => {
              updateMemberMutation.mutate({ memberId: editingMember.id, ...data });
            }}
            isSubmitting={updateMemberMutation.isPending}
          />
        </Dialog>
      )}
    </div>
  );
}

/**
 * Özet Kartı
 */
interface SummaryCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}

function SummaryCard({ icon: Icon, label, value, color }: SummaryCardProps) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg bg-muted', color)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Aile Üyesi Kartı
 */
interface FamilyMemberCardProps {
  member: FamilyMember;
  onEdit?: () => void;
  onDelete?: () => void;
  calculateAge: (birthDate?: string) => number | null;
  getStatusInfo: (status: string) => { value: string; label: string; color: string };
}

function FamilyMemberCard({
  member,
  onEdit,
  onDelete,
  calculateAge,
  getStatusInfo,
}: FamilyMemberCardProps) {
  const age = calculateAge(member.birthDate);
  const statusInfo = getStatusInfo(member.status);

  return (
    <div className="flex items-center justify-between p-4 hover:bg-muted/30">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback>
            {member.firstName[0]}
            {member.lastName[0]}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">
            {member.firstName} {member.lastName}
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {age !== null && <span>{age} yaş</span>}
            {member.gender && (
              <span>{member.gender === 'male' ? 'Erkek' : member.gender === 'female' ? 'Kadın' : 'Diğer'}</span>
            )}
            {member.occupation && (
              <span className="flex items-center gap-1">
                <Briefcase className="h-3 w-3" />
                {member.occupation}
              </span>
            )}
            {member.school && (
              <span className="flex items-center gap-1">
                <GraduationCap className="h-3 w-3" />
                {member.school}
              </span>
            )}
          </div>
          {member.healthCondition && (
            <p className="text-xs text-orange-600 mt-1">
              <AlertCircle className="h-3 w-3 inline mr-1" />
              {member.healthCondition}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {member.isDependent && (
          <Badge variant="outline" className="text-xs">
            Bakmakla Yükümlü
          </Badge>
        )}
        <div className={cn('w-2 h-2 rounded-full', statusInfo.color)} title={statusInfo.label} />
        {(onEdit || onDelete) && (
          <div className="flex gap-1 ml-2">
            {onEdit && (
              <Button variant="ghost" size="icon" onClick={onEdit}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="icon" onClick={onDelete}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Aile Üyesi Ekleme/Düzenleme Dialog
 */
interface FamilyMemberDialogProps {
  initialData?: Partial<FamilyMember>;
  onSubmit: (data: Partial<FamilyMember>) => void;
  isSubmitting: boolean;
}

function FamilyMemberDialog({
  initialData,
  onSubmit,
  isSubmitting,
}: FamilyMemberDialogProps) {
  const [formData, setFormData] = useState<Partial<FamilyMember>>(
    initialData || {
      firstName: '',
      lastName: '',
      relation: 'child',
      gender: 'male',
      status: 'active',
      isDependent: true,
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {initialData ? 'Üye Düzenle' : 'Yeni Aile Üyesi'}
        </DialogTitle>
        <DialogDescription>
          Aile üyesi bilgilerini girin
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Ad *</Label>
            <Input
              value={formData.firstName || ''}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Soyad *</Label>
            <Input
              value={formData.lastName || ''}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>İlişki *</Label>
            <Select
              value={formData.relation}
              onValueChange={(value) => setFormData({ ...formData, relation: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seçiniz" />
              </SelectTrigger>
              <SelectContent>
                {FAMILY_RELATIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Cinsiyet</Label>
            <Select
              value={formData.gender}
              onValueChange={(value: 'male' | 'female' | 'other') =>
                setFormData({ ...formData, gender: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seçiniz" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Erkek</SelectItem>
                <SelectItem value="female">Kadın</SelectItem>
                <SelectItem value="other">Diğer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>TC Kimlik No</Label>
            <Input
              value={formData.tcKimlikNo || ''}
              onChange={(e) => setFormData({ ...formData, tcKimlikNo: e.target.value })}
              maxLength={11}
            />
          </div>
          <div className="space-y-2">
            <Label>Doğum Tarihi</Label>
            <Input
              type="date"
              value={formData.birthDate || ''}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Meslek</Label>
            <Input
              value={formData.occupation || ''}
              onChange={(e) => { setFormData({ ...formData, occupation: e.target.value }); }}
            />
          </div>
          <div className="space-y-2">
            <Label>Gelir (₺)</Label>
            <Input
              type="number"
              min={0}
              value={formData.income || ''}
              onChange={(e) => { setFormData({ ...formData, income: Number(e.target.value) }); }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Eğitim Durumu</Label>
            <Input
              value={formData.educationLevel || ''}
              onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value })}
              placeholder="Örn: İlkokul, Lise, Üniversite"
            />
          </div>
          <div className="space-y-2">
            <Label>Okul</Label>
            <Input
              value={formData.school || ''}
              onChange={(e) => setFormData({ ...formData, school: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Sağlık Durumu</Label>
          <Textarea
            value={formData.healthCondition || ''}
            onChange={(e) => setFormData({ ...formData, healthCondition: e.target.value })}
            placeholder="Varsa kronik hastalık, engellilik durumu vb."
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label>Notlar</Label>
          <Textarea
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={2}
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDependent"
              checked={formData.isDependent}
              onChange={(e) => setFormData({ ...formData, isDependent: e.target.checked })}
              className="rounded border-input"
            />
            <Label htmlFor="isDependent">Bakmakla yükümlü</Label>
          </div>
        </div>

        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Kaydediliyor...
              </>
            ) : initialData ? (
              'Güncelle'
            ) : (
              'Ekle'
            )}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

export default FamilyTree;
