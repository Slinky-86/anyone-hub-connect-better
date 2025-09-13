import { supabase } from '../supabase-unified';
import type { Message, User, Notification } from '@shared/schema';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type MessageEventType = 'INSERT' | 'UPDATE' | 'DELETE';
export type UserEventType = 'UPDATE';

export interface MessageUpdate {
  type: MessageEventType;
  message: Message;
  conversationId: number;
}

export interface UserUpdate {
  type: UserEventType;
  user: Omit<User, 'password'>;
}

export interface NotificationUpdate {
  type: 'INSERT';
  notification: Notification;
}

/**
 * Real-time Service using Supabase Realtime
 * Replaces WebSocket functionality from Express server
 */
export class RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private userId: number | null = null;

  /**
   * Initialize real-time service for a user
   */
  initialize(userId: number): void {
    this.userId = userId;
  }

  /**
   * Subscribe to message updates for conversations user participates in
   */
  subscribeToMessages(
    conversationId: number,
    onMessage: (update: MessageUpdate) => void
  ): RealtimeChannel {
    const channelName = `messages:${conversationId}`;
    
    // Remove existing channel if it exists
    this.unsubscribe(channelName);

    const channel = supabase.channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const message = payload.new as Message;
          onMessage({
            type: 'INSERT',
            message,
            conversationId: message.conversationId,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const message = payload.new as Message;
          onMessage({
            type: 'UPDATE',
            message,
            conversationId: message.conversationId,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const message = payload.old as Message;
          onMessage({
            type: 'DELETE',
            message,
            conversationId: message.conversationId,
          });
        }
      );

    channel.subscribe((status) => {
      console.log(`Messages channel ${channelName} status:`, status);
    });

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Subscribe to user online status updates
   */
  subscribeToUserStatus(
    userIds: number[],
    onUserUpdate: (update: UserUpdate) => void
  ): RealtimeChannel {
    const channelName = 'user-status';
    
    // Remove existing channel if it exists
    this.unsubscribe(channelName);

    const channel = supabase.channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
        },
        (payload) => {
          const user = payload.new as User;
          
          // Only notify about users we're interested in
          if (userIds.includes(user.id)) {
            const { password, ...userWithoutPassword } = user;
            onUserUpdate({
              type: 'UPDATE',
              user: userWithoutPassword,
            });
          }
        }
      );

    channel.subscribe((status) => {
      console.log(`User status channel status:`, status);
    });

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Subscribe to notifications for current user
   */
  subscribeToNotifications(
    onNotification: (update: NotificationUpdate) => void
  ): RealtimeChannel | null {
    if (!this.userId) {
      console.warn('Cannot subscribe to notifications without user ID');
      return null;
    }

    const channelName = 'notifications';
    
    // Remove existing channel if it exists
    this.unsubscribe(channelName);

    const channel = supabase.channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${this.userId}`,
        },
        (payload) => {
          const notification = payload.new as Notification;
          onNotification({
            type: 'INSERT',
            notification,
          });
        }
      );

    channel.subscribe((status) => {
      console.log(`Notifications channel status:`, status);
    });

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Subscribe to message reactions updates
   */
  subscribeToMessageReactions(
    messageIds: number[],
    onReactionUpdate: (messageId: number) => void
  ): RealtimeChannel {
    const channelName = 'message-reactions';
    
    // Remove existing channel if it exists
    this.unsubscribe(channelName);

    const channel = supabase.channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_reactions',
        },
        (payload) => {
          const reaction = payload.new as any;
          if (messageIds.includes(reaction.message_id)) {
            onReactionUpdate(reaction.message_id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'message_reactions',
        },
        (payload) => {
          const reaction = payload.old as any;
          if (messageIds.includes(reaction.message_id)) {
            onReactionUpdate(reaction.message_id);
          }
        }
      );

    channel.subscribe((status) => {
      console.log(`Message reactions channel status:`, status);
    });

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Subscribe to conversation participants changes
   */
  subscribeToConversationParticipants(
    conversationId: number,
    onParticipantChange: () => void
  ): RealtimeChannel {
    const channelName = `participants:${conversationId}`;
    
    // Remove existing channel if it exists
    this.unsubscribe(channelName);

    const channel = supabase.channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_participants',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          onParticipantChange();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'conversation_participants',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          onParticipantChange();
        }
      );

    channel.subscribe((status) => {
      console.log(`Conversation participants channel ${channelName} status:`, status);
    });

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Subscribe to typing indicators (using presence)
   */
  subscribeToTyping(
    conversationId: number,
    onTypingChange: (typingUsers: Array<{ userId: number; username: string }>) => void
  ): RealtimeChannel {
    const channelName = `typing:${conversationId}`;
    
    // Remove existing channel if it exists
    this.unsubscribe(channelName);

    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: String(this.userId),
        },
      },
    });

    // Track typing users with presence
    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const typingUsers: Array<{ userId: number; username: string }> = [];
        
        Object.keys(presenceState).forEach(key => {
          const presences = presenceState[key];
          if (presences && presences.length > 0) {
            const presence = presences[0] as any;
            // Access the tracked data properly
            if (presence.typing && presence.userId !== this.userId) {
              typingUsers.push({
                userId: presence.userId,
                username: presence.username,
              });
            }
          }
        });
        
        onTypingChange(typingUsers);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        // Handle new typing users
        console.log('User started typing:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        // Handle users who stopped typing
        console.log('User stopped typing:', leftPresences);
      });

    channel.subscribe((status) => {
      console.log(`Typing channel ${channelName} status:`, status);
    });

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Send typing indicator
   */
  async sendTyping(conversationId: number, username: string, isTyping: boolean): Promise<void> {
    if (!this.userId) return;

    const channelName = `typing:${conversationId}`;
    const channel = this.channels.get(channelName);
    
    if (channel) {
      await channel.track({
        userId: this.userId,
        username,
        typing: isTyping,
        lastTyped: new Date().toISOString(),
      });
    }
  }

  /**
   * Unsubscribe from a specific channel
   */
  unsubscribe(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll(): void {
    this.channels.forEach((channel, channelName) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
  }

  /**
   * Get list of active channels
   */
  getActiveChannels(): string[] {
    return Array.from(this.channels.keys());
  }

  /**
   * Check connection status
   */
  getConnectionStatus(): string {
    // Supabase doesn't expose direct connection status
    // We can infer it from channel states
    const channels = Array.from(this.channels.values());
    if (channels.length === 0) return 'disconnected';
    
    // Check if any channels are subscribed
    const hasActiveChannels = channels.some(channel => {
      // This is a rough approximation since Supabase doesn't expose channel state directly
      return true; // Assume connected if channels exist
    });
    
    return hasActiveChannels ? 'connected' : 'disconnected';
  }

  /**
   * Cleanup on logout
   */
  cleanup(): void {
    this.unsubscribeAll();
    this.userId = null;
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();
export default realtimeService;