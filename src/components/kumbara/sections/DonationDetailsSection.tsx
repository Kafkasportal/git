/**
 * Donation Details Section for Kumbara Form
 * Extracted from KumbaraForm for better modularity
 * Memoized to prevent unnecessary re-renders
 */

import { memo } from 'react';
import { Control } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useCurrencyFormat } from '../hooks/useCurrencyFormat';
import type { KumbaraCreateInput } from '@/lib/validations/kumbara';

interface DonationDetailsSectionProps {
  control: Control<KumbaraCreateInput>;
  currentCurrency: 'TRY' | 'USD' | 'EUR';
}

export const DonationDetailsSection = memo(function DonationDetailsSection({
  control,
  currentCurrency,
}: DonationDetailsSectionProps) {
  const { getCurrencySymbol } = useCurrencyFormat();

  return (
    <div className="space-y-2 p-2 bg-green-50/50 dark:bg-green-900/10 rounded-md border border-green-200 dark:border-green-900/30">
      <div className="flex items-center gap-1.5">
        <span className="text-sm">💰</span>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Bağış Detayları</h3>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <FormField
          control={control as unknown as Control<KumbaraCreateInput>}
          name="amount"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-xs font-medium">
                Tutar <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      field.onChange(value);
                    }}
                    placeholder="0.00"
                    className="h-8 pr-12 text-sm font-semibold"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                    {getCurrencySymbol(currentCurrency)}
                  </span>
                </div>
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={control as unknown as Control<KumbaraCreateInput>}
          name="currency"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-xs font-medium">
                Para Birimi <span className="text-red-500">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? ''}>
                <FormControl>
                  <SelectTrigger className="h-8 text-sm" data-testid="currencySelect">
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="TRY">🇹🇷 TRY (₺)</SelectItem>
                  <SelectItem value="USD">🇺🇸 USD ($)</SelectItem>
                  <SelectItem value="EUR">🇪🇺 EUR (€)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={control as unknown as Control<KumbaraCreateInput>}
          name="payment_method"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-xs font-medium">
                Ödeme <span className="text-red-500">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? ''}>
                <FormControl>
                  <SelectTrigger className="h-8 text-sm" data-testid="paymentMethodSelect">
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Nakit">💵 Nakit</SelectItem>
                  <SelectItem value="Banka Kartı">💳 Banka Kartı</SelectItem>
                  <SelectItem value="Kredi Kartı">💳 Kredi Kartı</SelectItem>
                  <SelectItem value="Havale/EFT">🏦 Havale/EFT</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
});
