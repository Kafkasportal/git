'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UsersTable, type UsersTableItem } from '@/components/tables/users-table';
import { apiClient as api } from '@/lib/api/api-client';
import { useAuthStore } from '@/stores/authStore';
import type { PermissionValue } from '@/types/permissions';

type StatusFilter = 'all' | 'active' | 'inactive';
type UsersListResponse = Awaited<ReturnType<(typeof api)['users']['getUsers']>>;

const buildQueryParams = (search: string, roleFilter: string, statusFilter: StatusFilter) => {
  const params = new URLSearchParams();
  if (search.trim()) params.set('search', search.trim());
  if (roleFilter !== 'all') params.set('role', roleFilter);
  if (statusFilter !== 'all') params.set('isActive', String(statusFilter === 'active'));
  return params;
};

export default function UsersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const userPermissions = useAuthStore((state) => state.user?.permissions ?? []);

  const initialSearch = searchParams.get('search') ?? '';
  const initialRole = searchParams.get('role') ?? 'all';
  const initialStatus = searchParams.get('isActive') ?? 'all';

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [roleFilter, setRoleFilter] = useState(initialRole);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    initialStatus === 'true' ? 'active' : initialStatus === 'false' ? 'inactive' : 'all'
  );

  const canManageUsers = useMemo(() => userPermissions.includes('users:manage'), [userPermissions]);

  const { data, isLoading, isFetching } = useQuery<UsersListResponse>({
    queryKey: ['users', searchTerm, roleFilter, statusFilter],
    queryFn: async () => {
      const response = await api.users.getUsers({
        search: searchTerm || undefined,
        filters: {
          role: roleFilter !== 'all' ? roleFilter : undefined,
          isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
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
      const response = await api.users.updateUser(user._id, {
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
      const response = await api.users.deleteUser(user._id);
      if (response.error) {
        throw new Error(response.error);
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
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

  const updateQueryString = (nextSearch: string, nextRole: string, nextStatus: StatusFilter) => {
    const params = buildQueryParams(nextSearch, nextRole, nextStatus);
    const url = params.toString() ? `/kullanici?${params.toString()}` : '/kullanici';
    router.replace(url);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    updateQueryString(value, roleFilter, statusFilter);
  };

  const handleRoleChange = (value: string) => {
    setRoleFilter(value);
    updateQueryString(searchTerm, value, statusFilter);
  };

  const handleStatusChange = (value: string) => {
    const status = value as StatusFilter;
    setStatusFilter(status);
    updateQueryString(searchTerm, roleFilter, status);
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
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Kullanıcılar</CardTitle>
            <CardDescription>
              Toplam {data?.total ?? users.length} kullanıcı kayıtlı. Arama ve filtreleme ile hızla
              bulun.
            </CardDescription>
          </div>

          {canManageUsers ? (
            <Button asChild data-testid="users-create">
              <Link href="/kullanici/yeni">
                <Plus className="mr-2 h-4 w-4" />
                Yeni Kullanıcı
              </Link>
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <label htmlFor="users-search" className="text-sm font-medium leading-none">
                Ara
              </label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="users-search"
                  data-testid="users-search"
                  placeholder="Ad, e-posta veya telefon ile ara..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(event) => {
                    handleSearchChange(event.target.value);
                  }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="users-role-filter" className="text-sm font-medium leading-none">
                Görev
              </label>
              <Select value={roleFilter} onValueChange={handleRoleChange}>
                <SelectTrigger
                  id="users-role-filter"
                  data-testid="users-filter-role"
                  className="mt-2"
                >
                  <SelectValue placeholder="Tümü" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="Dernek Başkanı">Dernek Başkanı</SelectItem>
                  <SelectItem value="Muhasebe">Muhasebe</SelectItem>
                  <SelectItem value="Sosyal Yardım">Sosyal Yardım</SelectItem>
                  <SelectItem value="Gönüllü">Gönüllü</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="users-status-filter" className="text-sm font-medium leading-none">
                Durum
              </label>
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger
                  id="users-status-filter"
                  data-testid="users-filter-status"
                  className="mt-2"
                >
                  <SelectValue placeholder="Tümü" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Pasif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

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
