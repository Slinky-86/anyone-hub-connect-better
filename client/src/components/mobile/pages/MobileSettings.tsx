import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonToggle,
  IonButton,
  IonIcon,
  IonSelectOption,
  IonSelect,
  IonItemDivider,
  IonBackButton,
  IonButtons,
  IonLoading,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonAvatar,
  useIonToast,
  IonAlert
} from '@ionic/react';
import { 
  moon, 
  sunny, 
  notifications, 
  eye, 
  eyeOff, 
  colorPalette, 
  logOut, 
  person,
  lockClosed
} from 'ionicons/icons';
import { supabase } from '@/lib/supabase-unified';
import { useSupabaseAuth } from '@/lib/providers/MobileProviders';

interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  show_online_status: boolean;
  message_notifications: boolean;
  accent_color: string;
}

const MobileSettings: React.FC = () => {
  const { user, signOut } = useSupabaseAuth();
  const [presentToast] = useIonToast();
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'system',
    show_online_status: true,
    message_notifications: true,
    accent_color: 'primary'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  
  // Load user settings
  useEffect(() => {
    async function loadSettings() {
      try {
        setIsLoading(true);
        
        if (user) {
          // In a real app, fetch settings from Supabase
          const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', user.id)
            .single();
            
          if (error) {
            console.error('Error loading settings:', error);
          } else if (data) {
            setSettings({
              theme: data.theme || 'system',
              show_online_status: data.show_online_status !== false,
              message_notifications: data.message_notifications !== false,
              accent_color: data.accent_color || 'primary'
            });
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadSettings();
  }, [user]);
  
  // Save a setting
  const saveSetting = async (key: keyof UserSettings, value: any) => {
    try {
      // Update local state
      setSettings(prev => ({ ...prev, [key]: value }));
      
      // In a real app, save to Supabase
      if (user) {
        const { error } = await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            [key]: value,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });
          
        if (error) {
          throw error;
        }
        
        presentToast({
          message: 'Settings saved successfully',
          duration: 2000,
          color: 'success'
        });
      }
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
      presentToast({
        message: `Failed to save setting: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: 3000,
        color: 'danger'
      });
      
      // Revert the change in local state
      setSettings(prev => ({ ...prev, [key]: prev[key] }));
    }
  };
  
  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    saveSetting('theme', theme);
    
    // Apply theme in the app
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  };
  
  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await signOut();
      
      // Redirect to login
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
      presentToast({
        message: 'Failed to sign out. Please try again.',
        duration: 3000,
        color: 'danger'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/messaging" />
          </IonButtons>
          <IonTitle>Settings</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        <IonLoading isOpen={isLoading} message="Loading settings..." />
        
        {user && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Profile</IonCardTitle>
            </IonCardHeader>
            <IonCardContent className="flex items-center">
              <IonAvatar className="mr-4">
                <div className="flex items-center justify-center h-full bg-primary text-white text-lg font-bold">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              </IonAvatar>
              <div>
                <h2 className="text-lg font-medium">{user.email}</h2>
                <p className="text-sm text-gray-500">User ID: {user.id.substring(0, 8)}...</p>
              </div>
            </IonCardContent>
          </IonCard>
        )}
        
        <IonList>
          <IonItemDivider>Appearance</IonItemDivider>
          
          <IonItem>
            <IonIcon slot="start" icon={settings.theme === 'dark' ? moon : sunny} />
            <IonLabel>Theme</IonLabel>
            <IonSelect 
              value={settings.theme} 
              onIonChange={e => handleThemeChange(e.detail.value)}
              interface="popover"
            >
              <IonSelectOption value="light">Light</IonSelectOption>
              <IonSelectOption value="dark">Dark</IonSelectOption>
              <IonSelectOption value="system">System Default</IonSelectOption>
            </IonSelect>
          </IonItem>
          
          <IonItem>
            <IonIcon slot="start" icon={colorPalette} />
            <IonLabel>Accent Color</IonLabel>
            <IonSelect 
              value={settings.accent_color} 
              onIonChange={e => saveSetting('accent_color', e.detail.value)}
              interface="popover"
            >
              <IonSelectOption value="primary">Teal (Default)</IonSelectOption>
              <IonSelectOption value="secondary">Purple</IonSelectOption>
              <IonSelectOption value="tertiary">Blue</IonSelectOption>
              <IonSelectOption value="success">Green</IonSelectOption>
              <IonSelectOption value="warning">Orange</IonSelectOption>
              <IonSelectOption value="danger">Red</IonSelectOption>
            </IonSelect>
          </IonItem>
          
          <IonItemDivider>Privacy & Notifications</IonItemDivider>
          
          <IonItem>
            <IonIcon slot="start" icon={settings.show_online_status ? eye : eyeOff} />
            <IonLabel>Show Online Status</IonLabel>
            <IonToggle 
              checked={settings.show_online_status} 
              onIonChange={e => saveSetting('show_online_status', e.detail.checked)}
            />
          </IonItem>
          
          <IonItem>
            <IonIcon slot="start" icon={notifications} />
            <IonLabel>Message Notifications</IonLabel>
            <IonToggle 
              checked={settings.message_notifications} 
              onIonChange={e => saveSetting('message_notifications', e.detail.checked)}
            />
          </IonItem>
          
          <IonItemDivider>Account</IonItemDivider>
          
          <IonItem button onClick={() => setShowLogoutAlert(true)}>
            <IonIcon slot="start" icon={logOut} color="danger" />
            <IonLabel color="danger">Log Out</IonLabel>
          </IonItem>
        </IonList>
        
        <div className="p-4 text-center text-sm text-gray-500">
          <p>AnyoneConnect Mobile v1.0.0</p>
          <p>Powered by Ionic React & Supabase</p>
        </div>
        
        <IonAlert
          isOpen={showLogoutAlert}
          onDidDismiss={() => setShowLogoutAlert(false)}
          header="Log Out"
          message="Are you sure you want to log out? You'll need to sign in again to access your messages."
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel'
            },
            {
              text: 'Log Out',
              role: 'destructive',
              handler: handleLogout
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default MobileSettings;