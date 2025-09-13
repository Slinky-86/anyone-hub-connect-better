import React, { useState } from 'react';
import { useHistory } from 'react-router';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonInput,
  IonButton,
  IonLoading,
  IonItem,
  IonLabel,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonText,
  IonIcon,
  useIonToast
} from '@ionic/react';
import { logIn, mail, lockClosed, personAdd } from 'ionicons/icons';
import { useSupabaseAuth } from '@/lib/providers/MobileProviders';

const MobileLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showLoading, setShowLoading] = useState(false);
  const [presentToast] = useIonToast();
  const { signIn } = useSupabaseAuth();
  const history = useHistory();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      presentToast({
        message: 'Please enter both email and password',
        duration: 2000,
        color: 'warning'
      });
      return;
    }
    
    try {
      setShowLoading(true);
      await signIn(email, password);
      history.push('/messaging');
    } catch (error: any) {
      presentToast({
        message: error.message || 'Login failed. Please try again.',
        duration: 3000,
        color: 'danger'
      });
    } finally {
      setShowLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Sign In</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle className="text-center">Welcome to AnyoneConnect</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <form onSubmit={handleLogin}>
              <IonItem>
                <IonIcon slot="start" icon={mail}></IonIcon>
                <IonLabel position="floating">Email</IonLabel>
                <IonInput
                  type="email"
                  value={email}
                  onIonChange={(e) => setEmail(e.detail.value || '')}
                  required
                />
              </IonItem>

              <IonItem className="mt-2">
                <IonIcon slot="start" icon={lockClosed}></IonIcon>
                <IonLabel position="floating">Password</IonLabel>
                <IonInput
                  type="password"
                  value={password}
                  onIonChange={(e) => setPassword(e.detail.value || '')}
                  required
                />
              </IonItem>

              <IonButton
                className="mt-4"
                expand="block"
                type="submit"
              >
                <IonIcon slot="start" icon={logIn}></IonIcon>
                Sign In
              </IonButton>
            </form>
            
            <div className="mt-4 text-center">
              <IonText color="medium">
                <p>Don't have an account?</p>
              </IonText>
              <IonButton 
                fill="outline" 
                expand="block"
                routerLink="/register"
              >
                <IonIcon slot="start" icon={personAdd}></IonIcon>
                Create Account
              </IonButton>
            </div>
          </IonCardContent>
        </IonCard>
        
        <IonLoading
          isOpen={showLoading}
          message="Signing in..."
        />
      </IonContent>
    </IonPage>
  );
};

export default MobileLogin;