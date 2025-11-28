'use client';

import { Button } from '@/components/ui/button';
import { oauthAuth } from '@/lib/appwrite/auth-oauth';
import { Github, Chrome, Mail } from 'lucide-react';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import logger from '@/lib/logger';

interface OAuthButtonProps {
  provider: 'google' | 'github' | 'microsoft';
  redirectUrl?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function OAuthButton({ 
  provider, 
  redirectUrl,
  className,
  variant = 'outline',
  size = 'default',
}: OAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleOAuth = async () => {
    setIsLoading(true);
    try {
      switch (provider) {
        case 'google':
          await oauthAuth.loginWithGoogle(redirectUrl);
          break;
        case 'github':
          await oauthAuth.loginWithGitHub(redirectUrl);
          break;
        case 'microsoft':
          await oauthAuth.loginWithMicrosoft(redirectUrl);
          break;
      }
    } catch (error) {
      logger.error(`OAuth login failed for ${provider}`, error as Error, { provider });
      toast.error(`Giriş başarısız. Lütfen tekrar deneyin.`);
      setIsLoading(false);
    }
  };

  const icons = {
    google: Chrome,
    github: Github,
    microsoft: Mail, // You can replace with Microsoft icon if available
  };

  const labels = {
    google: 'Google ile Giriş',
    github: 'GitHub ile Giriş',
    microsoft: 'Microsoft ile Giriş',
  };

  const Icon = icons[provider];

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleOAuth}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Icon className="mr-2 h-4 w-4" />
      )}
      {labels[provider]}
    </Button>
  );
}

