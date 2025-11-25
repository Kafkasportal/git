'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, FileText, Download, Trash2, Image, File, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import logger from '@/lib/logger';
import { toast } from 'sonner';

interface DocumentsManagerProps {
  beneficiaryId: string;
}

interface Document {
  _id?: string;
  $id?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  document_type?: string;
  uploadedAt: string;
  url?: string;
  storageId?: string;
}

export function DocumentsManager({ beneficiaryId }: DocumentsManagerProps) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Fetch documents - Optimized with caching and immediate UI
  const { data: documentsResponse, isLoading } = useQuery({
    queryKey: ['documents', beneficiaryId],
    queryFn: async () => {
      try {
        const response = await fetch(
          `/api/storage?beneficiaryId=${beneficiaryId}&bucket=documents`
        );
        const json = await response.json();
        return json.data || [];
      } catch (_error) {
        logger.error('Document fetch failed', { error: _error });
        return [];
      }
    },
    enabled: !!beneficiaryId,
    staleTime: 1000 * 60 * 5, // 5 minutes - data is fresh for 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes - keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    retry: 1, // Only retry once on failure
    placeholderData: [], // Show empty state immediately
  });

  const documents = documentsResponse || [];

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const response = await fetch(`/api/storage/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Dosya silinemedi');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', beneficiaryId] });
      toast.success('Doküman başarıyla silindi');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Doküman silinirken bir hata oluştu');
    },
  });

  const handleFileUpload = async (file: File | null) => {
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'documents');
      formData.append('beneficiaryId', beneficiaryId);
      formData.append('documentType', 'other');

      const response = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Dosya yükleme başarısız');
      }

      toast.success('Doküman başarıyla yüklendi');
      queryClient.invalidateQueries({ queryKey: ['documents', beneficiaryId] });
    } catch (_error) {
      toast.error(_error instanceof Error ? _error.message : 'Dosya yükleme hatası');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return Image;
    if (fileType === 'application/pdf') return FileText;
    return File;
  };

  const handleDownload = async (file: Document) => {
    if (!file.url) {
      toast.error("Dosya URL'si bulunamadı");
      return;
    }

    try {
      // Direct download using URL
      const a = window.document.createElement('a');
      a.href = file.url;
      a.download = file.fileName;
      a.target = '_blank';
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
    } catch (_error) {
      toast.error('Dosya indirilemedi');
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Section - Compact & Elegant */}
      <div
        className="relative"
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!uploading) setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(false);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(false);
          if (uploading) return;
          const file = e.dataTransfer.files[0];
          if (file) handleFileUpload(file);
        }}
      >
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
          }}
          disabled={uploading}
          className="hidden"
          id="file-upload-input"
        />
        <label
          htmlFor="file-upload-input"
          className={`
            flex items-center justify-center gap-3 
            border rounded-lg 
            cursor-pointer transition-all duration-200
            px-4 py-2.5 
            ${
              dragActive
                ? 'border-blue-400 border-solid bg-blue-50/50'
                : 'border-dashed border-slate-300 bg-slate-50/50 hover:bg-slate-100/50 hover:border-blue-400 hover:border-solid'
            }
            ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-sm text-slate-600">Yükleniyor...</span>
            </>
          ) : (
            <>
              <Upload className={`h-4 w-4 ${dragActive ? 'text-blue-600' : 'text-slate-500'}`} />
              <span
                className={`text-sm font-medium ${dragActive ? 'text-blue-700' : 'text-slate-700'}`}
              >
                Dosya seç veya sürükle
              </span>
              <span className="text-xs text-slate-500">• Max 10MB</span>
            </>
          )}
        </label>
      </div>

      {/* Documents List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Yükleniyor...</span>
          </div>
        ) : documents && documents.length > 0 ? (
          documents.map((doc: Record<string, unknown>) => {
            const Icon = getFileIcon(String(doc.fileType || ''));
            const docId = String(doc.$id || doc._id || doc.storageId || '');
            return (
              <Card key={docId} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{String(doc.fileName || '')}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(Number(doc.fileSize) || 0)} •{' '}
                          {new Date(String(doc.uploadedAt || '')).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(doc as unknown as Document)}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        İndir
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          deleteMutation.mutate(String(doc.storageId || docId));
                        }}
                        disabled={deleteMutation.isPending}
                        className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {deleteMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Henüz doküman yüklenmemiş</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
