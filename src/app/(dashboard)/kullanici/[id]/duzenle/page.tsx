'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UserForm, type UserFormValues } from '@/components/forms/user-form';
import { apiClient as api } from '@/lib/api/api-client';
import { useAuthStore } from '@/stores/authStore';
import type { PermissionValue } from '@/types/permissions';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditUserPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const userPermissions = useAuthStore((state) => state.user?.permissions ?? []);
  const canManageUsers = userPermissions.includes('users:manage');

  useEffect(() => {
    if (!canManageUsers) {
      toast.error('Kullanıcı düzenleme yetkiniz bulunmuyor');
      router.replace('/kullanici');
    }
  }, [canManageUsers, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const response = await api.users.getUser(id);
      if (response.error) {
        throw new Error(response.error);
      }
      return response;
    },
    enabled: canManageUsers,
  });

  const user = data?.data;

  const updateMutation = useMutation({
    mutationFn: async (values: UserFormValues) => {
      const payload: Record<string, unknown> = {
        name: values.name,
        email: values.email,
        role: values.role,
        permissions: values.permissions,
        isActive: values.isActive,
        phone: values.phone,
      };

      if (values.password && values.password.trim().length >= 8) {
        payload.password = values.password.trim();
      }

      const response = await api.users.updateUser(id, payload);
      if (response.error) {
        throw new Error(response.error);
      }
      return response;
    },
    onSuccess: () => {
      toast.success('Kullanıcı bilgileri güncellendi');
      void queryClient.invalidateQueries({ queryKey: ['user', id] });
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      router.push('/kullanici');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Kullanıcı güncellenemedi');
    },
  });

  if (!canManageUsers) return null;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Card>
          <CardContent className="space-y-4 pt-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Kullanıcı bulunamadı</h1>
        <p className="text-sm text-muted-foreground">
          Görüntülemek istediğiniz kullanıcı silinmiş veya hiç oluşturulmamış olabilir.
        </p>
      </div>
    );
  }

  const defaultValues: UserFormValues = {
    name: user.name ?? '',
    email: user.email ?? '',
    role: user.role ?? '',
    permissions: (user.permissions ?? []) as PermissionValue[],
    isActive: user.isActive ?? true,
    phone: user.phone ?? '',
    password: '',
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Kullanıcıyı Düzenle</h1>
        <p className="text-sm text-muted-foreground">
          {user.name} kullanıcısının bilgilerini güncelleyin ve erişim yetkilerini düzenleyin.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <UserForm
            defaultValues={defaultValues}
            onSubmit={(values) => updateMutation.mutate(values)}
            onCancel={() => router.back()}
            loading={updateMutation.isPending}
            requirePassword={false}
            includeManageOption
          />
        </CardContent>
      </Card>
    </div>
  );
}
