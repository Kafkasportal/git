/**
 * Appwrite Authentication
 *
 * Authentication helpers for Appwrite.
 */

import { ID, type Models } from 'appwrite';
import { account, isAppwriteReady } from './client';
import { serverUsers, isServerClientReady } from './server';
import logger from '@/lib/logger';

// User type from Appwrite
export type AppwriteUser = Models.User<Models.Preferences>;

// Session type from Appwrite
export type AppwriteSession = Models.Session;

/**
 * Authentication operations
 */
export const appwriteAuth = {
  /**
   * Create a new user account
   */
  async createAccount(
    email: string,
    password: string,
    name: string
  ): Promise<{ user: AppwriteUser | null; error: string | null }> {
    if (!isAppwriteReady() || !account) {
      return { user: null, error: 'Appwrite not configured' };
    }

    try {
      const user = await account.create(ID.unique(), email, password, name);
      return { user, error: null };
    } catch (error) {
      logger.error('Failed to create account', { error, email });
      return {
        user: null,
        error: error instanceof Error ? error.message : 'Failed to create account',
      };
    }
  },

  /**
   * Create email session (login)
   */
  async createSession(
    email: string,
    password: string
  ): Promise<{ session: AppwriteSession | null; error: string | null }> {
    if (!isAppwriteReady() || !account) {
      return { session: null, error: 'Appwrite not configured' };
    }

    try {
      const session = await account.createEmailPasswordSession(email, password);
      return { session, error: null };
    } catch (error) {
      logger.error('Failed to create session', { error, email });
      return {
        session: null,
        error: error instanceof Error ? error.message : 'Invalid credentials',
      };
    }
  },

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<{ user: AppwriteUser | null; error: string | null }> {
    if (!isAppwriteReady() || !account) {
      return { user: null, error: 'Appwrite not configured' };
    }

    try {
      const user = await account.get();
      return { user, error: null };
    } catch {
      // Not logged in is not an error
      return { user: null, error: null };
    }
  },

  /**
   * Delete current session (logout)
   */
  async deleteSession(): Promise<{ success: boolean; error: string | null }> {
    if (!isAppwriteReady() || !account) {
      return { success: false, error: 'Appwrite not configured' };
    }

    try {
      await account.deleteSession('current');
      return { success: true, error: null };
    } catch (error) {
      logger.error('Failed to delete session', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to logout',
      };
    }
  },

  /**
   * Delete all sessions for current user
   */
  async deleteAllSessions(): Promise<{ success: boolean; error: string | null }> {
    if (!isAppwriteReady() || !account) {
      return { success: false, error: 'Appwrite not configured' };
    }

    try {
      await account.deleteSessions();
      return { success: true, error: null };
    } catch (error) {
      logger.error('Failed to delete all sessions', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to logout from all devices',
      };
    }
  },

  /**
   * Update password
   */
  async updatePassword(
    newPassword: string,
    oldPassword: string
  ): Promise<{ success: boolean; error: string | null }> {
    if (!isAppwriteReady() || !account) {
      return { success: false, error: 'Appwrite not configured' };
    }

    try {
      await account.updatePassword(newPassword, oldPassword);
      return { success: true, error: null };
    } catch (error) {
      logger.error('Failed to update password', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update password',
      };
    }
  },

  /**
   * Send password recovery email
   */
  async sendPasswordRecovery(
    email: string,
    redirectUrl: string
  ): Promise<{ success: boolean; error: string | null }> {
    if (!isAppwriteReady() || !account) {
      return { success: false, error: 'Appwrite not configured' };
    }

    try {
      await account.createRecovery(email, redirectUrl);
      return { success: true, error: null };
    } catch (error) {
      logger.error('Failed to send password recovery', { error, email });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send recovery email',
      };
    }
  },

  /**
   * Confirm password recovery
   */
  async confirmPasswordRecovery(
    userId: string,
    secret: string,
    password: string
  ): Promise<{ success: boolean; error: string | null }> {
    if (!isAppwriteReady() || !account) {
      return { success: false, error: 'Appwrite not configured' };
    }

    try {
      await account.updateRecovery(userId, secret, password);
      return { success: true, error: null };
    } catch (error) {
      logger.error('Failed to confirm password recovery', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reset password',
      };
    }
  },

  /**
   * Get list of sessions for current user
   */
  async getSessions(): Promise<{ sessions: AppwriteSession[] | null; error: string | null }> {
    if (!isAppwriteReady() || !account) {
      return { sessions: null, error: 'Appwrite not configured' };
    }

    try {
      const response = await account.listSessions();
      return { sessions: response.sessions, error: null };
    } catch (error) {
      logger.error('Failed to get sessions', { error });
      return {
        sessions: null,
        error: error instanceof Error ? error.message : 'Failed to get sessions',
      };
    }
  },

  /**
   * Create JWT for API authentication
   */
  async createJWT(): Promise<{ jwt: string | null; error: string | null }> {
    if (!isAppwriteReady() || !account) {
      return { jwt: null, error: 'Appwrite not configured' };
    }

    try {
      const response = await account.createJWT();
      return { jwt: response.jwt, error: null };
    } catch (error) {
      logger.error('Failed to create JWT', { error });
      return {
        jwt: null,
        error: error instanceof Error ? error.message : 'Failed to create JWT',
      };
    }
  },

  /**
   * Verify email with verification link
   */
  async createEmailVerification(
    redirectUrl: string
  ): Promise<{ success: boolean; error: string | null }> {
    if (!isAppwriteReady() || !account) {
      return { success: false, error: 'Appwrite not configured' };
    }

    try {
      await account.createVerification(redirectUrl);
      return { success: true, error: null };
    } catch (error) {
      logger.error('Failed to create email verification', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send verification email',
      };
    }
  },

  /**
   * Confirm email verification
   */
  async confirmEmailVerification(
    userId: string,
    secret: string
  ): Promise<{ success: boolean; error: string | null }> {
    if (!isAppwriteReady() || !account) {
      return { success: false, error: 'Appwrite not configured' };
    }

    try {
      await account.updateVerification(userId, secret);
      return { success: true, error: null };
    } catch (error) {
      logger.error('Failed to confirm email verification', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify email',
      };
    }
  },
};

