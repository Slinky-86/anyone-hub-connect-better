import { supabase } from '../supabase-unified';
import type { User, Message } from '@shared/schema';

export interface SearchableUser extends Omit<User, 'password'> {
  // Safe user type for search results
}

/**
 * Search Service using Supabase
 * Replaces search-related Express routes (/api/fellows/search, etc.)
 */
export class SearchService {
  /**
   * Search for users (fellows)
   * Replaces: GET /api/fellows/search
   */
  async searchUsers(query: string, limit: number = 20): Promise<{ users: SearchableUser[]; error?: string }> {
    try {
      if (!query || query.trim().length === 0) {
        return { users: [] };
      }

      const searchQuery = query.trim();

      // Search users by username, display name, or email
      const { data: users, error } = await supabase
        .from('users')
        .select('id, username, email, display_name, avatar_url, is_online, show_online_status')
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(limit);

      if (error) {
        return { users: [], error: error.message };
      }

      // Map to SearchableUser format
      const searchableUsers: SearchableUser[] = users?.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        isOnline: user.is_online,
        showOnlineStatus: user.show_online_status,
      })) || [];

      return { users: searchableUsers };
    } catch (error) {
      console.error('Search users error:', error);
      return { users: [], error: 'Failed to search users' };
    }
  }

  /**
   * Search for users excluding current user
   */
  async searchUsersExcluding(query: string, excludeUserId: number, limit: number = 20): Promise<{ users: SearchableUser[]; error?: string }> {
    try {
      if (!query || query.trim().length === 0) {
        return { users: [] };
      }

      const searchQuery = query.trim();

      // Search users by username, display name, or email (excluding current user)
      const { data: users, error } = await supabase
        .from('users')
        .select('id, username, email, display_name, avatar_url, is_online, show_online_status')
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .neq('id', excludeUserId)
        .limit(limit);

      if (error) {
        return { users: [], error: error.message };
      }

      // Map to SearchableUser format
      const searchableUsers: SearchableUser[] = users?.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        isOnline: user.is_online,
        showOnlineStatus: user.show_online_status,
      })) || [];

      return { users: searchableUsers };
    } catch (error) {
      console.error('Search users excluding error:', error);
      return { users: [], error: 'Failed to search users' };
    }
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<{ user?: SearchableUser; error?: string }> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('id, username, email, display_name, avatar_url, is_online, show_online_status')
        .eq('username', username)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { user: undefined }; // User not found
        }
        return { error: error.message };
      }

      const searchableUser: SearchableUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        isOnline: user.is_online,
        showOnlineStatus: user.show_online_status,
      };

      return { user: searchableUser };
    } catch (error) {
      console.error('Get user by username error:', error);
      return { error: 'Failed to get user by username' };
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: number): Promise<{ user?: SearchableUser; error?: string }> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('id, username, email, display_name, avatar_url, is_online, show_online_status')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { user: undefined }; // User not found
        }
        return { error: error.message };
      }

      const searchableUser: SearchableUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        isOnline: user.is_online,
        showOnlineStatus: user.show_online_status,
      };

      return { user: searchableUser };
    } catch (error) {
      console.error('Get user by ID error:', error);
      return { error: 'Failed to get user by ID' };
    }
  }

  /**
   * Search messages globally (across all conversations user has access to)
   */
  async searchMessagesGlobal(userId: number, query: string, limit: number = 50): Promise<{ messages: Message[]; error?: string }> {
    try {
      if (!query || query.trim().length === 0) {
        return { messages: [] };
      }

      // Get all conversations the user is a participant in
      const { data: participations, error: participationError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId);

      if (participationError) {
        return { messages: [], error: participationError.message };
      }

      if (!participations || participations.length === 0) {
        return { messages: [] };
      }

      const conversationIds = participations.map(p => p.conversation_id);

      // Search messages in these conversations
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .in('conversation_id', conversationIds)
        .ilike('content', `%${query.trim()}%`)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        return { messages: [], error: error.message };
      }

      return { messages: messages || [] };
    } catch (error) {
      console.error('Search messages global error:', error);
      return { messages: [], error: 'Failed to search messages' };
    }
  }

  /**
   * Get online users
   */
  async getOnlineUsers(excludeUserId?: number): Promise<{ users: SearchableUser[]; error?: string }> {
    try {
      let query = supabase
        .from('users')
        .select('id, username, email, display_name, avatar_url, is_online, show_online_status')
        .eq('is_online', true)
        .eq('show_online_status', true);

      if (excludeUserId) {
        query = query.neq('id', excludeUserId);
      }

      const { data: users, error } = await query;

      if (error) {
        return { users: [], error: error.message };
      }

      // Map to SearchableUser format
      const searchableUsers: SearchableUser[] = users?.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        isOnline: user.is_online,
        showOnlineStatus: user.show_online_status,
      })) || [];

      return { users: searchableUsers };
    } catch (error) {
      console.error('Get online users error:', error);
      return { users: [], error: 'Failed to get online users' };
    }
  }

  /**
   * Get recent conversations for a user (for search suggestions)
   */
  async getRecentConversationUsers(userId: number, limit: number = 10): Promise<{ users: SearchableUser[]; error?: string }> {
    try {
      // Get recent conversations
      const { data: participations, error: participationError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId);

      if (participationError || !participations) {
        return { users: [], error: participationError?.message || 'Failed to get participations' };
      }

      const conversationIds = participations.map(p => p.conversation_id);

      if (conversationIds.length === 0) {
        return { users: [] };
      }

      // Get other participants from these conversations
      const { data: otherParticipants, error } = await supabase
        .from('conversation_participants')
        .select(`
          users!inner (
            id, username, email, display_name, avatar_url, is_online, show_online_status
          )
        `)
        .in('conversation_id', conversationIds)
        .neq('user_id', userId)
        .limit(limit);

      if (error) {
        return { users: [], error: error.message };
      }

      // Map to SearchableUser format and deduplicate
      const userMap = new Map<number, SearchableUser>();
      
      otherParticipants?.forEach(p => {
        const user = p.users as any;
        if (!userMap.has(user.id)) {
          userMap.set(user.id, {
            id: user.id,
            username: user.username,
            email: user.email,
            displayName: user.display_name,
            avatarUrl: user.avatar_url,
            isOnline: user.is_online,
            showOnlineStatus: user.show_online_status,
          });
        }
      });

      return { users: Array.from(userMap.values()) };
    } catch (error) {
      console.error('Get recent conversation users error:', error);
      return { users: [], error: 'Failed to get recent conversation users' };
    }
  }
}

// Export singleton instance
export const searchService = new SearchService();
export default searchService;