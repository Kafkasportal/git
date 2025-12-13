'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Trash2,
  X,
  CheckCircle2,
  XCircle,
  Edit,
  ChevronDown,
  Download,
  MoreHorizontal,
  Loader2,
} from 'lucide-react';
import { BulkEditModal, BulkEditField } from './bulk-edit-modal';

// Group handlers for better organization and reduced parameter count
export interface BulkActionHandlers {
  onDelete?: () => void;
  onBulkEdit?: (values: Record<string, unknown>) => Promise<void>;
  onStatusChange?: (status: string) => void;
  onExport?: (format: 'csv' | 'excel' | 'pdf') => void;
}

export interface BulkActionsConfig {
  statusOptions?: Array<{ value: string; label: string }>;
  editFields?: BulkEditField[];
  resourceName?: string;
}

export interface BulkActionsToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  handlers?: BulkActionHandlers;
  config?: BulkActionsConfig;
  isLoading?: boolean;
  // Legacy support - individual props still work
  /** @deprecated Use handlers.onDelete instead */
  onDelete?: () => void;
  /** @deprecated Use handlers.onBulkEdit instead */
  onBulkEdit?: (values: Record<string, unknown>) => Promise<void>;
  /** @deprecated Use handlers.onStatusChange instead */
  onStatusChange?: (status: string) => void;
  /** @deprecated Use handlers.onExport instead */
  onExport?: (format: 'csv' | 'excel' | 'pdf') => void;
  /** @deprecated Use config.statusOptions instead */
  statusOptions?: Array<{ value: string; label: string }>;
  /** @deprecated Use config.editFields instead */
  editFields?: BulkEditField[];
  /** @deprecated Use config.resourceName instead */
  resourceName?: string;
}

export function BulkActionsToolbar(props: BulkActionsToolbarProps) {
  const {
    selectedCount,
    onClearSelection,
    handlers = {},
    config = {},
    isLoading,
    // Legacy props fallback
    onDelete: legacyOnDelete,
    onBulkEdit: legacyOnBulkEdit,
    onStatusChange: legacyOnStatusChange,
    onExport: legacyOnExport,
    statusOptions: legacyStatusOptions,
    editFields: legacyEditFields,
    resourceName: legacyResourceName,
  } = props;

  // Merge legacy and new props (new props take precedence)
  const onDelete = handlers.onDelete ?? legacyOnDelete;
  const onBulkEdit = handlers.onBulkEdit ?? legacyOnBulkEdit;
  const onStatusChange = handlers.onStatusChange ?? legacyOnStatusChange;
  const onExport = handlers.onExport ?? legacyOnExport;
  const statusOptions = config.statusOptions ?? legacyStatusOptions;
  const editFields = config.editFields ?? legacyEditFields;
  const resourceName = config.resourceName ?? legacyResourceName ?? 'öğe';

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  if (selectedCount === 0) return null;

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    onDelete?.();
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4 p-4 bg-primary/5 border border-primary/20 rounded-lg backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Badge variant="default" className="text-sm px-3 py-1">
            {selectedCount} {resourceName} seçildi
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-8 gap-1 text-muted-foreground hover:text-foreground"
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Seçimi Temizle</span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Status Change */}
          {statusOptions && statusOptions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1"
                  disabled={isLoading}
                >
                  Durum Değiştir
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Durumu Değiştir</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {statusOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => onStatusChange?.(option.value)}
                    className="gap-2 cursor-pointer"
                  >
                    {option.value === 'AKTIF' ||
                      option.value === 'active' ||
                      option.value === 'approved' ||
                      option.value === 'completed' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Bulk Edit */}
          {editFields && editFields.length > 0 && onBulkEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditModal(true)}
              className="h-8 gap-1"
              disabled={isLoading}
            >
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline">Düzenle</span>
            </Button>
          )}

          {/* Export */}
          {onExport && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1"
                  disabled={isLoading}
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Dışa Aktar</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Seçilenleri Dışa Aktar</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { onExport('excel'); }} className="cursor-pointer">
                  Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { onExport('csv'); }} className="cursor-pointer">
                  CSV (.csv)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { onExport('pdf'); }} className="cursor-pointer">
                  PDF (.pdf)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Delete */}
          {onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="h-8 gap-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Sil</span>
              <span className="sm:hidden">({selectedCount})</span>
            </Button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Toplu Silme Onayı</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{selectedCount} {resourceName}</strong> silmek istediğinizden emin misiniz?
              <br />
              <br />
              Bu işlem geri alınamaz ve seçili kayıtlar kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {selectedCount} {resourceName} Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Edit Modal */}
      {editFields && onBulkEdit && (
        <BulkEditModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          selectedCount={selectedCount}
          fields={editFields}
          onSubmit={onBulkEdit}
          title={`Toplu ${resourceName.charAt(0).toUpperCase() + resourceName.slice(1)} Düzenleme`}
        />
      )}
    </>
  );
}

/**
 * Compact bulk actions for mobile
 */
interface CompactBulkActionsProps {
  selectedCount: number;
  onClearSelection: () => void;
  actions: Array<{
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'destructive';
  }>;
  isLoading?: boolean;
}

export function CompactBulkActions({
  selectedCount,
  onClearSelection,
  actions,
  isLoading,
}: CompactBulkActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-between gap-2 p-3 bg-background border shadow-lg rounded-lg sm:hidden">
      <div className="flex items-center gap-2">
        <Badge>{selectedCount}</Badge>
        <Button variant="ghost" size="icon" onClick={onClearSelection} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isLoading}>
            İşlemler
            <MoreHorizontal className="ml-1 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {actions.map((action, index) => (
            <DropdownMenuItem
              key={index}
              onClick={action.onClick}
              className={action.variant === 'destructive' ? 'text-destructive' : ''}
            >
              {action.icon}
              <span className="ml-2">{action.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
