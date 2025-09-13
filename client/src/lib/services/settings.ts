import { supabase } from '../supabase-unified';
import type { UserSettings, InsertUserSettings, UpdateUserSettings } from '@shared/schema';

/**
 * Settings Service using Supabase
 * Replaces settings-related Express routes (/api/settings)
 */
export class SettingsService {
  /**
   * Get user settings
   * Replaces: GET /api/settings
   */
  async getUserSettings(userId: number): Promise<{ settings?: UserSettings; error?: string }> {
    try {
      const { data: settings, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // If no settings found, create default settings
        if (error.code === 'PGRST116') {
          const defaultSettings = await this.createDefaultSettings(userId);
          return defaultSettings;
        }
        return { error: error.message };
      }

      return { settings };
    } catch (error) {
      console.error('Get user settings error:', error);
      return { error: 'Failed to get user settings' };
    }
  }

  /**
   * Update user settings
   * Replaces: PATCH /api/settings
   */
  async updateUserSettings(userId: number, updates: UpdateUserSettings): Promise<{ settings?: UserSettings; error?: string }> {
    try {
      const { data: settings, error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      return { settings };
    } catch (error) {
      console.error('Update user settings error:', error);
      return { error: 'Failed to update user settings' };
    }
  }

  /**
   * Create default settings for a new user
   * Internal helper method
   */
  async createDefaultSettings(userId: number): Promise<{ settings?: UserSettings; error?: string }> {
    try {
      const defaultSettings: InsertUserSettings = {
        userId,
        theme: 'light',
        accentColor: 'teal',
        backgroundColor: 'white',
        chatBackground: 'solid',
        chatBackgroundColor: 'white',
        showOnlineStatus: true,
        sendReadReceipts: true,
        autoSaveMessages: false,
      };

      const { data: settings, error } = await supabase
        .from('user_settings')
        .insert([defaultSettings])
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      return { settings };
    } catch (error) {
      console.error('Create default settings error:', error);
      return { error: 'Failed to create default settings' };
    }
  }

  /**
   * Update user's online status visibility
   */
  async updateOnlineStatusVisibility(userId: number, showOnlineStatus: boolean): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from('user_settings')
        .update({ showOnlineStatus })
        .eq('user_id', userId);

      if (error) {
        return { error: error.message };
      }

      // Also update in users table
      await supabase
        .from('users')
        .update({ show_online_status: showOnlineStatus })
        .eq('id', userId);

      return {};
    } catch (error) {
      console.error('Update online status visibility error:', error);
      return { error: 'Failed to update online status visibility' };
    }
  }

  /**
   * Get user settings by theme preference for bulk operations
   */
  async getUsersByTheme(theme: string): Promise<{ users: number[]; error?: string }> {
    try {
      const { data: settings, error } = await supabase
        .from('user_settings')
        .select('user_id')
        .eq('theme', theme);

      if (error) {
        return { users: [], error: error.message };
      }

      return { users: settings?.map(s => s.user_id) || [] };
    } catch (error) {
      console.error('Get users by theme error:', error);
      return { users: [], error: 'Failed to get users by theme' };
    }
  }
}

// Export singleton instance
export const settingsService = new SettingsService();
export default settingsService;