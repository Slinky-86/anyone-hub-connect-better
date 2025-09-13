import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase-unified';
import { useToast } from '@/hooks/use-toast';
import { storageService } from '@/lib/services/storage';
import AuthPage from '@/pages/auth-page';
import MessagingPage from '@/pages/messaging';
import { UserProvider } from '@/lib/context/user-context';
import { WebSocketProvider } from '@/lib/context/websocket-context';
import MobileDetector from '@/components/mobile/MobileDetector';

function AppContent() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  // Check authentication on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setAuthenticated(!!data.session);
        
        if (data.session) {
          // Initialize storage buckets
          const success = await storageService.initializeBuckets();
          if (success.error) {
            console.error('Failed to initialize storage buckets:', success.error);
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setAuthenticated(!!session);
      
      if (event === 'SIGNED_OUT') {
        navigate('/auth');
      } else if (event === 'SIGNED_IN' && (location === "/" || location === "/auth")) {
        navigate('/messaging');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [location, navigate]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show auth page if not authenticated
  if (!authenticated) {
    return <AuthPage />;
  }

  // Show messaging page if authenticated
  return <MobileDetector />;
}

export default function App() {
  return (
    <UserProvider>
      <WebSocketProvider>
        <AppContent />
      </WebSocketProvider>
    </UserProvider>
  );
}