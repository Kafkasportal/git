'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, X, CheckCircle2, XCircle } from 'lucide-react';
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
import { useState } from 'react';

interface BulkActionsToolbarProps {
    selectedCount: number;
    onClearSelection: () => void;
    onDelete?: () => void;
    onStatusChange?: (status: string) => void;
    statusOptions?: Array<{ value: string; label: string }>;
    isLoading?: boolean;
}

export function BulkActionsToolbar({
    selectedCount,
    onClearSelection,
    onDelete,
    onStatusChange,
    statusOptions,
    isLoading,
}: BulkActionsToolbarProps) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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
            <div className="flex items-center justify-between gap-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-3">
                    <Badge variant="default" className="text-sm">
                        {selectedCount} öğe seçildi
                    </Badge>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearSelection}
                        className="h-8 gap-1"
                        disabled={isLoading}
                    >
                        <X className="h-4 w-4" />
                        Seçimi Temizle
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    {statusOptions && statusOptions.length > 0 && (
                        <>
                            {statusOptions.map((option) => (
                                <Button
                                    key={option.value}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onStatusChange?.(option.value)}
                                    className="h-8 gap-1"
                                    disabled={isLoading}
                                >
                                    {option.value === 'AKTIF' || option.value === 'active' || option.value === 'approved' ? (
                                        <CheckCircle2 className="h-4 w-4" />
                                    ) : (
                                        <XCircle className="h-4 w-4" />
                                    )}
                                    {option.label}
                                </Button>
                            ))}
                        </>
                    )}

                    {onDelete && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDelete}
                            className="h-8 gap-1"
                            disabled={isLoading}
                        >
                            <Trash2 className="h-4 w-4" />
                            Sil ({selectedCount})
                        </Button>
                    )}
                </div>
            </div>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Toplu Silme Onayı</AlertDialogTitle>
                        <AlertDialogDescription>
                            <strong>{selectedCount} öğeyi</strong> silmek istediğinizden emin misiniz?
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
                            Sil
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
