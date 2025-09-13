import { supabase } from '../supabase-unified';
import type { 
  Conversation, 
  Message, 
  User, 
  InsertMessage, 
  UpdateMessage,
  MessageReaction,
  InsertMessageReaction,
  MessageReactionCount 
} from '@shared/schema';

export interface ConversationWithParticipants {
  conversation: Conversation;
  participant: Omit<User, 'password'>;
  lastMessage?: Message;
}

export interface ConversationDetails {
  conversation: Conversation;
  participants: Omit<User, 'password'>[];
}

export interface MessageWithReactions extends Message {
  reactions?: MessageReactionCount;
}

export interface ReactionSummary {
  userId: number;
  username: string;
  displayName: string;
  emoji: string;
  createdAt: string;
}

// Helper function to convert snake_case database user to camelCase User type
function convertDbUserToUser(dbUser: any): Omit<User, 'password'> {
  return {
    id: dbUser.id,
    username: dbUser.username,
    email: dbUser.email,
    displayName: dbUser.display_name,
    avatarUrl: dbUser.avatar_url,
    isOnline: dbUser.is_online,
    showOnlineStatus: dbUser.show_online_status,
  };
}

/**
 * Conversation Service using Supabase
 * Replaces all conversation and message related Express routes
 */
export class ConversationService {
  /**
   * Get all conversations for a user
   * Replaces: GET /api/conversations
   */
  async getUserConversations(userId: number): Promise<{ conversations: ConversationWithParticipants[]; error?: string }> {
    try {
      // Get all conversation IDs where user is a participant
      const { data: participations, error: participationError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId);

      if (participationError) {
        return { conversations: [], error: participationError.message };
      }

      if (!participations || participations.length === 0) {
        return { conversations: [] };
      }

      const conversationIds = participations.map(p => p.conversation_id);
      const results: ConversationWithParticipants[] = [];

      // For each conversation, get details and participants
      for (const conversationId of conversationIds) {
        // Get conversation details
        const { data: conversation, error: convError } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', conversationId)
          .single();

        if (convError || !conversation) continue;

        // Get all participants for this conversation
        const { data: allParticipants, error: participantsError } = await supabase
          .from('conversation_participants')
          .select(`
            users!inner (
              id, username, email, display_name, avatar_url, is_online, show_online_status
            )
          `)
          .eq('conversation_id', conversationId);

        if (participantsError || !allParticipants) continue;

        // Filter out current user to get the other participant
        const otherParticipants = allParticipants
          .filter(p => (p.users as any).id !== userId)
          .map(p => convertDbUserToUser(p.users));

        if (otherParticipants.length === 0) continue;

        // Get last message
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single();

        results.push({
          conversation,
          participant: otherParticipants[0],
          lastMessage: lastMessage || undefined,
        });
      }

      return { conversations: results };
    } catch (error) {
      console.error('Get user conversations error:', error);
      return { conversations: [], error: 'Failed to get conversations' };
    }
  }

