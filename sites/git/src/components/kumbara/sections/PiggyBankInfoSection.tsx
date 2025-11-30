/**
 * Piggy Bank Information Section for Kumbara Form
 * Extracted from KumbaraForm for better modularity
 * Memoized to prevent unnecessary re-renders
 */

import { memo } from 'react';
import { Control } from 'react-hook-form';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { KumbaraCreateInput } from '@/lib/validations/kumbara';

interface PiggyBankInfoSectionProps {
  control: Control<KumbaraCreateInput>;
}

export const PiggyBankInfoSection = memo(function PiggyBankInfoSection({
  control,
}: PiggyBankInfoSectionProps) {
  return (
    <div className="space-y-2 p-2 bg-blue-50/50 dark:bg-blue-900/10 rounded-md border border-blue-200 dark:border-blue-900/30">
      <div className="flex items-center gap-1.5">
        <span className="text-sm">🏦</span>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Kumbara Bilgileri
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <FormField
          control={control as unknown as Control<KumbaraCreateInput>}
          name="kumbara_location"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-xs font-medium">
                Lokasyon <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input {...field} placeholder="Ofis Giriş, Market" className="h-8 text-sm" />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={control as unknown as Control<KumbaraCreateInput>}
          name="kumbara_institution"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-xs font-medium">
                Kurum/Adres <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input {...field} placeholder="ABC A.Ş. - Merkez Mah." className="h-8 text-sm" />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={control as unknown as Control<KumbaraCreateInput>}
          name="collection_date"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-xs font-medium">
                Tarih <span className="text-red-500">*</span>
              </FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full h-8 pl-2 text-xs text-left font-normal justify-start',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-1.5 h-3 w-3" />
                      {field.value ? (
                        format(new Date(field.value), 'dd.MM.yyyy', { locale: tr })
                      ) : (
                        <span>Tarih seçiniz</span>
                      )}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : new Date()}
                    onSelect={(date) => {
                      if (date) {
                        field.onChange(format(date, 'yyyy-MM-dd'));
                      }
                    }}
                    initialFocus
                    disabled={(date) => date > new Date()}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={control as unknown as Control<KumbaraCreateInput>}
          name="status"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-xs font-medium">
                Durum <span className="text-red-500">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? ''}>
                <FormControl>
                  <SelectTrigger className="h-8 text-sm" data-testid="statusSelect">
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="pending">⏳ Beklemede</SelectItem>
                  <SelectItem value="completed">✅ Tamamlandı</SelectItem>
                  <SelectItem value="cancelled">❌ İptal Edildi</SelectItem>
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
