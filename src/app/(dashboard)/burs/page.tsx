'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Burs Index Page
 * Redirects to scholarship applications page
 */
export default function BursIndexPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to scholarship applications page
    router.replace('/burs/basvurular');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <p className="text-muted-foreground">Yönlendiriliyor...</p>
      </div>
    </div>
  );
}
