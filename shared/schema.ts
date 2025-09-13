import { z } from "zod";

// User schemas and types
export const insertUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.string().email().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  displayName: z.string().optional(),
  avatarUrl: z.string().nullable().optional(),
  isOnline: z.boolean().optional(),
  showOnlineStatus: z.boolean().optional(),
});

export interface User {
  id: number;
  username: string;
  email?: string | null;
  password: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  isOnline?: boolean | null;
  showOnlineStatus?: boolean | null;
}

// Conversation schemas and types
export interface Conversation {
  id: number;
  createdAt?: Date | null;
}

export interface ConversationParticipant {
  id: number;
  conversationId: number;
  userId: number;
}

// Message schemas and types
export const insertMessageSchema = z.object({
  conversationId: z.number(),
  senderId: z.number(),
  content: z.string().min(1, "Message content is required"),
  mediaUrl: z.string().nullable().optional(),
  mediaType: z.string().nullable().optional(),
  transcription: z.string().optional(),
  isTranscribed: z.boolean().optional(),
});

export const updateMessageSchema = z.object({
  isLiked: z.boolean().optional(),
  isSaved: z.boolean().optional(),
  transcription: z.string().optional(),
  isTranscribed: z.boolean().optional(),
});

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  timestamp?: Date | null;
  isLiked?: boolean | null;
  isSaved?: boolean | null;
  mediaUrl?: string | null;
  mediaType?: string | null;
  transcription?: string | null;
  isTranscribed?: boolean | null;
}

// User settings schemas and types
export const insertUserSettingsSchema = z.object({
  userId: z.number(),
  theme: z.string().optional(),
  accentColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  chatBackground: z.string().optional(),
  chatBackgroundColor: z.string().optional(),
  showOnlineStatus: z.boolean().optional(),
  sendReadReceipts: z.boolean().optional(),
  autoSaveMessages: z.boolean().optional(),
});

export const updateUserSettingsSchema = z.object({
  theme: z.string().optional(),
  accentColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  chatBackground: z.string().optional(),
  chatBackgroundColor: z.string().optional(),
  showOnlineStatus: z.boolean().optional(),
  sendReadReceipts: z.boolean().optional(),
  autoSaveMessages: z.boolean().optional(),
}).partial();

export interface UserSettings {
  id: number;
  userId: number;
  theme?: string | null;
  accentColor?: string | null;
  backgroundColor?: string | null;
  chatBackground?: string | null;
  chatBackgroundColor?: string | null;
  showOnlineStatus?: boolean | null;
  sendReadReceipts?: boolean | null;
  autoSaveMessages?: boolean | null;
}

// Notification schemas and types
export const insertNotificationSchema = z.object({
  userId: z.string(),
  type: z.string(),
  title: z.string(),
  message: z.string(),
  sourceUserId: z.string().optional(),
  sourceUsername: z.string().optional(),
  conversationId: z.number().optional(),
  messageId: z.number().optional(),
  read: z.boolean().optional(),
});

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  sourceUserId?: string | null;
  sourceUsername?: string | null;
  conversationId?: number | null;
  messageId?: number | null;
  read?: boolean | null;
  createdAt?: Date | null;
}

// Message reactions
export const REACTION_EMOJIS = [
  "👍", "❤️", "😂", "😮", "😢", "😡"
] as const;

export const insertMessageReactionSchema = z.object({
  messageId: z.number(),
  userId: z.number(),
  emoji: z.string(),
});

export interface MessageReaction {
  id: number;
  messageId: number;
  userId: number;
  emoji: string;
  createdAt?: Date | null;
}

export interface MessageReactionCount {
  id: number;
  messageId: number;
  counts: Record<string, { count: number; userIds: number[] }>;
  updatedAt?: Date | null;
}

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type UpdateMessage = z.infer<typeof updateMessageSchema>;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UpdateUserSettings = z.infer<typeof updateUserSettingsSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertMessageReaction = z.infer<typeof insertMessageReactionSchema>;