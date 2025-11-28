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

    try {
      const account = new Account(client);
      const successUrl = redirectUrl || `${window.location.origin}/auth/callback`;
      const failureUrl = `${window.location.origin}/auth/callback?error=oauth_failed`;

      account.createOAuth2Session(OAuthProvider.Google, successUrl, failureUrl);
    } catch (error) {
      logger.error('Google OAuth failed', { error });
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

    try {
      const account = new Account(client);
      const successUrl = redirectUrl || `${window.location.origin}/auth/callback`;
      const failureUrl = `${window.location.origin}/auth/callback?error=oauth_failed`;

      account.createOAuth2Session(OAuthProvider.Github, successUrl, failureUrl);
    } catch (error) {
      logger.error('GitHub OAuth failed', { error });
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

    try {
      const account = new Account(client);
      const successUrl = redirectUrl || `${window.location.origin}/auth/callback`;
      const failureUrl = `${window.location.origin}/auth/callback?error=oauth_failed`;

      account.createOAuth2Session(OAuthProvider.Microsoft, successUrl, failureUrl);
    } catch (error) {
      logger.error('Microsoft OAuth failed', { error });
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

    try {
      const account = new Account(client);
      const successUrl = redirectUrl || `${window.location.origin}/auth/callback`;
      const failureUrl = `${window.location.origin}/auth/callback?error=oauth_failed`;

      account.createOAuth2Session(provider, successUrl, failureUrl);
    } catch (error) {
      logger.error(`OAuth failed for provider ${provider}`, { error });
      throw error;
    }
  },
};

