/**
 * Donor Information Section for Kumbara Form
 * Extracted from KumbaraForm for better modularity
 * Memoized to prevent unnecessary re-renders
 */

import { memo } from 'react';
import { Control } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { KumbaraCreateInput } from '@/lib/validations/kumbara';

interface DonorInfoSectionProps {
  control: Control<KumbaraCreateInput>;
}

export const DonorInfoSection = memo(function DonorInfoSection({ control }: DonorInfoSectionProps) {
  return (
    <div className="space-y-2 p-2 bg-gray-50/50 dark:bg-gray-900/20 rounded-md border border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-1.5">
        <span className="text-sm">👤</span>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Bağışçı Bilgileri
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <FormField
          control={control as unknown as Control<KumbaraCreateInput>}
          name="donor_name"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-xs font-medium">
                Bağışçı Adı <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input {...field} placeholder="Ahmet Yılmaz" className="h-8 text-sm" autoFocus />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={control as unknown as Control<KumbaraCreateInput>}
          name="donor_phone"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-xs font-medium">
                Telefon <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="5XX XXX XX XX"
                  className="h-8 text-sm"
                  maxLength={11}
                  onChange={(e) => {
                    // Only allow numbers
                    const value = e.target.value.replace(/\D/g, '');
                    field.onChange(value);
                  }}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={control as unknown as Control<KumbaraCreateInput>}
          name="donor_email"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-xs font-medium">E-posta</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  {...field}
                  placeholder="ornek@email.com"
                  className="h-8 text-sm"
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={control as unknown as Control<KumbaraCreateInput>}
          name="receipt_number"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-xs font-medium">
                Makbuz No <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input {...field} placeholder="KB-2024-001" className="h-8 text-sm font-mono" />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
});
