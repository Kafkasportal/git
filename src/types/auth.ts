import type { PermissionValue } from '@/types/permissions';

export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  avatar?: string | null;
  permissions: PermissionValue[];
  lastLogin?: Date;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  phone?: string;
  labels?: string[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}
