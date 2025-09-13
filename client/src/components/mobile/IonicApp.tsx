import React from 'react';
import { 
  IonApp, 
  IonContent, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButtons, 
  IonBackButton,
  IonPage,
  IonRouterOutlet,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect } from 'react-router';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import '@/index.css';

/* Pages */
import MobileLogin from './pages/MobileLogin';
import MobileMessaging from './pages/MobileMessaging';
import MobileSettings from './pages/MobileSettings';
import MobileTodos from './MobileTodos';

/* Providers */
import { MobileProviders } from '@/lib/providers/MobileProviders';
import { useSupabaseAuth } from '@/lib/providers/MobileProviders';

// Initialize Ionic
setupIonicReact();

// Private route component that redirects to login if not authenticated
const PrivateRoute: React.FC<{
  component: React.ComponentType<any>;
  path: string;
  exact?: boolean;
}> = ({ component: Component, ...rest }) => {
  const { user } = useSupabaseAuth();
  
  return (
    <Route
      {...rest}
      render={(props) =>
        user ? <Component {...props} /> : <Redirect to="/login" />
      }
    />
  );
};

// Main App wrapper with providers
export const IonicAppWrapper: React.FC = () => {
  return (
    <MobileProviders>
      <IonicApp />
    </MobileProviders>
  );
};

// Ionic App component
const IonicApp: React.FC = () => {
  const { user, isLoading } = useSupabaseAuth();

  if (isLoading) {
    return (
      <IonApp>
        <IonPage>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Loading...</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h2>Loading application...</h2>
                {/* You can add a spinner here */}
              </div>
            </div>
          </IonContent>
        </IonPage>
      </IonApp>
    );
  }

  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route path="/login" component={MobileLogin} exact />
          <PrivateRoute path="/messaging" component={MobileMessaging} exact />
          <PrivateRoute path="/settings" component={MobileSettings} exact />
          <PrivateRoute path="/todos" component={MobileTodos} exact />
          <Route exact path="/">
            <Redirect to={user ? "/messaging" : "/login"} />
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default IonicAppWrapper;