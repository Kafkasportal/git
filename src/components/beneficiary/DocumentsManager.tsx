'use client';

import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  File,
  FileText,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  Loader2,
  Plus,
  Calendar,
} from 'lucide-react';

// Document type enum (matching API)
enum DocumentType {
  KIMLIK = 'kimlik',
  IKAMET = 'ikamet',
  GELIR_BELGESI = 'gelir_belgesi',
  SAGLIK_RAPORU = 'saglik_raporu',
  OKUL_BELGESI = 'okul_belgesi',
  VEKALETNAME = 'vekaletname',
  BANKA_HESAP = 'banka_hesap',
  DIGER = 'diger',
}

interface Document {
  id: string;
  beneficiaryId: string;
  type: DocumentType;
  typeLabel: string;
  name: string;
  fileId?: string;
  fileUrl?: string;
  mimeType?: string;
  size?: number;
  expiryDate?: string;
  isExpired: boolean;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

interface DocumentsManagerProps {
  beneficiaryId: string;
  className?: string;
  readOnly?: boolean;
}

/**
 * Belge yönetim bileşeni
 */
export function DocumentsManager({
  beneficiaryId,
  className,
  readOnly = false,
}: DocumentsManagerProps) {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    type: '' as DocumentType | '',
    name: '',
    fileUrl: '',
    expiryDate: '',
    notes: '',
  });

  // Fetch documents
  const { data, isLoading } = useQuery({
    queryKey: ['beneficiary-documents', beneficiaryId],
    queryFn: async () => {
      const response = await fetch(`/api/beneficiaries/${beneficiaryId}/documents`);
      if (!response.ok) throw new Error('Belgeler alınamadı');
      return response.json();
    },
    enabled: !!beneficiaryId,
  });

  const documents: Document[] = data?.data?.documents || [];
  const summary = data?.data?.summary || { total: 0, verified: 0, expired: 0, pending: 0 };
  const documentTypes = data?.data?.documentTypes || [];

  // Add document mutation
  const addMutation = useMutation({
    mutationFn: async (docData: typeof formData) => {
      const response = await fetch(`/api/beneficiaries/${beneficiaryId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: docData.type,
          name: docData.name,
          fileUrl: docData.fileUrl || undefined,
          expiryDate: docData.expiryDate || undefined,
          notes: docData.notes || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Belge eklenemedi');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Belge başarıyla eklendi');
      setShowAddDialog(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['beneficiary-documents', beneficiaryId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await fetch(`/api/beneficiaries/${beneficiaryId}/documents`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Belge silinemedi');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Belge silindi');
      queryClient.invalidateQueries({ queryKey: ['beneficiary-documents', beneficiaryId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Verify mutation
  const verifyMutation = useMutation({
    mutationFn: async ({ documentId, isVerified }: { documentId: string; isVerified: boolean }) => {
      const response = await fetch(`/api/beneficiaries/${beneficiaryId}/documents`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, isVerified }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Doğrulama başarısız');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast.success(data.message);
      setShowVerifyDialog(false);
      setSelectedDocument(null);
      queryClient.invalidateQueries({ queryKey: ['beneficiary-documents', beneficiaryId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const resetForm = useCallback(() => {
    setFormData({
      type: '',
      name: '',
      fileUrl: '',
      expiryDate: '',
      notes: '',
    });
  }, []);

  const handleAddSubmit = () => {
    if (!formData.type) {
      toast.error('Belge türü seçiniz');
      return;
    }
    if (!formData.name.trim()) {
      toast.error('Belge adı giriniz');
      return;
    }
    addMutation.mutate(formData);
  };

  const handleDelete = (doc: Document) => {
    if (confirm(`"${doc.name}" belgesini silmek istediğinize emin misiniz?`)) {
      deleteMutation.mutate(doc.id);
    }
  };

  const handleVerify = (doc: Document) => {
    setSelectedDocument(doc);
    setShowVerifyDialog(true);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('tr-TR');
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{summary.total}</span>
            </div>
            <p className="text-xs text-muted-foreground">Toplam Belge</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">{summary.verified}</span>
            </div>
            <p className="text-xs text-muted-foreground">Doğrulanmış</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span className="text-2xl font-bold">{summary.pending}</span>
            </div>
            <p className="text-xs text-muted-foreground">Bekleyen</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-2xl font-bold">{summary.expired}</span>
            </div>
            <p className="text-xs text-muted-foreground">Süresi Dolmuş</p>
          </CardContent>
        </Card>
      </div>

      {/* Documents List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Belgeler</CardTitle>
            <CardDescription>Kayıta ait tüm belgeler</CardDescription>
          </div>
          {!readOnly && (
            <Button onClick={() => { setShowAddDialog(true); }} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Belge Ekle
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Henüz belge eklenmemiş</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border transition-colors',
                    doc.isExpired && 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/10',
                    !doc.isExpired && doc.isVerified && 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/10'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'p-2 rounded-lg',
                      doc.isExpired ? 'bg-red-100 dark:bg-red-900/20' :
                      doc.isVerified ? 'bg-green-100 dark:bg-green-900/20' :
                      'bg-muted'
                    )}>
                      <File className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{doc.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {doc.typeLabel}
                        </Badge>
                        {doc.isVerified && (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Doğrulanmış
                          </Badge>
                        )}
                        {doc.isExpired && (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Süresi Dolmuş
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        {doc.expiryDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Son: {formatDate(doc.expiryDate)}
                          </span>
                        )}
                        {doc.size && (
                          <span>{formatFileSize(doc.size)}</span>
                        )}
                        <span>Eklenme: {formatDate(doc.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {doc.fileUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(doc.fileUrl, '_blank')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {!readOnly && !doc.isVerified && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVerify(doc)}
                      >
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </Button>
                    )}
                    {!readOnly && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { handleDelete(doc); }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Document Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Belge Ekle</DialogTitle>
            <DialogDescription>
              Yeni belge kaydı oluşturun
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Belge Türü *</Label>
              <Select
                value={formData.type}
                onValueChange={(v) => { setFormData((f) => ({ ...f, type: v as DocumentType })); }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Belge türü seçin" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((t: { value: string; label: string }) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Belge Adı *</Label>
              <Input
                value={formData.name}
                onChange={(e) => { setFormData((f) => ({ ...f, name: e.target.value })); }}
                placeholder="Örn: TC Kimlik - Ahmet Yılmaz"
              />
            </div>

            <div className="space-y-2">
              <Label>Dosya URL (opsiyonel)</Label>
              <Input
                value={formData.fileUrl}
                onChange={(e) => { setFormData((f) => ({ ...f, fileUrl: e.target.value })); }}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>Son Geçerlilik Tarihi (opsiyonel)</Label>
              <Input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => { setFormData((f) => ({ ...f, expiryDate: e.target.value })); }}
              />
            </div>

            <div className="space-y-2">
              <Label>Notlar (opsiyonel)</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => { setFormData((f) => ({ ...f, notes: e.target.value })); }}
                placeholder="Belge hakkında notlar..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); }}>
              İptal
            </Button>
            <Button onClick={handleAddSubmit} disabled={addMutation.isPending}>
              {addMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Ekleniyor...
                </>
              ) : (
                'Ekle'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verify Dialog */}
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Belge Doğrulama</DialogTitle>
            <DialogDescription>
              &ldquo;{selectedDocument?.name}&rdquo; belgesini doğrulamak istiyor musunuz?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowVerifyDialog(false); }}>
              İptal
            </Button>
            <Button
              onClick={() => selectedDocument && verifyMutation.mutate({
                documentId: selectedDocument.id,
                isVerified: true,
              })}
              disabled={verifyMutation.isPending}
            >
              {verifyMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Doğrulanıyor...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Doğrula
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
