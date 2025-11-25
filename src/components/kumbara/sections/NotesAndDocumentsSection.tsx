/**
 * Notes and Documents Section for Kumbara Form
 * Extracted from KumbaraForm for better modularity
 */

import { Control } from 'react-hook-form';
import { CheckCircle2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { FileUpload } from '@/components/ui/file-upload';
import type { KumbaraCreateInput } from '@/lib/validations/kumbara';

interface NotesAndDocumentsSectionProps {
  control: Control<KumbaraCreateInput>;
  onFileSelect: (file: File | null, sanitizedFilename?: string) => void;
  uploadedFileName: string;
  isPending: boolean;
}

export function NotesAndDocumentsSection({
  control,
  onFileSelect,
  uploadedFileName,
  isPending,
}: NotesAndDocumentsSectionProps) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {/* Notlar */}
      <div className="space-y-1 p-1.5 bg-amber-50/50 dark:bg-amber-900/10 rounded border border-amber-200 dark:border-amber-900/30">
        <div className="flex items-center gap-1">
          <span className="text-xs">📝</span>
          <h3 className="text-[10px] font-medium text-gray-900 dark:text-gray-100">Notlar</h3>
        </div>
        <FormField
          control={control as unknown as Control<KumbaraCreateInput>}
          name="notes"
          render={({ field }) => (
            <FormItem className="mb-0">
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="..."
                  rows={1}
                  className="resize-none text-xs h-8 py-1"
                />
              </FormControl>
              <FormMessage className="text-[10px]" />
            </FormItem>
          )}
        />
      </div>

      {/* Dosya Yükleme */}
      <div className="space-y-1 p-1.5 bg-purple-50/50 dark:bg-purple-900/10 rounded border border-purple-200 dark:border-purple-900/30">
        <div className="flex items-center gap-1">
          <span className="text-xs">📎</span>
          <h3 className="text-[10px] font-medium text-gray-900 dark:text-gray-100">Belge</h3>
        </div>
        <FileUpload
          onFileSelect={onFileSelect}
          accept="image/*,.pdf"
          maxSize={10}
          placeholder="Seç"
          disabled={isPending}
          allowedTypes={['image/jpeg', 'image/png', 'image/webp', 'application/pdf']}
          allowedExtensions={['jpg', 'jpeg', 'png', 'webp', 'pdf']}
          className="space-y-1"
          compact={true}
        />
        {uploadedFileName && (
          <div className="text-[10px] text-green-600 dark:text-green-400 flex items-center gap-0.5">
            <CheckCircle2 className="h-2.5 w-2.5" />
            <span className="truncate">{uploadedFileName}</span>
          </div>
        )}
      </div>
    </div>
  );
}
