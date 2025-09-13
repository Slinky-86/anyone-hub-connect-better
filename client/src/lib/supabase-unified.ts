import { createClient } from '@supabase/supabase-js';
import { isMobileApp } from './supabase-mobile';

// Common environment variables for both web and mobile
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Determine appropriate storage based on environment
const getStorage = () => {
  // For web development, use localStorage
  return {
    getItem: (key: string) => {
      try {
        // Access native storage when available, fallback to localStorage for dev
        return localStorage.getItem(key);
      } catch (error) {
        console.error('Error accessing storage:', error);
        return null;
      }
    },
    setItem: (key: string, value: string) => {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.error('Error setting storage item:', error);
      }
    },
    removeItem: (key: string) => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error('Error removing storage item:', error);
      }
    },
  };
};

// Create a single Supabase client for use in both web and mobile
const createUnifiedClient = () => {
  const isMobile = isMobileApp();
  
  console.log(`Creating Supabase client for ${isMobile ? 'mobile' : 'web'} environment`);
  
  // Create and export a single Supabase client
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      storage: getStorage(),
    },
  });
};

// Export a single client instance
export const supabase = createUnifiedClient();

// Helper functions for authentication
export const signIn = async (email: string, password: string) => {
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

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Get the current session with debugging info
export const getCurrentSession = async () => {
  try {
    // Get the current session from Supabase
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return { session: null, error, debug: { localStorage: null, cookies: null } };
    }
    
    // Get debugging info
    let localStorage = null;
    let cookies = null;
    
    try {
      // Try to get localStorage auth items
      localStorage = {
        'supabase.auth.token': window.localStorage.getItem('supabase.auth.token'),
        'sb-access-token': window.localStorage.getItem('sb-access-token'),
        'sb-refresh-token': window.localStorage.getItem('sb-refresh-token'),
      };
    } catch (e) {
      console.error('Error accessing localStorage:', e);
    }
    
    try {
      // Try to get cookies
      cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        if (key) acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
    } catch (e) {
      console.error('Error accessing cookies:', e);
    }
    
    return {
      session: data.session,
      error: null,
      debug: { localStorage, cookies }
    };
  } catch (error) {
    console.error('Error in getCurrentSession:', error);
    return { session: null, error, debug: { localStorage: null, cookies: null } };
  }
};

export default supabase;