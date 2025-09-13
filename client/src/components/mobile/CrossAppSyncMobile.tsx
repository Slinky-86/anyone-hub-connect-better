import React, { useEffect, useState } from 'react';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonBadge, IonIcon, IonItem, IonLabel, IonList, IonSkeletonText } from '@ionic/react';
import { notifications, person, checkmarkCircle } from 'ionicons/icons';
import { supabase } from '@/lib/supabase-unified';
import { useSupabaseAuth } from '@/lib/providers/MobileProviders';

interface CrossAppSyncMobileProps {
  mainAppUserId?: string; // User ID in the main app
}

interface MainAppUserData {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  is_online: boolean;
  unread_notification_count: number;
}

interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

/**
 * Mobile-optimized component that syncs data between the messaging app and the main app
 * Handles notifications, online status, and profile data for mobile devices
 */
export default function CrossAppSyncMobile({ mainAppUserId }: CrossAppSyncMobileProps) {
  const { user } = useSupabaseAuth();
  const [mainAppUser, setMainAppUser] = useState<MainAppUserData | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mainAppUserId) {
      fetchMainAppUser();
      fetchNotifications();
      
      // Set up real-time subscription for notifications
      const notificationsSubscription = supabase
        .channel('public:notifications')
        .on('postgres_changes', 
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${mainAppUserId}`
          }, 
          (payload) => {
            // Add the new notification to our state
            const newNotification = payload.new as Notification;
            setNotifications(prev => [newNotification, ...prev]);
          }
        )
        .subscribe();
        
      // Update online status when component mounts
      updateOnlineStatus();
      
      // Update online status periodically
      const interval = setInterval(updateOnlineStatus, 60000); // Every minute
      
      return () => {
        // Clean up subscriptions and intervals
        supabase.removeChannel(notificationsSubscription);
        clearInterval(interval);
      };
    }
  }, [mainAppUserId]);

  async function fetchMainAppUser() {
    try {
      setIsLoading(true);
      
      if (!mainAppUserId) {
        setError('No main app user ID provided');
        return;
      }
      
      const { data, error } = await supabase
        .from('users')
        .select('id, username, display_name, avatar_url, is_online, unread_notification_count')
        .eq('id', mainAppUserId)
        .single();
        
      if (error) throw error;
      
      if (data) {
        setMainAppUser(data as MainAppUserData);
      }
    } catch (err) {
      console.error('Error fetching main app user:', err);
      setError('Failed to load user data from main app');
    } finally {
      setIsLoading(false);
    }
  }
  
  async function fetchNotifications() {
    try {
      if (!mainAppUserId) return;
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', mainAppUserId)
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (error) throw error;
      
      if (data) {
        setNotifications(data as Notification[]);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }
  
  async function updateOnlineStatus() {
    try {
      if (!mainAppUserId) return;
      
      // Update the online status in the main app
      await supabase
        .from('users')
        .update({ is_online: true, last_seen_at: new Date().toISOString() })
        .eq('id', mainAppUserId);
    } catch (err) {
      console.error('Error updating online status:', err);
    }
  }
  
  async function markNotificationAsRead(notificationId: string) {
    try {
      // Update notification in the database
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
        
      if (error) throw error;
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true } 
            : notification
        )
      );
      
      // Update the unread count in the main app user
      if (mainAppUser && mainAppUser.unread_notification_count > 0) {
        setMainAppUser({
          ...mainAppUser,
          unread_notification_count: mainAppUser.unread_notification_count - 1
        });
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }

  if (error) {
    return (
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Connection Error</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <p>{error}</p>
        </IonCardContent>
      </IonCard>
    );
  }

  if (isLoading) {
    return (
      <IonCard>
        <IonCardHeader>
          <IonSkeletonText animated style={{ width: '80%' }} />
        </IonCardHeader>
        <IonCardContent>
          <IonSkeletonText animated style={{ width: '100%' }} />
          <IonSkeletonText animated style={{ width: '90%' }} />
          <IonSkeletonText animated style={{ width: '60%' }} />
        </IonCardContent>
      </IonCard>
    );
  }

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>
          <IonIcon icon={person} /> {mainAppUser?.display_name || mainAppUser?.username || 'User'}
          {mainAppUser?.is_online && (
            <IonBadge color="success" style={{ marginLeft: '8px' }}>
              <IonIcon icon={checkmarkCircle} /> Online
            </IonBadge>
          )}
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        {mainAppUser?.unread_notification_count ? (
          <IonBadge color="primary">
            <IonIcon icon={notifications} /> {mainAppUser.unread_notification_count} new notifications
          </IonBadge>
        ) : null}
        
        {notifications.length > 0 ? (
          <IonList>
            {notifications.map(notification => (
              <IonItem 
                key={notification.id}
                onClick={() => markNotificationAsRead(notification.id)}
                detail={!notification.is_read}
                color={notification.is_read ? undefined : 'light'}
              >
                <IonLabel>
                  <h3>{notification.title}</h3>
                  <p>{notification.body}</p>
                </IonLabel>
                {!notification.is_read && <IonBadge color="primary">New</IonBadge>}
              </IonItem>
            ))}
          </IonList>
        ) : (
          <p>No notifications</p>
        )}
      </IonCardContent>
    </IonCard>
  );
}