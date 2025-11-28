'use client';

import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit2, Trash2, UserMinus, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PERMISSION_LABELS, type PermissionValue } from '@/types/permissions';

export interface UsersTableItem {
  _id: string;
  name: string;
  email: string;
  role: string;
  permissions: PermissionValue[];
  isActive: boolean;
  phone?: string;
  createdAt?: string;
}

interface UsersTableProps {
  users: UsersTableItem[];
  loading?: boolean;
  onEdit?: (user: UsersTableItem) => void;
  onDelete?: (user: UsersTableItem) => void;
  onToggleActive?: (user: UsersTableItem) => void;
  emptyState?: React.ReactNode;
}

const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('tr-TR').format(date);
};

const getStatusBadgeVariant = (isActive: boolean) => (isActive ? 'default' : 'secondary');

function UsersTableComponent({
  users,
  loading,
  onEdit,
  onDelete,
  onToggleActive,
  emptyState,
}: UsersTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!users.length) {
    return (
      <div className="rounded-md border border-dashed p-12 text-center text-muted-foreground">
        {emptyState ?? 'Henüz kullanıcı bulunmuyor.'}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ad Soyad</TableHead>
          <TableHead>E-posta</TableHead>
          <TableHead>Görev</TableHead>
          <TableHead>Durum</TableHead>
          <TableHead>Telefon</TableHead>
          <TableHead>Oluşturulma</TableHead>
          <TableHead className="text-right">İşlemler</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user._id}>
            <TableCell>
              <div className="font-medium">{user.name}</div>
              <div className="text-xs text-muted-foreground">
                {user.permissions.length
                  ? user.permissions
                      .map((permission) => PERMISSION_LABELS[permission] ?? permission)
                      .join(', ')
                  : 'İzin yok'}
              </div>
            </TableCell>
            <TableCell>
              <div>{user.email}</div>
            </TableCell>
            <TableCell>{user.role}</TableCell>
            <TableCell>
              <Badge variant={getStatusBadgeVariant(user.isActive)}>
                {user.isActive ? 'Aktif' : 'Pasif'}
              </Badge>
            </TableCell>
            <TableCell>{user.phone || '-'}</TableCell>
            <TableCell>{formatDate(user.createdAt)}</TableCell>
            <TableCell className="space-x-2 text-right">
              {onToggleActive ? (
                <Button
                  size="icon"
                  variant="outline"
                  className={cn('h-8 w-8', !user.isActive && 'opacity-70')}
                  onClick={() => {
                    onToggleActive?.(user);
                  }}
                >
                  {user.isActive ? (
                    <UserMinus className="h-4 w-4" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  <span className="sr-only">Durumu değiştir</span>
                </Button>
              ) : null}

              {onEdit ? (
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  onClick={() => {
                    onEdit(user);
                  }}
                >
                  <Edit2 className="h-4 w-4" />
                  <span className="sr-only">Düzenle</span>
                </Button>
              ) : null}

              {onDelete ? (
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  onClick={() => {
                    onDelete(user);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Sil</span>
                </Button>
              ) : null}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export const UsersTable = memo(UsersTableComponent);
