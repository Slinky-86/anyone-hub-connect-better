import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-unified';
import { User } from '@shared/schema';
import { authService } from '@/lib/services/auth';

interface UserContextType {
  user: Omit<User, 'password'> | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (username: string, email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Omit<User, 'password'> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { user: currentUser } = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setLoading(false);
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        try {
          const { user: currentUser } = await authService.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          console.error('Error getting user after auth change:', error);
          setUser(null);
        } finally {
          setLoading(false);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { user: authUser, error } = await authService.login({ email, password });
    if (error) {
      throw new Error(error);
    }
    setUser(authUser);
  };

  const signUp = async (username: string, email: string, password: string, displayName?: string) => {
    const { user: authUser, error } = await authService.register({
      username,
      email,
      password,
      displayName,
    });
    if (error) {
      throw new Error(error);
    }
    setUser(authUser);
  };

  const signOut = async () => {
    await authService.logout();
    setUser(null);
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      const { password: _, ...userWithoutPassword } = data;
      setUser(userWithoutPassword);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  return (
    <UserContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      signOut,
      updateUser,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}