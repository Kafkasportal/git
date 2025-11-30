/**
 * Settings API Client
 * Type-safe API client for system settings management
 */

export type SettingCategory =
  | 'organization'
  | 'email'
  | 'notifications'
  | 'system'
  | 'security'
  | 'appearance'
  | 'integrations'
  | 'reports';

export interface SettingsResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface OrganizationSettings {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  tax_number?: string;
  logo_url?: string;
}

export interface EmailSettings {
  enabled: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  fromEmail?: string;
  fromName?: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  notificationTypes?: string[];
}

export interface SystemSettings {
  sessionTimeout: number;
  maxLoginAttempts: number;
  maintenanceMode: boolean;
  timezone?: string;
  language?: string;
}

export interface SecuritySettings {
  requireTwoFactor: boolean;
  passwordMinLength: number;
  sessionTimeout: number;
  passwordExpiryDays?: number;
  lockoutDuration?: number;
}

export interface AppearanceSettings {
  theme?: string;
  logo_url?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface IntegrationSettings {
  smsGateway?: {
    provider?: string;
    apiKey?: string;
    apiUrl?: string;
  };
  paymentGateway?: {
    provider?: string;
    apiKey?: string;
    merchantId?: string;
  };
}

export interface ReportSettings {
  defaultFormat?: string;
  templates?: Record<string, unknown>;
  autoGenerate?: boolean;
}

export type AllSettings = {
  organization?: OrganizationSettings;
  email?: EmailSettings;
  notifications?: NotificationSettings;
  system?: SystemSettings;
  security?: SecuritySettings;
  appearance?: AppearanceSettings;
  integrations?: IntegrationSettings;
  reports?: ReportSettings;
};

class SettingsApi {
  private baseUrl = '/api/settings';

  /**
   * Get all settings or settings by category
   */
  async getSettings(category?: SettingCategory): Promise<SettingsResponse<AllSettings | unknown>> {
    try {
      const url = category ? `${this.baseUrl}?category=${category}` : this.baseUrl;
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ayarlar alınamadı',
      };
    }
  }

  /**
   * Get settings for a specific category
   */
  async getCategorySettings<T = unknown>(category: SettingCategory): Promise<SettingsResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}/${category}`, {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ayarlar alınamadı',
      };
    }
  }

  /**
   * Get a single setting
   */
  async getSetting(
    category: SettingCategory,
    key: string
  ): Promise<SettingsResponse<{ category: string; key: string; value: unknown }>> {
    try {
      const response = await fetch(`${this.baseUrl}/${category}/${key}`, {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ayar alınamadı',
      };
    }
  }

  /**
   * Update settings for a category
   */
  async updateCategorySettings(
    category: SettingCategory,
    settings: Record<string, unknown>
  ): Promise<SettingsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${category}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ settings }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ayarlar kaydedilemedi',
      };
    }
  }

  /**
   * Update a single setting
   */
  async updateSetting(
    category: SettingCategory,
    key: string,
    value: unknown
  ): Promise<SettingsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${category}/${key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ value }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ayar güncellenemedi',
      };
    }
  }

  /**
   * Update all settings (bulk)
   */
  async updateAllSettings(settings: AllSettings): Promise<SettingsResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ settings }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ayarlar güncellenemedi',
      };
    }
  }

  /**
   * Reset settings to defaults
   */
  async resetSettings(category?: SettingCategory): Promise<SettingsResponse> {
    try {
      const url = category ? `${this.baseUrl}?category=${category}` : this.baseUrl;
      const response = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ayarlar sıfırlanamadı',
      };
    }
  }
}

export const settingsApi = new SettingsApi();
