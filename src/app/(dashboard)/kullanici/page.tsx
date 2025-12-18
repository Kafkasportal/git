'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UsersTable, type UsersTableItem } from '@/components/tables/users-table';
import { users as usersApi } from '@/lib/api/crud-factory';
import { useAuthStore } from '@/stores/authStore';
import { ExportMenu } from '@/components/ui/export-menu';
import { useFilters } from '@/hooks/useFilters';
import { FilterPanel, FilterField } from '@/components/ui/filter-panel';
import type { PermissionValue } from '@/types/permissions';

type UsersListResponse = Awaited<ReturnType<(typeof usersApi)['getAll']>>;



export default function UsersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const userPermissions = useAuthStore((state) => state.user?.permissions ?? []);

  const { filters, resetFilters, handleFiltersChange } = useFilters({
    syncWithUrl: true,
    presetsKey: 'users-filters',
  });

  const canManageUsers = useMemo(() => userPermissions.includes('users:manage'), [userPermissions]);

  const { data, isLoading, isFetching } = useQuery<UsersListResponse>({
    queryKey: ['users', filters],
    queryFn: async () => {
      const response = await usersApi.getAll({
        search: filters.search as string,
        filters: {
          role: filters.role as string,
          isActive: filters.isActive === 'true' ? true : filters.isActive === 'false' ? false : undefined,
        },
        page: 1,
        limit: 100,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      return response;
    },
  });

  const filterFields: FilterField[] = [
    {
      key: 'search',
      label: 'Arama',
      type: 'text',
      placeholder: 'İsim veya e-posta ile ara...',
    },
    {
      key: 'role',
      label: 'Rol',
      type: 'select',
      options: [
        { label: 'Yönetici', value: 'admin' },
        { label: 'Personel', value: 'staff' },
        { label: 'Gönüllü', value: 'volunteer' },
      ],
    },
    {
      key: 'isActive',
      label: 'Durum',
      type: 'select',
      options: [
        { label: 'Aktif', value: 'true' },
        { label: 'Pasif', value: 'false' },
      ],
    },
  ];

  const users = useMemo<UsersTableItem[]>(
    () =>
      (data?.data ?? []).map((user) => ({
        _id: user._id || user.$id || '',
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: (user.permissions ?? []) as PermissionValue[],
        isActive: user.isActive ?? true,
        phone: user.phone ?? undefined,
        createdAt: user.createdAt ?? undefined,
      })),
    [data]
  );

  const toggleActiveMutation = useMutation({
    mutationFn: async (user: UsersTableItem) => {
      const response = await usersApi.update(user._id, {
        isActive: !user.isActive,
      });
      if (response.error) {
        throw new Error(response.error);
      }
      return response;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Kullanıcı durumu güncellendi');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Durum güncellenemedi');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (user: UsersTableItem) => {
      const response = await usersApi.delete(user._id);
      if (response.error) {
        throw new Error(response.error);
      }
      return response;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Kullanıcı silindi');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Kullanıcı silinemedi');
    },
  });

  const handleToggleActive = (user: UsersTableItem) => {
    toggleActiveMutation.mutate(user);
  };

  const handleDelete = (user: UsersTableItem) => {
    if (!window.confirm(`${user.name} kullanıcısını silmek istediğinize emin misiniz?`)) {
      return;
    }
    deleteMutation.mutate(user);
  };

  const handleEdit = (user: UsersTableItem) => {
    router.push(`/kullanici/${user._id}/duzenle`);
  };



  return (
    <div className="space-y-6" data-testid="users-page">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Kullanıcı Yönetimi</h1>
        <p className="text-sm text-muted-foreground">
          Dernek personel hesaplarını oluşturun, yetkilerini yönetin ve erişimleri denetleyin.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 flex-row items-center justify-between">
          <div>
            <CardTitle>Kullanıcılar</CardTitle>
            <CardDescription>
              Toplam {data?.total ?? users.length} kullanıcı kayıtlı. Arama ve filtreleme ile hızla
              bulun.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <ExportMenu data={users} filename="kullanicilar" title="Kullanıcı Listesi" />
            {canManageUsers ? (
              <Button asChild data-testid="users-create">
                <Link href="/kullanici/yeni">
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Kullanıcı
                </Link>
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <FilterPanel
            fields={filterFields}
            onFiltersChange={handleFiltersChange}
            onReset={resetFilters}
          />

          <UsersTable
            users={users}
            loading={isLoading || isFetching}
            onEdit={canManageUsers ? handleEdit : undefined}
            onDelete={canManageUsers ? handleDelete : undefined}
            onToggleActive={canManageUsers ? handleToggleActive : undefined}
            emptyState={
              <div className="space-y-2">
                <p className="font-medium">Kullanıcı bulunamadı</p>
                <p className="text-sm text-muted-foreground">
                  Filtreleri değiştirmeyi deneyin veya yeni kullanıcı oluşturun.
                </p>
                {canManageUsers ? (
                  <Button size="sm" asChild>
                    <Link href="/kullanici/yeni">Yeni kullanıcı oluştur</Link>
                  </Button>
                ) : null}
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
