'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Account } from 'appwrite';
import { client } from '@/lib/appwrite/client';
import { useAuthStore } from '@/stores/authStore';
import logger from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    async function handleCallback() {
      try {
        // Check for error in URL
        const error = searchParams.get('error');
        if (error) {
          throw new Error('OAuth authentication failed');
        }

        if (!client) {
          throw new Error('Appwrite client not initialized');
        }

        // Get OAuth session from URL
        const account = new Account(client);
        
        // Try to get current session
        try {
          const session = await account.getSession('current');
          
          if (!session) {
            throw new Error('Session not found');
          }

          // Get user info
          const user = await account.get();
          
          if (!user) {
            throw new Error('User not found');
          }

          // Update auth store
          setUser({
            id: user.$id,
            email: user.email,
            name: user.name || user.email.split('@')[0],
          });

          setStatus('success');
          logger.info('OAuth callback successful', { userId: user.$id });

          // Redirect to dashboard after short delay
          setTimeout(() => {
            router.push('/genel');
          }, 1500);
        } catch (sessionError) {
          // If no session, user might need to complete OAuth flow
          // Try to get user anyway (some providers work differently)
          try {
            const user = await account.get();
            if (user) {
              setUser({
                id: user.$id,
                email: user.email,
                name: user.name || user.email.split('@')[0],
              });
              setStatus('success');
              setTimeout(() => {
                router.push('/genel');
              }, 1500);
              return;
            }
          } catch (userError) {
            logger.error('Failed to get user after OAuth', { error: userError });
          }
          
          throw sessionError;
        }
      } catch (error) {
        logger.error('OAuth callback failed', { error });
        setStatus('error');
        setErrorMessage(
          error instanceof Error 
            ? error.message 
            : 'OAuth authentication failed. Please try again.'
        );
      }
    }

    handleCallback();
  }, [router, searchParams, setUser]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>OAuth Authentication</CardTitle>
          <CardDescription>Completing sign in process...</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Giriş yapılıyor...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
              <p className="text-sm font-medium mb-2">Başarıyla giriş yapıldı!</p>
              <p className="text-xs text-muted-foreground">Yönlendiriliyorsunuz...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-sm font-medium text-red-600 mb-2">Giriş başarısız</p>
              <p className="text-xs text-muted-foreground mb-4 text-center">
                {errorMessage}
              </p>
              <Button
                onClick={() => router.push('/login')}
                variant="outline"
                className="w-full"
              >
                Giriş Sayfasına Dön
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

