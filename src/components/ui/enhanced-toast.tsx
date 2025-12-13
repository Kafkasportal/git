'use client';

import { Toaster } from 'sonner';

export { enhancedToast } from './enhanced-toast-utils';
export type { EnhancedToastOptions } from './enhanced-toast-utils';

export function EnhancedToaster() {
  return (
    <Toaster
      position="top-right"
      richColors={true}
      closeButton={true}
      theme="light"
      expand={true}
      visibleToasts={3}
      gap={8}
      style={{
        fontSize: '14px',
      }}
    />
  );
}
