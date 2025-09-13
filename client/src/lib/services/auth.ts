import { supabase } from '../supabase-unified';
import type { User, InsertUser, UserSettings, InsertUserSettings } from '@shared/schema';

export interface AuthUser extends Omit<User, 'password'> {
  // Exclude password from the auth user type
}

export interface AuthResponse {
  user: AuthUser | null;
  error?: string;
}

export interface RegisterData {
  username: string;
  email: string;
  displayName?: string;
  password: string;
}

export interface LoginData {
  username?: string;
  email?: string;
  password: string;
}

/**
 * Authentication Service using Supabase Auth
 * Replaces all Express auth routes (/api/auth/*)
 */
export class AuthService {
  /**
   * Register a new user with Supabase Auth and create user profile
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const { username, email, displayName, password } = data;

      // Validate required fields
      if (!username || !email || !password) {
        return { user: null, error: 'Username, email, and password are required' };
      }

      // Check if username already exists in our users table
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .single();

      if (existingUser) {
        return { user: null, error: 'Username already exists' };
      }

      // Register with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            display_name: displayName || username,
          }
        }
      });

      if (authError) {
        return { user: null, error: authError.message };
      }

      if (!authData.user) {
        return { user: null, error: 'Failed to create user account' };
      }

      // Create user profile in our users table
      const userProfile: InsertUser = {
        username,
        email,
        password: '', // We don't store passwords since Supabase handles auth
        displayName: displayName || username,
        avatarUrl: null,
        isOnline: true,
        showOnlineStatus: true,
      };

      const { data: newUser, error: profileError } = await supabase
        .from('users')
        .insert([userProfile])
        .select()
        .single();

      if (profileError) {
        // If profile creation fails, we should clean up the auth user
        await supabase.auth.admin.deleteUser(authData.user.id);
        return { user: null, error: 'Failed to create user profile' };
      }

      // Create default user settings
      const defaultSettings: InsertUserSettings = {
        userId: newUser.id,
        theme: 'light',
        accentColor: 'teal',
        backgroundColor: 'white',
        chatBackground: 'solid',
        chatBackgroundColor: 'white',
        showOnlineStatus: true,
        sendReadReceipts: true,
        autoSaveMessages: false,
      };

      await supabase
        .from('user_settings')
        .insert([defaultSettings]);

      // Return user without password
      const { password: _, ...userWithoutPassword } = newUser;
      return { user: userWithoutPassword };

    } catch (error) {
      console.error('Registration error:', error);
      return { user: null, error: 'Registration failed' };
    }
  }

  /**
   * Login user with Supabase Auth
   */
  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const { username, email, password } = data;

      if (!password || (!username && !email)) {
        return { user: null, error: 'Username/email and password are required' };
      }

      // If username is provided, we need to get the email first
      let loginEmail = email;
      if (username && !email) {
        const { data: userData } = await supabase
          .from('users')
          .select('email')
          .eq('username', username)
          .single();

        if (!userData?.email) {
          return { user: null, error: 'Invalid credentials' };
        }
        loginEmail = userData.email;
      }

      if (!loginEmail) {
        return { user: null, error: 'Email is required for login' };
      }

      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (authError) {
        return { user: null, error: 'Invalid credentials' };
      }

      if (!authData.user) {
        return { user: null, error: 'Login failed' };
      }

      // Get user profile from our users table
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('email', loginEmail)
        .single();

      if (profileError || !userProfile) {
        return { user: null, error: 'User profile not found' };
      }

      // Update online status
      await supabase
        .from('users')
        .update({ isOnline: true })
        .eq('id', userProfile.id);

      // Return user without password
      const { password: _, ...userWithoutPassword } = userProfile;
      return { user: userWithoutPassword };

    } catch (error) {
      console.error('Login error:', error);
      return { user: null, error: 'Login failed' };
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<{ error?: string }> {
    try {
      // Get current user before logout
      const currentUser = await this.getCurrentUser();
      
      if (currentUser.user) {
        // Update online status to false
        await supabase
          .from('users')
          .update({ isOnline: false })
          .eq('id', currentUser.user.id);
      }

      // Sign out from Supabase Auth
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('Logout error:', error);
      return { error: 'Logout failed' };
    }
  }

  /**
   * Get currently authenticated user
   */
  async getCurrentUser(): Promise<AuthResponse> {
    try {
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        return { user: null, error: 'Not authenticated' };
      }

      // Get user profile from our users table
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('email', session.user.email)
        .single();

      if (profileError || !userProfile) {
        return { user: null, error: 'User profile not found' };
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = userProfile;
      return { user: userWithoutPassword };

    } catch (error) {
      console.error('Get current user error:', error);
      return { user: null, error: 'Failed to get current user' };
    }
  }

  /**
   * Get current Supabase session
   */
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        callback(null);
        return;
      }

      // Get user profile when signed in
      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('email', session.user.email)
        .single();

      if (userProfile) {
        const { password: _, ...userWithoutPassword } = userProfile;
        callback(userWithoutPassword);
      } else {
        callback(null);
      }
    });
  }

  /**
   * Update user online status
   */
  async updateOnlineStatus(userId: number, isOnline: boolean): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ isOnline })
        .eq('id', userId);

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('Update online status error:', error);
      return { error: 'Failed to update online status' };
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;