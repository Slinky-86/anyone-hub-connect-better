import React, { createContext, useContext, useEffect, useState } from 'react';
import { realtimeService } from '@/lib/services/realtime';
import { useUser } from './user-context';

interface WebSocketContextType {
  connected: boolean;
  sendMessage: (message: any) => void;
  subscribeToMessages: (conversationId: number, callback: (message: any) => void) => void;
  subscribeToUserStatus: (userIds: number[], callback: (user: any) => void) => void;
  unsubscribe: (channelName: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      realtimeService.initialize(user.id);
      setConnected(true);
    } else {
      realtimeService.cleanup();
      setConnected(false);
    }

    return () => {
      realtimeService.cleanup();
    };
  }, [user]);

  const sendMessage = (message: any) => {
    // For Supabase realtime, we don't send messages through WebSocket
    // Messages are sent through the database and real-time updates come automatically
    console.log('Message sent through database:', message);
  };

  const subscribeToMessages = (conversationId: number, callback: (message: any) => void) => {
    realtimeService.subscribeToMessages(conversationId, callback);
  };

  const subscribeToUserStatus = (userIds: number[], callback: (user: any) => void) => {
    realtimeService.subscribeToUserStatus(userIds, callback);
  };

  const unsubscribe = (channelName: string) => {
    realtimeService.unsubscribe(channelName);
  };

  return (
    <WebSocketContext.Provider value={{
      connected,
      sendMessage,
      subscribeToMessages,
      subscribeToUserStatus,
      unsubscribe,
    }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}