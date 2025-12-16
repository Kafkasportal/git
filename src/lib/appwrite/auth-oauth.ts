/**
 * OAuth Authentication Helpers
 * 
 * Client-side OAuth authentication with Appwrite
 */

'use client';

import { Account, OAuthProvider } from 'appwrite';
import { client } from './client';
import logger from '@/lib/logger';

/**
 * Build absolute URL from relative or absolute URL
 * Validates and ensures the URL is properly formatted for Appwrite
 */
function buildAbsoluteUrl(url: string): string {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    throw new Error('URL cannot be empty');
  }

  const trimmedUrl = url.trim();

  // If already absolute, validate and return
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    try {
      // Validate the absolute URL
      new URL(trimmedUrl);
      return trimmedUrl;
    } catch (error) {
      throw new Error(`Invalid absolute URL: ${trimmedUrl}`);
    }
  }

  // Get origin from window
  if (typeof window === 'undefined') {
    throw new Error('Cannot build absolute URL: window is not available');
  }

  const origin = window.location.origin;
  if (!origin) {
    throw new Error('Cannot build absolute URL: window.location.origin is not available');
  }

  // Ensure URL starts with /
  const path = trimmedUrl.startsWith('/') ? trimmedUrl : `/${trimmedUrl}`;
  
  // Manually construct URL to avoid any formatting issues
  // Remove trailing slash from origin if present
  const cleanOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
  const absoluteUrl = `${cleanOrigin}${path}`;
  
  // Validate the constructed URL
  try {
    new URL(absoluteUrl);
    return absoluteUrl;
  } catch (error) {
    throw new Error(`Failed to build valid absolute URL from: ${trimmedUrl} with origin: ${origin}`);
  }
}

/**
 * OAuth authentication helper
 */
export const oauthAuth = {
  /**
   * Google OAuth ile giriş
   */
  async loginWithGoogle(redirectUrl?: string) {
    if (!client) {
      throw new Error('Appwrite client not initialized');
    }

    if (typeof window === 'undefined') {
      throw new Error('OAuth login can only be called from the browser');
    }

    // Ensure window.location is available
    if (!window.location || !window.location.origin) {
      throw new Error('window.location.origin is not available. Please ensure this is called from a browser context.');
    }

    try {
      const account = new Account(client);
      
      // Always use the callback endpoint for OAuth success
      // The redirectUrl parameter is for where to go AFTER the callback processes
      const successUrl = buildAbsoluteUrl('/api/auth/oauth/callback');
      const failureUrl = buildAbsoluteUrl('/login?error=oauth_failed');

      // Final validation - ensure URLs are valid
      try {
        new URL(successUrl);
        new URL(failureUrl);
      } catch (urlError) {
        const errorMsg = `Invalid URL format - successUrl: ${successUrl}, failureUrl: ${failureUrl}, error: ${urlError}`;
        logger.error('URL validation failed', { successUrl, failureUrl, error: urlError });
        throw new Error(errorMsg);
      }

      logger.info('Initiating Google OAuth', { 
        successUrl, 
        failureUrl,
        redirectUrl: redirectUrl || 'not provided',
        origin: window.location.origin,
        href: window.location.href
      });
      
      account.createOAuth2Session(OAuthProvider.Google, successUrl, failureUrl);
    } catch (error) {
      logger.error('Google OAuth failed', { 
        error, 
        redirectUrl,
        origin: window.location?.origin,
        href: window.location?.href
      });
      throw error;
    }
  },

  /**
   * GitHub OAuth ile giriş
   */
  async loginWithGitHub(redirectUrl?: string) {
    if (!client) {
      throw new Error('Appwrite client not initialized');
    }

    if (typeof window === 'undefined') {
      throw new Error('OAuth login can only be called from the browser');
    }

    try {
      const account = new Account(client);
      const successUrl = buildAbsoluteUrl('/api/auth/oauth/callback');
      const failureUrl = buildAbsoluteUrl('/login?error=oauth_failed');

      logger.info('Initiating GitHub OAuth', { 
        successUrl, 
        failureUrl,
        redirectUrl: redirectUrl || 'not provided'
      });
      
      try {
        new URL(successUrl);
        new URL(failureUrl);
      } catch (urlError) {
        throw new Error(`Invalid URL format: ${urlError}`);
      }
      
      account.createOAuth2Session(OAuthProvider.Github, successUrl, failureUrl);
    } catch (error) {
      logger.error('GitHub OAuth failed', { error, redirectUrl });
      throw error;
    }
  },

  /**
   * Microsoft OAuth ile giriş
   */
  async loginWithMicrosoft(redirectUrl?: string) {
    if (!client) {
      throw new Error('Appwrite client not initialized');
    }

    if (typeof window === 'undefined') {
      throw new Error('OAuth login can only be called from the browser');
    }

    try {
      const account = new Account(client);
      const successUrl = buildAbsoluteUrl('/api/auth/oauth/callback');
      const failureUrl = buildAbsoluteUrl('/login?error=oauth_failed');

      logger.info('Initiating Microsoft OAuth', { 
        successUrl, 
        failureUrl,
        redirectUrl: redirectUrl || 'not provided'
      });
      
      try {
        new URL(successUrl);
        new URL(failureUrl);
      } catch (urlError) {
        throw new Error(`Invalid URL format: ${urlError}`);
      }
      
      account.createOAuth2Session(OAuthProvider.Microsoft, successUrl, failureUrl);
    } catch (error) {
      logger.error('Microsoft OAuth failed', { error, redirectUrl });
      throw error;
    }
  },

  /**
   * Custom OAuth provider ile giriş
   */
  async loginWithProvider(provider: OAuthProvider, redirectUrl?: string) {
    if (!client) {
      throw new Error('Appwrite client not initialized');
    }

    if (typeof window === 'undefined') {
      throw new Error('OAuth login can only be called from the browser');
    }

    try {
      const account = new Account(client);
      const successUrl = buildAbsoluteUrl('/api/auth/oauth/callback');
      const failureUrl = buildAbsoluteUrl('/login?error=oauth_failed');

      logger.info(`Initiating OAuth for provider ${provider}`, { 
        successUrl, 
        failureUrl,
        redirectUrl: redirectUrl || 'not provided'
      });
      
      try {
        new URL(successUrl);
        new URL(failureUrl);
      } catch (urlError) {
        throw new Error(`Invalid URL format: ${urlError}`);
      }
      
      account.createOAuth2Session(provider, successUrl, failureUrl);
    } catch (error) {
      logger.error(`OAuth failed for provider ${provider}`, { error, redirectUrl });
      throw error;
    }
  },
};

