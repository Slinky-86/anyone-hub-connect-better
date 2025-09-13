import React, { useEffect, useState } from 'react';
import IonicAppWrapper from './IonicApp';
import AppRouter from '../AppRouter';
import { isMobileApp } from '@/lib/supabase-mobile';

/**
 * Component that detects if we're running in a mobile environment (Capacitor)
 * and renders the appropriate interface.
 * 
 * This allows the same codebase to be used for both web and mobile with
 * environment-specific optimizations.
 */
const MobileDetector: React.FC = () => {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  
  useEffect(() => {
    // Check if we're running in a Capacitor mobile environment
    const checkMobile = async () => {
      const isRunningAsMobileApp = isMobileApp();
      setIsMobile(isRunningAsMobileApp);
    };
    
    checkMobile();
  }, []);
  
  // Show loading state while detecting environment
  if (isMobile === null) {
    return <div>Loading...</div>;
  }
  
  // Render mobile interface with Ionic UI for mobile
  if (isMobile) {
    return <IonicAppWrapper />;
  }
  
  // Render standard web interface for browser with authentication flow handling
  return <AppRouter />;
};

export default MobileDetector;