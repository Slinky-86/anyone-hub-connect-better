import React, { createContext, useContext, useEffect, useState } from 'react';
import { IonSpinner } from '@ionic/react';
import { supabase } from '../supabase-unified';
import { Session, User } from '@supabase/supabase-js';

// Create context for Supabase auth
type SupabaseAuthContextType = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
};

const SupabaseAuthContext = createContext<SupabaseAuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  signIn: async () => null,
  signOut: async () => {},
});

// Create provider component
export const SupabaseAuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Set up listener for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in function using Supabase auth
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  // Sign out function using Supabase auth
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  // Create value object
  const value = {
    session,
    user,
    isLoading,
    signIn,
    signOut,
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {isLoading ? <IonSpinner name="crescent" /> : children}
    </SupabaseAuthContext.Provider>
  );
};

// Hook for using the auth context
export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};

// Main provider wrapper to include all providers needed for mobile
export const MobileProviders: React.FC<{children: React.ReactNode}> = ({ children }) => {
  return (
    <SupabaseAuthProvider>
      {children}
    </SupabaseAuthProvider>
  );
};

export default MobileProviders;