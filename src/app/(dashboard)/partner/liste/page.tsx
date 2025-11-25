'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Edit as EditIcon,
  Trash2,
  Handshake,
  Users,
  Building2,
  User,
  Star,
} from 'lucide-react';
import { apiClient as api } from '@/lib/api/api-client';

interface Partner {
  _id: string;
  name: string;
  type: 'organization' | 'individual' | 'sponsor';
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  tax_number?: string;
  partnership_type: 'donor' | 'supplier' | 'volunteer' | 'sponsor' | 'service_provider';
  collaboration_start_date?: string;
  collaboration_end_date?: string;
  notes?: string;
  status: 'active' | 'inactive' | 'pending';
  total_contribution?: number;
  contribution_count?: number;
  logo_url?: string;
}

export default function PartnersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'organization' as 'organization' | 'individual' | 'sponsor',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    tax_number: '',
    partnership_type: 'donor' as
      | 'donor'
      | 'supplier'
      | 'volunteer'
      | 'sponsor'
      | 'service_provider',
    status: 'active' as 'active' | 'inactive' | 'pending',
    notes: '',
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['partners', searchTerm, typeFilter, statusFilter],
    queryFn: () =>
      api.partners.getPartners({
        search: searchTerm || undefined,
        filters: {
          type: typeFilter === 'all' ? undefined : typeFilter,
          status: statusFilter === 'all' ? undefined : statusFilter,
        },
      }),
  });

  // Derive partners from data instead of using state
  const partners = useMemo(() => {
    return (data?.data as Partner[]) || [];
  }, [data]);

  const filteredPartners = partners.filter((partner: Partner) => {
    const matchesSearch =
      partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || partner.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || partner.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleCreatePartner = async () => {
    if (!formData.name) {
      toast.error('Partner adı zorunludur');
      return;
    }

    try {
      await api.partners.createPartner(formData);
      setFormData({
        name: '',
        type: 'organization',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        website: '',
        tax_number: '',
        partnership_type: 'donor',
        status: 'active',
        notes: '',
      });
      setIsCreateModalOpen(false);
      toast.success('Partner başarıyla oluşturuldu');
      refetch();
    } catch (_error) {
      toast.error('Partner oluşturulurken hata oluştu');
    }
  };

  const handleEditPartner = (partner: Partner) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      type: partner.type,
      contact_person: partner.contact_person || '',
      email: partner.email || '',
      phone: partner.phone || '',
      address: partner.address || '',
      website: partner.website || '',
      tax_number: partner.tax_number || '',
      partnership_type: partner.partnership_type,
      status: partner.status,
      notes: partner.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdatePartner = async () => {
    if (!editingPartner || !formData.name) {
      toast.error('Partner adı zorunludur');
      return;
    }

    try {
      await api.partners.updatePartner(editingPartner._id, formData);
      setIsEditModalOpen(false);
      setEditingPartner(null);
      toast.success('Partner başarıyla güncellendi');
      refetch();
    } catch (_error) {
      toast.error('Partner güncellenirken hata oluştu');
    }
  };

  const handleDeletePartner = async (partnerId: string) => {
    if (!confirm('Bu partneri silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await api.partners.deletePartner(partnerId);
      toast.success('Partner başarıyla silindi');
      refetch();
    } catch (_error) {
      toast.error('Partner silinirken hata oluştu');
    }
  };

  const handleToggleStatus = async (partnerId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

    try {
      await api.partners.updatePartner(partnerId, { status: newStatus });
      toast.success('Partner durumu güncellendi');
      refetch();
    } catch {
      toast.error('Durum güncellenirken hata oluştu');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'organization':
        return <Building2 className="h-4 w-4" />;
      case 'individual':
        return <User className="h-4 w-4" />;
      case 'sponsor':
        return <Star className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'organization':
        return 'Kurum';
      case 'individual':
        return 'Kişi';
      case 'sponsor':
        return 'Sponsor';
      default:
        return type;
    }
  };

  const getPartnershipTypeLabel = (type: string) => {
    switch (type) {
      case 'donor':
        return 'Bağışçı';
      case 'supplier':
        return 'Tedarikçi';
      case 'volunteer':
        return 'Gönüllü';
      case 'sponsor':
        return 'Sponsor';
      case 'service_provider':
        return 'Hizmet Sağlayıcı';
      default:
        return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
            Aktif
          </Badge>
        );
      case 'inactive':
        return <Badge variant="secondary">Pasif</Badge>;
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
            Beklemede
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Ortak Listesi</h1>
        <p className="text-muted-foreground">İş ortaklarını ve sponsorları yönetin</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Partnerler</CardTitle>
              <CardDescription>Toplam {filteredPartners.length} partner</CardDescription>
            </div>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni Partner
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Yeni Partner Oluştur</DialogTitle>
                  <DialogDescription>Partner bilgilerini girin</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="create-name">Partner Adı *</Label>
                    <Input
                      id="create-name"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-type">Tür</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: Partner['type']) =>
                        setFormData((prev) => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="organization">Kurum</SelectItem>
                        <SelectItem value="individual">Kişi</SelectItem>
                        <SelectItem value="sponsor">Sponsor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="create-partnership-type">İşbirliği Türü</Label>
                    <Select
                      value={formData.partnership_type}
                      onValueChange={(value: Partner['partnership_type']) =>
                        setFormData((prev) => ({ ...prev, partnership_type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="donor">Bağışçı</SelectItem>
                        <SelectItem value="supplier">Tedarikçi</SelectItem>
                        <SelectItem value="volunteer">Gönüllü</SelectItem>
                        <SelectItem value="sponsor">Sponsor</SelectItem>
                        <SelectItem value="service_provider">Hizmet Sağlayıcı</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="create-contact-person">İletişim Kişisi</Label>
                    <Input
                      id="create-contact-person"
                      value={formData.contact_person}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, contact_person: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-email">E-posta</Label>
                    <Input
                      id="create-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-phone">Telefon</Label>
                    <Input
                      id="create-phone"
                      value={formData.phone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-status">Durum</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: Partner['status']) =>
                        setFormData((prev) => ({ ...prev, status: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Aktif</SelectItem>
                        <SelectItem value="inactive">Pasif</SelectItem>
                        <SelectItem value="pending">Beklemede</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="create-address">Adres</Label>
                    <Input
                      id="create-address"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, address: e.target.value }))
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="create-notes">Notlar</Label>
                    <Input
                      id="create-notes"
                      value={formData.notes}
                      onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>
                  <div className="col-span-2 flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                      İptal
                    </Button>
                    <Button onClick={handleCreatePartner}>Oluştur</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex space-x-4">
            <div className="flex-1">
              <Label htmlFor="search">Ara</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Ad, iletişim kişisi veya e-posta ile ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="type-filter">Tür</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="organization">Kurum</SelectItem>
                  <SelectItem value="individual">Kişi</SelectItem>
                  <SelectItem value="sponsor">Sponsor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status-filter">Durum</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Pasif</SelectItem>
                  <SelectItem value="pending">Beklemede</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredPartners.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <Handshake className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg font-medium">Partner bulunamadı</p>
              <p className="text-sm mt-2">
                {searchTerm ? 'Arama kriterlerinize uygun partner yok' : 'Henüz partner eklenmemiş'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner Adı</TableHead>
                  <TableHead>Tür</TableHead>
                  <TableHead>İşbirliği</TableHead>
                  <TableHead>İletişim</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Toplam Katkı</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPartners.map((partner) => (
                  <TableRow key={partner._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(partner.type)}
                        {partner.name}
                      </div>
                    </TableCell>
                    <TableCell>{getTypeLabel(partner.type)}</TableCell>
                    <TableCell>{getPartnershipTypeLabel(partner.partnership_type)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {partner.contact_person && <div>{partner.contact_person}</div>}
                        {partner.email && (
                          <div className="text-muted-foreground">{partner.email}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(partner.status)}</TableCell>
                    <TableCell>
                      {partner.total_contribution
                        ? `${partner.total_contribution.toLocaleString('tr-TR')} ₺`
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditPartner(partner)}
                        >
                          <EditIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(partner._id, partner.status)}
                        >
                          {partner.status === 'active' ? 'Pasif Yap' : 'Aktif Yap'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePartner(partner._id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Partner Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Partner Düzenle</DialogTitle>
            <DialogDescription>Partner bilgilerini güncelleyin</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="edit-name">Partner Adı *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-type">Tür</Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) => setFormData((prev) => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="organization">Kurum</SelectItem>
                  <SelectItem value="individual">Kişi</SelectItem>
                  <SelectItem value="sponsor">Sponsor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-partnership-type">İşbirliği Türü</Label>
              <Select
                value={formData.partnership_type}
                onValueChange={(value: any) =>
                  setFormData((prev) => ({ ...prev, partnership_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="donor">Bağışçı</SelectItem>
                  <SelectItem value="supplier">Tedarikçi</SelectItem>
                  <SelectItem value="volunteer">Gönüllü</SelectItem>
                  <SelectItem value="sponsor">Sponsor</SelectItem>
                  <SelectItem value="service_provider">Hizmet Sağlayıcı</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-contact-person">İletişim Kişisi</Label>
              <Input
                id="edit-contact-person"
                value={formData.contact_person}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, contact_person: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-email">E-posta</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-phone">Telefon</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-status">Durum</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Pasif</SelectItem>
                  <SelectItem value="pending">Beklemede</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="edit-address">Adres</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="edit-notes">Notlar</Label>
              <Input
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>
            <div className="col-span-2 flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleUpdatePartner}>Güncelle</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