// Server-side auth operations
export const appwriteServerAuth = {
  /**
   * Create user (server-side, admin)
   */
  async createUser(
    userId: string,
    email: string,
    password: string,
    name: string
  ): Promise<{ user: AppwriteUser | null; error: string | null }> {
    if (!isServerClientReady() || !serverUsers) {
      return { user: null, error: 'Appwrite server not configured' };
    }

    try {
      const user = await serverUsers.create(userId, email, undefined, password, name);
      return { user, error: null };
    } catch (error) {
      logger.error('Failed to create user (server)', { error, email });
      return {
        user: null,
        error: error instanceof Error ? error.message : 'Failed to create user',
      };
    }
  },

  /**
   * Get user by ID (server-side, admin)
   */
  async getUser(userId: string): Promise<{ user: AppwriteUser | null; error: string | null }> {
    if (!isServerClientReady() || !serverUsers) {
      return { user: null, error: 'Appwrite server not configured' };
    }

    try {
      const user = await serverUsers.get(userId);
      return { user, error: null };
    } catch (error) {
      logger.error('Failed to get user (server)', { error, userId });
      return {
        user: null,
        error: error instanceof Error ? error.message : 'Failed to get user',
      };
    }
  },

  /**
   * Delete user (server-side, admin)
   */
  async deleteUser(userId: string): Promise<{ success: boolean; error: string | null }> {
    if (!isServerClientReady() || !serverUsers) {
      return { success: false, error: 'Appwrite server not configured' };
    }

    try {
      await serverUsers.delete(userId);
      return { success: true, error: null };
    } catch (error) {
      logger.error('Failed to delete user (server)', { error, userId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete user',
      };
    }
  },

  /**
   * List users (server-side, admin)
   */
  async listUsers(
    queries?: string[]
  ): Promise<{ users: AppwriteUser[] | null; total: number; error: string | null }> {
    if (!isServerClientReady() || !serverUsers) {
      return { users: null, total: 0, error: 'Appwrite server not configured' };
    }

    try {
      const response = await serverUsers.list(queries);
      return { users: response.users, total: response.total, error: null };
    } catch (error) {
      logger.error('Failed to list users (server)', { error });
      return {
        users: null,
        total: 0,
        error: error instanceof Error ? error.message : 'Failed to list users',
      };
    }
  },
};

// Convenience exports
export const getCurrentUser = appwriteAuth.getCurrentUser;
export const createSession = appwriteAuth.createSession;
export const deleteSession = appwriteAuth.deleteSession;
export const createAccount = appwriteAuth.createAccount;
export const updatePassword = appwriteAuth.updatePassword;
export const sendPasswordRecovery = appwriteAuth.sendPasswordRecovery;
export const confirmPasswordRecovery = appwriteAuth.confirmPasswordRecovery;
export const createJWT = appwriteAuth.createJWT;

/**
 * Verify if current session is valid
 */
export async function verifySession(): Promise<boolean> {
  const { user } = await appwriteAuth.getCurrentUser();
  return user !== null;
}
