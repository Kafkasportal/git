'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { UserForm, type UserFormValues } from '@/components/forms/user-form';
import { apiClient as api } from '@/lib/api/api-client';
import { useAuthStore } from '@/stores/authStore';

export default function CreateUserPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const userPermissions = useAuthStore((state) => state.user?.permissions ?? []);
  const canManageUsers = userPermissions.includes('users:manage');

  useEffect(() => {
    if (!canManageUsers) {
      toast.error('Kullanıcı oluşturma yetkiniz bulunmuyor');
      router.replace('/kullanici');
    }
  }, [canManageUsers, router]);

  const createMutation = useMutation({
    mutationFn: async (values: UserFormValues) => {
      const response = await api.users.createUser({
        name: values.name,
        email: values.email,
        role: values.role,
        permissions: values.permissions,
        password: values.password,
        isActive: values.isActive,
        phone: values.phone,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      return response;
    },
    onSuccess: () => {
      toast.success('Kullanıcı başarıyla oluşturuldu');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      router.push('/kullanici');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Kullanıcı oluşturulamadı');
    },
  });

  if (!canManageUsers) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Yeni Kullanıcı</h1>
        <p className="text-sm text-muted-foreground">
          Dernek ekibine yeni bir kullanıcı ekleyin ve modül erişim yetkilerini belirleyin.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <UserForm
            onSubmit={(values) => {
              createMutation.mutate(values);
            }}
            onCancel={() => {
              router.back();
            }}
            loading={createMutation.isPending}
            requirePassword
            includeManageOption
          />
        </CardContent>
      </Card>
    </div>
  );
}
