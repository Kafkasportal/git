/**
 * Location Information Section for Kumbara Form
 * Extracted from KumbaraForm for better modularity
 * Memoized to prevent unnecessary re-renders
 */

import { memo, useCallback } from 'react';
import { Control, ControllerRenderProps } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { KumbaraCreateInput } from '@/lib/validations/kumbara';

interface LocationSectionProps {
  control: Control<KumbaraCreateInput>;
}

export const LocationSection = memo(function LocationSection({ control }: LocationSectionProps) {
  // Handle coordinate updates - memoized
  const handleCoordinateChange = useCallback(
    (
      field: ControllerRenderProps<KumbaraCreateInput, 'location_coordinates'>,
      type: 'lat' | 'lng',
      value: string
    ) => {
      const currentValue = field.value;
      const currentLat = currentValue?.lat;
      const currentLng = currentValue?.lng;
      const numValue = value.trim() === '' ? undefined : parseFloat(value);

      if (value.trim() === '') {
        field.onChange(undefined);
        return;
      }

      if (numValue === undefined || isNaN(numValue)) {
        return;
      }

      const newLat = type === 'lat' ? numValue : currentLat;
      const newLng = type === 'lng' ? numValue : currentLng;

      if (newLat !== undefined && newLng !== undefined && !isNaN(newLat) && !isNaN(newLng)) {
        field.onChange({ lat: newLat, lng: newLng });
      }
    },
    []
  );

  return (
    <div className="space-y-2 p-2 bg-green-50/50 dark:bg-green-900/10 rounded-md border border-green-200 dark:border-green-900/30">
      <div className="flex items-center gap-1.5">
        <span className="text-sm">📍</span>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Konum (Opsiyonel)
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <FormField
          control={control as unknown as Control<KumbaraCreateInput>}
          name="location_address"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-xs font-medium">Adres</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Merkez Mah. No:123" className="h-8 text-sm" />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <FormField
          control={control as unknown as Control<KumbaraCreateInput>}
          name="location_coordinates"
          render={({ field }) => {
            const currentLat = field.value?.lat;
            const currentLng = field.value?.lng;

            return (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs font-medium">Koordinatlar</FormLabel>
                <div className="flex gap-1.5">
                  <Input
                    placeholder="Lat"
                    className="h-8 text-xs"
                    type="number"
                    step="any"
                    value={currentLat !== undefined && currentLat !== null ? currentLat : ''}
                    onChange={(e) => handleCoordinateChange(field, 'lat', e.target.value)}
                  />
                  <Input
                    placeholder="Lng"
                    className="h-8 text-xs"
                    type="number"
                    step="any"
                    value={currentLng !== undefined && currentLng !== null ? currentLng : ''}
                    onChange={(e) => handleCoordinateChange(field, 'lng', e.target.value)}
                  />
                </div>
                <FormMessage className="text-xs" />
              </FormItem>
            );
          }}
        />
      </div>
    </div>
  );
});
