import React, { useState, useEffect, useRef } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonButton,
  IonIcon,
  IonFooter,
  IonInput,
  IonBadge,
  IonTextarea,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  IonSearchbar,
  IonSkeletonText,
  IonText,
  IonFab,
  IonFabButton,
  IonButtons,
  useIonAlert,
  useIonToast
} from '@ionic/react';
import { 
  send, 
  personAdd, 
  people, 
  chatbubble, 
  settings, 
  search, 
  ellipsisVertical,
  heart,
  thumbsUp,
  happy,
  sad,
  time,
  checkmarkCircle
} from 'ionicons/icons';
import { supabase } from '@/lib/supabase-unified';
import { useSupabaseAuth } from '@/lib/providers/MobileProviders';
import CrossAppSyncMobile from '../CrossAppSyncMobile';

// Mock types - replace with your actual interfaces
interface User {
  id: number;
  username: string;
  avatar_url?: string;
  is_online: boolean;
  last_seen_at?: string;
}

interface Message {
  id: number;
  sender_id: number;
  recipient_id: number;
  conversation_id: number;
  content: string;
  created_at: string;
  is_read: boolean;
}

interface Conversation {
  id: number;
  created_at: string;
  updated_at: string;
  last_message?: Message;
  participant: User;
}

const MobileMessaging: React.FC = () => {
  const { user } = useSupabaseAuth();
  const [presentToast] = useIonToast();
  const [presentAlert] = useIonAlert();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<'recent' | 'online'>('recent');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const contentRef = useRef<HTMLIonContentElement>(null);
  
  // Mock data - replace with actual API calls
  useEffect(() => {
    // Simulate loading conversations
    setTimeout(() => {
      const mockConversations: Conversation[] = [
        {
          id: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          participant: {
            id: 101,
            username: 'jane_doe',
            avatar_url: 'https://ionicframework.com/docs/img/demos/avatar.svg',
            is_online: true,
            last_seen_at: new Date().toISOString()
          },
          last_message: {
            id: 201,
            sender_id: 101,
            recipient_id: user?.id ? parseInt(user.id) : 0,
            conversation_id: 1,
            content: 'Hey, how are you?',
            created_at: new Date().toISOString(),
            is_read: true
          }
        },
        {
          id: 2,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          participant: {
            id: 102,
            username: 'john_smith',
            avatar_url: 'https://ionicframework.com/docs/img/demos/avatar.svg',
            is_online: false,
            last_seen_at: new Date(Date.now() - 3600000).toISOString()
          },
          last_message: {
            id: 202,
            sender_id: 102,
            recipient_id: user?.id ? parseInt(user.id) : 0,
            conversation_id: 2,
            content: 'Did you check the latest updates?',
            created_at: new Date(Date.now() - 7200000).toISOString(),
            is_read: false
          }
        }
      ];
      
      setConversations(mockConversations);
      setIsLoading(false);
    }, 1000);
    
    // In a real app, you would set up real-time subscriptions here
    const conversationsSubscription = supabase
      .channel('public:conversations')
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        }, 
        (payload: any) => {
          console.log('Conversation change received:', payload);
          // Handle conversation updates here
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(conversationsSubscription);
    };
  }, [user]);
  
  // Load messages when a conversation is selected
  useEffect(() => {
    if (activeConversation) {
      setIsLoading(true);
      
      // Simulate loading messages
      setTimeout(() => {
        const mockMessages: Message[] = [
          {
            id: 301,
            sender_id: activeConversation.participant.id,
            recipient_id: user?.id ? parseInt(user.id) : 0,
            conversation_id: activeConversation.id,
            content: 'Hey there!',
            created_at: new Date(Date.now() - 3600000).toISOString(),
            is_read: true
          },
          {
            id: 302,
            sender_id: user?.id ? parseInt(user.id) : 0,
            recipient_id: activeConversation.participant.id,
            conversation_id: activeConversation.id,
            content: 'Hi! How are you doing?',
            created_at: new Date(Date.now() - 3500000).toISOString(),
            is_read: true
          },
          {
            id: 303,
            sender_id: activeConversation.participant.id,
            recipient_id: user?.id ? parseInt(user.id) : 0,
            conversation_id: activeConversation.id,
            content: 'I\'m doing great! Just finished the new feature.',
            created_at: new Date(Date.now() - 3400000).toISOString(),
            is_read: true
          }
        ];
        
        setMessages(mockMessages);
        setIsLoading(false);
        scrollToBottom();
      }, 800);
      
      // In a real app, set up a subscription for real-time messages
      const messagesSubscription = supabase
        .channel(`conversation:${activeConversation.id}`)
        .on('postgres_changes', 
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${activeConversation.id}`
          }, 
          (payload: any) => {
            console.log('New message received:', payload);
            // Add the new message to the list
            const newMessage = payload.new as Message;
            setMessages(prev => [...prev, newMessage]);
            scrollToBottom();
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(messagesSubscription);
      };
    }
  }, [activeConversation, user]);
  
  const scrollToBottom = () => {
    if (contentRef.current) {
      contentRef.current.scrollToBottom(300);
    }
  };
  
  const handleRefresh = (event: CustomEvent) => {
    // In a real app, refresh data from the server
    setTimeout(() => {
      event.detail.complete();
    }, 1000);
  };
  
  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeConversation) return;
    
    // In a real app, send message to the server
    const mockMessage: Message = {
      id: Date.now(),
      sender_id: user?.id ? parseInt(user.id) : 0,
      recipient_id: activeConversation.participant.id,
      conversation_id: activeConversation.id,
      content: newMessage,
      created_at: new Date().toISOString(),
      is_read: false
    };
    
    setMessages([...messages, mockMessage]);
    setNewMessage('');
    scrollToBottom();
    
    // Update the conversation list with the last message
    setConversations(
      conversations.map(conv => 
        conv.id === activeConversation.id 
          ? { ...conv, last_message: mockMessage, updated_at: new Date().toISOString() }
          : conv
      )
    );
  };
  
  const renderConversationList = () => {
    if (isLoading) {
      return Array(3).fill(0).map((_, i) => (
        <IonItem key={i}>
          <IonAvatar slot="start">
            <IonSkeletonText animated />
          </IonAvatar>
          <IonLabel>
            <h2><IonSkeletonText animated style={{ width: '70%' }} /></h2>
            <p><IonSkeletonText animated style={{ width: '100%' }} /></p>
          </IonLabel>
        </IonItem>
      ));
    }
    
    let filteredConversations = [...conversations];
    
    // Filter by search term
    if (searchTerm) {
      filteredConversations = filteredConversations.filter(
        conv => conv.participant.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by segment
    if (selectedSegment === 'online') {
      filteredConversations = filteredConversations.filter(
        conv => conv.participant.is_online
      );
    }
    
    if (filteredConversations.length === 0) {
      return (
        <div className="ion-padding ion-text-center">
          <IonText color="medium">
            <p>{searchTerm ? 'No matching conversations found' : 'No conversations yet'}</p>
          </IonText>
          <IonButton fill="outline" size="small">
            <IonIcon slot="start" icon={personAdd} />
            Start a new conversation
          </IonButton>
        </div>
      );
    }
    
    return filteredConversations.map(conversation => (
      <IonItem 
        key={conversation.id} 
        button 
        detail={false}
        onClick={() => setActiveConversation(conversation)}
        color={activeConversation?.id === conversation.id ? 'light' : undefined}
      >
        <IonAvatar slot="start">
          {conversation.participant.avatar_url ? (
            <img src={conversation.participant.avatar_url} alt={conversation.participant.username} />
          ) : (
            <div className="flex items-center justify-center h-full bg-primary text-white text-lg font-bold">
              {conversation.participant.username.charAt(0).toUpperCase()}
            </div>
          )}
          {conversation.participant.is_online && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          )}
        </IonAvatar>
        
        <IonLabel>
          <h2>{conversation.participant.username}</h2>
          {conversation.last_message && (
            <p className="text-sm text-gray-500 truncate">
              {conversation.last_message.sender_id === (user?.id ? parseInt(user.id) : 0) ? 'You: ' : ''}
              {conversation.last_message.content}
            </p>
          )}
        </IonLabel>
        
        {conversation.last_message && !conversation.last_message.is_read && 
         conversation.last_message.sender_id !== (user?.id ? parseInt(user.id) : 0) && (
          <IonBadge slot="end" color="primary">New</IonBadge>
        )}
        
        <div className="text-xs text-gray-400" slot="end">
          {conversation.last_message && new Date(conversation.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </IonItem>
    ));
  };
  
  const renderMessages = () => {
    if (!activeConversation) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-4">
          <IonIcon icon={chatbubble} size="large" color="medium" />
          <IonText color="medium" className="mt-2 text-center">
            <p>Select a conversation to start chatting</p>
          </IonText>
        </div>
      );
    }
    
    if (isLoading) {
      return Array(3).fill(0).map((_, i) => (
        <div key={i} className={`px-4 py-2 my-1 rounded-lg max-w-[80%] ${i % 2 === 0 ? 'ml-auto bg-primary-100' : 'bg-gray-100'}`}>
          <IonSkeletonText animated style={{ width: '100%' }} />
          <IonSkeletonText animated style={{ width: '80%' }} />
        </div>
      ));
    }
    
    if (messages.length === 0) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-4">
          <IonText color="medium" className="text-center">
            <p>No messages yet</p>
            <p className="text-sm">Send a message to start the conversation</p>
          </IonText>
        </div>
      );
    }
    
    return messages.map(message => {
      const isMyMessage = message.sender_id === (user?.id ? parseInt(user.id) : 0);
      const msgDate = new Date(message.created_at);
      
      return (
        <div 
          key={message.id} 
          className={`px-4 py-2 my-1 rounded-lg max-w-[80%] ${
            isMyMessage 
              ? 'ml-auto bg-primary text-white' 
              : 'mr-auto bg-gray-100'
          }`}
        >
          <div className="text-sm">{message.content}</div>
          <div className={`text-xs mt-1 flex items-center justify-end ${
            isMyMessage ? 'text-primary-100' : 'text-gray-500'
          }`}>
            <IonIcon icon={time} size="small" className="mr-1" />
            {msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          
          {/* Message reactions would go here */}
        </div>
      );
    });
  };
  
  return (
    <IonPage>
      {!activeConversation ? (
        // Conversation list view
        <>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Messages</IonTitle>
              <IonButtons slot="end">
                <IonButton fill="clear" routerLink="/todos">
                  <IonIcon slot="icon-only" icon={checkmarkCircle} />
                </IonButton>
                <IonButton fill="clear" routerLink="/settings">
                  <IonIcon slot="icon-only" icon={settings} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
            <IonToolbar>
              <IonSearchbar
                value={searchTerm}
                onIonChange={e => setSearchTerm(e.detail.value!)}
                placeholder="Search conversations"
              />
            </IonToolbar>
            <IonToolbar>
              <IonSegment value={selectedSegment} onIonChange={e => setSelectedSegment(e.detail.value as 'recent' | 'online')}>
                <IonSegmentButton value="recent">
                  <IonLabel>Recent</IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value="online">
                  <IonLabel>Online</IonLabel>
                </IonSegmentButton>
              </IonSegment>
            </IonToolbar>
          </IonHeader>
          
          <IonContent>
            <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
              <IonRefresherContent></IonRefresherContent>
            </IonRefresher>
            
            <IonList>
              {renderConversationList()}
            </IonList>
            
            {/* Cross-app sync component - replace with your actual user ID */}
            <div className="p-4">
              <CrossAppSyncMobile mainAppUserId="123e4567-e89b-12d3-a456-426614174000" />
            </div>
          </IonContent>
          
          <IonFab vertical="bottom" horizontal="end" slot="fixed">
            <IonFabButton>
              <IonIcon icon={personAdd} />
            </IonFabButton>
          </IonFab>
        </>
      ) : (
        // Active conversation view
        <>
          <IonHeader>
            <IonToolbar>
              <IonButton slot="start" fill="clear" onClick={() => setActiveConversation(null)}>
                <IonIcon slot="icon-only" icon={people} />
              </IonButton>
              <IonTitle>{activeConversation.participant.username}</IonTitle>
              <IonButton slot="end" fill="clear">
                <IonIcon slot="icon-only" icon={ellipsisVertical} />
              </IonButton>
            </IonToolbar>
          </IonHeader>
          
          <IonContent ref={contentRef}>
            <div className="p-4 space-y-4">
              {renderMessages()}
            </div>
          </IonContent>
          
          <IonFooter>
            <IonToolbar>
              <div className="flex p-1">
                <IonTextarea
                  placeholder="Type a message..."
                  value={newMessage}
                  onIonChange={e => setNewMessage(e.detail.value!)}
                  rows={1}
                  autoGrow
                  className="flex-1"
                />
                <IonButton 
                  fill="clear"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  <IonIcon slot="icon-only" icon={send} />
                </IonButton>
              </div>
            </IonToolbar>
          </IonFooter>
        </>
      )}
    </IonPage>
  );
};

export default MobileMessaging;