// Helper to check if we're running in a mobile environment
// This function is moved to a separate file to avoid circular dependencies
export const isMobileApp = () => {
  // Check if running within Capacitor
  return typeof (window as any).Capacitor !== 'undefined';
};

// Note: No supabase imports in this file to prevent circular dependencies
// The supabaseMobile and getSupabaseClient functions have been moved to a 
// separate utility file to avoid circular dependencies