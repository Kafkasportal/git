'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { PermissionCheckboxGroup } from '@/components/users/permission-checkbox-group';
import { ALL_PERMISSIONS, type PermissionValue } from '@/types/permissions';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const PHONE_REGEX = /^[0-9\s\-\+\(\)]{10,15}$/;

const PERMISSION_VALUES = ALL_PERMISSIONS as readonly [PermissionValue, ...PermissionValue[]];

const baseSchema = z.object({
  name: z.string().min(2, 'Ad Soyad en az 2 karakter olmalıdır'),
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  phone: z
    .string()
    .optional()
    .refine((value) => !value || PHONE_REGEX.test(value), {
      message: 'Geçerli bir telefon numarası giriniz',
    }),
  role: z.string().min(2, 'Rol bilgisi en az 2 karakter olmalıdır'),
  permissions: z.array(z.enum(PERMISSION_VALUES)).min(1, 'En az bir modül seçilmelidir'),
  isActive: z.boolean(),
  password: z.string().optional(),
});

export type UserFormValues = z.infer<typeof baseSchema>;

const generateSecurePassword = () => {
  const length = 12;
  // Use crypto.getRandomValues for secure random generation
  const charset = {
    upper: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
    lower: 'abcdefghijkmnopqrstuvwxyz',
    numbers: '23456789',
    symbols: '!@#$%&*?',
  };

  const allChars = charset.upper + charset.lower + charset.numbers + charset.symbols;
  const array = new Uint8Array(length);

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for environments without crypto (should not happen in modern browsers)
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }

  let password = '';
  for (let i = 0; i < length; i++) {
    password += allChars[array[i] % allChars.length];
  }
  return password;
};

interface UserFormProps {
  defaultValues?: Partial<UserFormValues>;
  onSubmit: (values: UserFormValues) => void;
  onCancel?: () => void;
  className?: string;
  loading?: boolean;
  requirePassword?: boolean;
  includeManageOption?: boolean;
}

export function UserForm({
  defaultValues,
  onSubmit,
  onCancel,
  className,
  loading,
  requirePassword = true,
  includeManageOption = false,
}: UserFormProps) {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      email: defaultValues?.email ?? '',
      phone: defaultValues?.phone ?? '',
      role: defaultValues?.role ?? '',
      permissions: defaultValues?.permissions ?? [],
      isActive: defaultValues?.isActive ?? true,
      password: '',
    },
  });

  const handleGeneratePassword = () => {
    const password = generateSecurePassword();
    form.setValue('password', password, { shouldDirty: true });
    toast.success('Güçlü şifre oluşturuldu');
  };

  const handleSubmit = form.handleSubmit((values) => {
    if (requirePassword && (!values.password || values.password.trim().length < 8)) {
      form.setError('password', {
        type: 'manual',
        message: 'Şifre en az 8 karakter olmalıdır',
      });
      return;
    }

    const payload: UserFormValues = {
      ...values,
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      role: values.role.trim(),
      phone: values.phone && values.phone.trim().length > 0 ? values.phone.trim() : undefined,
      permissions: Array.from(new Set(values.permissions)) as PermissionValue[],
      password:
        values.password && values.password.trim().length > 0 ? values.password.trim() : undefined,
    };

    onSubmit(payload);
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ad Soyad *</FormLabel>
                <FormControl>
                  <Input placeholder="Örn. Ahmet Yılmaz" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-posta *</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="personel@dernek.org"
                    autoComplete="off"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefon</FormLabel>
                <FormControl>
                  <Input placeholder="+90 5XX XXX XX XX" {...field} />
                </FormControl>
                <FormDescription>10-15 haneli telefon numarası girin (opsiyonel)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Görev / Rol *</FormLabel>
                <FormControl>
                  <Input placeholder="Örn. Dernek Başkanı, Muhasebe Sorumlusu" {...field} />
                </FormControl>
                <FormDescription>
                  Kullanıcının sistemde görüntüleneceği unvan. Serbest metin olarak girin.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="permissions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Modül Erişimleri *</FormLabel>
              <PermissionCheckboxGroup
                value={field.value as PermissionValue[]}
                onChange={field.onChange}
                includeManageOption={includeManageOption}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>Hesap Durumu</FormLabel>
                  <FormDescription>
                    Pasif kullanıcılar giriş yapamaz. Yeniden etkinleştirmek için bu anahtarı açın.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Şifre {requirePassword ? '*' : '(Opsiyonel)'}</FormLabel>
                <div className="flex items-center gap-2">
                  <FormControl>
                    <Input type="password" placeholder="Güçlü bir şifre girin" {...field} />
                  </FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGeneratePassword}
                    disabled={loading}
                  >
                    Oluştur
                  </Button>
                </div>
                <FormDescription>
                  En az 8 karakter, büyük/küçük harf, rakam ve özel karakter içermesi önerilir.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              İptal
            </Button>
          ) : null}
          <Button type="submit" disabled={loading}>
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