  /**
   * Get conversation details with participants
   * Replaces: GET /api/conversations/:id
   */
  async getConversation(conversationId: number, userId: number): Promise<{ conversation?: ConversationDetails; error?: string }> {
    try {
      // Get conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (convError) {
        return { error: convError.message };
      }

      if (!conversation) {
        return { error: 'Conversation not found' };
      }

      // Get all participants
      const { data: participantData, error: participantsError } = await supabase
        .from('conversation_participants')
        .select(`
          users!inner (
            id, username, email, display_name, avatar_url, is_online, show_online_status
          )
        `)
        .eq('conversation_id', conversationId);

      if (participantsError) {
        return { error: participantsError.message };
      }

      const participants = participantData?.map(p => convertDbUserToUser(p.users)) || [];

      // Check if current user is a participant
      if (!participants.some(p => p.id === userId)) {
        return { error: 'Not authorized to view this conversation' };
      }

      return { 
        conversation: { 
          conversation, 
          participants 
        }
      };
    } catch (error) {
      console.error('Get conversation error:', error);
      return { error: 'Failed to get conversation' };
    }
  }

  /**
   * Get conversation participants
   * Replaces: GET /api/conversations/:id/participants
   */
  async getConversationParticipants(conversationId: number, userId: number): Promise<{ participants: Omit<User, 'password'>[]; error?: string }> {
    try {
      const { data: participantData, error } = await supabase
        .from('conversation_participants')
        .select(`
          users!inner (
            id, username, email, display_name, avatar_url, is_online, show_online_status
          )
        `)
        .eq('conversation_id', conversationId);

      if (error) {
        return { participants: [], error: error.message };
      }

      const participants = participantData?.map(p => convertDbUserToUser(p.users)) || [];

      // Check if current user is a participant
      if (!participants.some(p => p.id === userId)) {
        return { participants: [], error: 'Not authorized to view participants in this conversation' };
      }

      return { participants };
    } catch (error) {
      console.error('Get conversation participants error:', error);
      return { participants: [], error: 'Failed to get participants' };
    }
  }

  /**
   * Create a new conversation
   * Replaces: POST /api/conversations
   */
  async createConversation(participantIds: number[]): Promise<{ conversation?: Conversation; error?: string }> {
    try {
      // Create the conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert([{}])
        .select()
        .single();

      if (convError || !conversation) {
        return { error: 'Failed to create conversation' };
      }

      // Add participants
      const participantInserts = participantIds.map(userId => ({
        conversation_id: conversation.id,
        user_id: userId,
      }));

      const { error: participantError } = await supabase
        .from('conversation_participants')
        .insert(participantInserts);

      if (participantError) {
        // Clean up conversation if adding participants fails
        await supabase
          .from('conversations')
          .delete()
          .eq('id', conversation.id);
        
        return { error: 'Failed to add participants to conversation' };
      }

      return { conversation };
    } catch (error) {
      console.error('Create conversation error:', error);
      return { error: 'Failed to create conversation' };
    }
  }

  /**
   * Get messages for a conversation
   * Replaces: GET /api/conversations/:id/messages
   */
  async getMessages(conversationId: number, userId: number): Promise<{ messages: Message[]; error?: string }> {
    try {
      // First check if user is a participant
      const { participants, error: participantError } = await this.getConversationParticipants(conversationId, userId);
      
      if (participantError) {
        return { messages: [], error: participantError };
      }

      if (!participants.some(p => p.id === userId)) {
        return { messages: [], error: 'Not authorized to view messages in this conversation' };
      }

      // Get messages
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });

      if (error) {
        return { messages: [], error: error.message };
      }

      return { messages: messages || [] };
    } catch (error) {
      console.error('Get messages error:', error);
      return { messages: [], error: 'Failed to get messages' };
    }
  }

  /**
   * Send a new message
   * Replaces: POST /api/conversations/:id/messages
   */
  async sendMessage(conversationId: number, senderId: number, content: string, mediaUrl?: string, mediaType?: string): Promise<{ message?: Message; error?: string }> {
    try {
      // Check if user is a participant
      const { participants, error: participantError } = await this.getConversationParticipants(conversationId, senderId);
      
      if (participantError) {
        return { error: participantError };
      }

      if (!participants.some(p => p.id === senderId)) {
        return { error: 'Not authorized to send messages in this conversation' };
      }

      // Create message
      const messageData: InsertMessage = {
        conversationId,
        senderId,
        content,
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
      };

      const { data: message, error } = await supabase
        .from('messages')
        .insert([messageData])
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      return { message };
    } catch (error) {
      console.error('Send message error:', error);
      return { error: 'Failed to send message' };
    }
  }

  /**
   * Update a message (like/save)
   * Replaces: PATCH /api/messages/:id
   */
  async updateMessage(messageId: number, userId: number, updates: UpdateMessage): Promise<{ message?: Message; error?: string }> {
    try {
      // Get the message first
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .select('*')
        .eq('id', messageId)
        .single();

      if (messageError || !message) {
        return { error: 'Message not found' };
      }

      // Check if user is a participant in the conversation
      const { participants, error: participantError } = await this.getConversationParticipants(message.conversationId, userId);
      
      if (participantError) {
        return { error: participantError };
      }

      if (!participants.some(p => p.id === userId)) {
        return { error: 'Not authorized to update this message' };
      }

      // Update the message
      const { data: updatedMessage, error: updateError } = await supabase
        .from('messages')
        .update(updates)
        .eq('id', messageId)
        .select()
        .single();

      if (updateError) {
        return { error: updateError.message };
      }

      return { message: updatedMessage };
    } catch (error) {
      console.error('Update message error:', error);
      return { error: 'Failed to update message' };
    }
  }

  /**
   * Add reaction to a message
   * Replaces: POST /api/messages/:id/reactions
   */
  async addReaction(messageId: number, userId: number, emoji: string): Promise<{ error?: string }> {
    try {
      // Get the message first to check conversation access
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .select('conversation_id')
        .eq('id', messageId)
        .single();

      if (messageError || !message) {
        return { error: 'Message not found' };
      }

      // Check if user is a participant
      const { participants, error: participantError } = await this.getConversationParticipants(message.conversation_id, userId);
      
      if (participantError) {
        return { error: participantError };
      }

      if (!participants.some(p => p.id === userId)) {
        return { error: 'Not authorized to react to this message' };
      }

      // Check if reaction already exists
      const { data: existingReaction } = await supabase
        .from('message_reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', userId)
        .eq('emoji', emoji)
        .single();

      if (existingReaction) {
        return { error: 'Reaction already exists' };
      }

      // Add reaction
      const reactionData: InsertMessageReaction = {
        messageId,
        userId,
        emoji,
      };

      const { error: insertError } = await supabase
        .from('message_reactions')
        .insert([reactionData]);

      if (insertError) {
        return { error: insertError.message };
      }

      // Update reaction counts
      await this.updateReactionCounts(messageId);

      return {};
    } catch (error) {
      console.error('Add reaction error:', error);
      return { error: 'Failed to add reaction' };
    }
  }

  /**
   * Remove reaction from a message
   * Replaces: DELETE /api/messages/:id/reactions/:emoji
   */
  async removeReaction(messageId: number, userId: number, emoji: string): Promise<{ error?: string }> {
    try {
      // Get the message first to check conversation access
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .select('conversation_id')
        .eq('id', messageId)
        .single();

      if (messageError || !message) {
        return { error: 'Message not found' };
      }

      // Check if user is a participant
      const { participants, error: participantError } = await this.getConversationParticipants(message.conversation_id, userId);
      
      if (participantError) {
        return { error: participantError };
      }

      if (!participants.some(p => p.id === userId)) {
        return { error: 'Not authorized to remove reaction from this message' };
      }

      // Remove reaction
      const { error: deleteError } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', userId)
        .eq('emoji', emoji);

      if (deleteError) {
        return { error: deleteError.message };
      }

      // Update reaction counts
      await this.updateReactionCounts(messageId);

      return {};
    } catch (error) {
      console.error('Remove reaction error:', error);
      return { error: 'Failed to remove reaction' };
    }
  }

  /**
   * Get reactions for a message
   * Replaces: GET /api/messages/:id/reactions
   */
  async getMessageReactions(messageId: number, userId: number): Promise<{ reactions: ReactionSummary[]; error?: string }> {
    try {
      // Get the message first to check conversation access
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .select('conversation_id')
        .eq('id', messageId)
        .single();

      if (messageError || !message) {
        return { reactions: [], error: 'Message not found' };
      }

      // Check if user is a participant
      const { participants, error: participantError } = await this.getConversationParticipants(message.conversation_id, userId);
      
      if (participantError) {
        return { reactions: [], error: participantError };
      }

      if (!participants.some(p => p.id === userId)) {
        return { reactions: [], error: 'Not authorized to view reactions for this message' };
      }

      // Get reactions with user details
      const { data: reactions, error } = await supabase
        .from('message_reactions')
        .select(`
          emoji,
          created_at,
          users!inner (
            id,
            username,
            display_name
          )
        `)
        .eq('message_id', messageId);

      if (error) {
        return { reactions: [], error: error.message };
      }

      const reactionSummary: ReactionSummary[] = reactions?.map(r => ({
        userId: (r.users as any).id,
        username: (r.users as any).username,
        displayName: (r.users as any).display_name || (r.users as any).username,
        emoji: r.emoji,
        createdAt: r.created_at,
      })) || [];

      return { reactions: reactionSummary };
    } catch (error) {
      console.error('Get message reactions error:', error);
      return { reactions: [], error: 'Failed to get reactions' };
    }
  }

  /**
   * Search messages within a conversation
   * Replaces: GET /api/conversations/:id/search
   */
  async searchMessages(conversationId: number, userId: number, query: string): Promise<{ messages: Message[]; error?: string }> {
    try {
      // Check if user is a participant
      const { participants, error: participantError } = await this.getConversationParticipants(conversationId, userId);
      
      if (participantError) {
        return { messages: [], error: participantError };
      }

      if (!participants.some(p => p.id === userId)) {
        return { messages: [], error: 'Not authorized to search messages in this conversation' };
      }

      // Search messages using ilike for case-insensitive search
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .ilike('content', `%${query}%`)
        .order('timestamp', { ascending: false });

      if (error) {
        return { messages: [], error: error.message };
      }

      return { messages: messages || [] };
    } catch (error) {
      console.error('Search messages error:', error);
      return { messages: [], error: 'Failed to search messages' };
    }
  }

  /**
   * Update reaction counts for a message (internal helper)
   */
  private async updateReactionCounts(messageId: number): Promise<void> {
    try {
      // Get all reactions for this message
      const { data: reactions, error } = await supabase
        .from('message_reactions')
        .select('emoji, user_id')
        .eq('message_id', messageId);

      if (error) {
        console.error('Error getting reactions for count update:', error);
        return;
      }

      // Build counts object
      const counts: Record<string, { count: number; userIds: number[] }> = {};
      
      reactions?.forEach(reaction => {
        if (!counts[reaction.emoji]) {
          counts[reaction.emoji] = { count: 0, userIds: [] };
        }
        counts[reaction.emoji].count++;
        counts[reaction.emoji].userIds.push(reaction.user_id);
      });

      // Upsert reaction counts
      const { error: upsertError } = await supabase
        .from('message_reaction_counts')
        .upsert([{
          message_id: messageId,
          counts,
          updated_at: new Date().toISOString(),
        }], {
          onConflict: 'message_id'
        });

      if (upsertError) {
        console.error('Error updating reaction counts:', upsertError);
      }
    } catch (error) {
      console.error('Update reaction counts error:', error);
    }
  }
}

// Export singleton instance
export const conversationService = new ConversationService();
export default conversationService;