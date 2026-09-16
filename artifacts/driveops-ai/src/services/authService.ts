import { supabase, isSupabaseConfigured, type UserProfile } from '@/lib/supabase';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

export interface AuthErrorResponse {
  message: string;
}

export const authService = {
  /**
   * Check if Supabase connection credentials are configured
   */
  isConfigured(): boolean {
    return isSupabaseConfigured();
  },

  /**
   * Sign in with email and password
   */
  async signIn({ email, password }: { email: string; password: string }): Promise<{ user: User | null; session: Session | null; error: Error | null }> {
    if (!isSupabaseConfigured()) {
      return {
        user: null,
        session: null,
        error: new Error('Supabase is not configured yet. Please provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'),
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { user: null, session: null, error };
      }

      return { user: data.user, session: data.session, error: null };
    } catch (err: any) {
      return { user: null, session: null, error: err || new Error('Network error during authentication') };
    }
  },

  /**
   * Sign up a new user with full name and credentials
   */
  async signUp({
    email,
    password,
    fullName,
  }: {
    email: string;
    password: string;
    fullName: string;
  }): Promise<{ user: User | null; session: Session | null; emailConfirmationRequired: boolean; error: Error | null }> {
    if (!isSupabaseConfigured()) {
      return {
        user: null,
        session: null,
        emailConfirmationRequired: false,
        error: new Error('Supabase is not configured yet. Please provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'),
      };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: 'Operations Lead',
          },
        },
      });

      if (error) {
        return { user: null, session: null, emailConfirmationRequired: false, error };
      }

      // If user is created but session is null, Supabase requires email verification
      const emailConfirmationRequired = Boolean(data.user && !data.session);

      // Attempt to upsert initial profile if session was established
      if (data.user?.id) {
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: fullName.trim(),
            email: email.trim(),
            role: 'Operations Lead',
            updated_at: new Date().toISOString(),
          });
        } catch {
          // Table might not exist yet; user metadata is the primary source
        }
      }

      return {
        user: data.user,
        session: data.session,
        emailConfirmationRequired,
        error: null,
      };
    } catch (err: any) {
      return {
        user: null,
        session: null,
        emailConfirmationRequired: false,
        error: err || new Error('Network error during sign up'),
      };
    }
  },

  /**
   * Send a password reset email
   */
  async resetPassword(email: string): Promise<{ success: boolean; error: Error | null }> {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        error: new Error('Supabase is not configured yet. Please provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'),
      };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) {
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err || new Error('Network error during password reset request') };
    }
  },

  /**
   * Sign out the active user
   */
  async signOut(): Promise<{ error: Error | null }> {
    if (!isSupabaseConfigured()) {
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (err: any) {
      return { error: err || new Error('Sign out failed') };
    }
  },

  /**
   * Get current session from Supabase
   */
  async getSession(): Promise<Session | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    try {
      const { data } = await supabase.auth.getSession();
      return data.session;
    } catch {
      return null;
    }
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    try {
      const { data } = await supabase.auth.getUser();
      return data.user;
    } catch {
      return null;
    }
  },

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    if (!isSupabaseConfigured()) {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
    return supabase.auth.onAuthStateChange(callback);
  },

  /**
   * Fetch public user profile from profiles table or fallback to user metadata
   */
  async getProfile(user: User): Promise<UserProfile> {
    const fallbackProfile: UserProfile = {
      id: user.id,
      full_name: (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'Operator',
      email: user.email || null,
      role: (user.user_metadata?.role as string) || 'Operations Lead',
      created_at: user.created_at,
    };

    if (!isSupabaseConfigured()) {
      return fallbackProfile;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error || !data) {
        return fallbackProfile;
      }

      return {
        id: data.id,
        full_name: data.full_name || fallbackProfile.full_name,
        email: data.email || fallbackProfile.email,
        role: data.role || fallbackProfile.role,
        created_at: data.created_at || fallbackProfile.created_at,
        updated_at: data.updated_at,
      };
    } catch {
      return fallbackProfile;
    }
  },

  /**
   * Update user profile in both user metadata and profiles table
   */
  async updateProfile(
    userId: string,
    updates: { full_name?: string; role?: string }
  ): Promise<{ profile: UserProfile | null; error: Error | null }> {
    try {
      // 1. Update user metadata in auth.users
      const { data: userData, error: userError } = await supabase.auth.updateUser({
        data: updates,
      });

      if (userError) {
        return { profile: null, error: userError };
      }

      // 2. Try updating public.profiles table
      try {
        await supabase
          .from('profiles')
          .upsert({
            id: userId,
            full_name: updates.full_name,
            role: updates.role,
            updated_at: new Date().toISOString(),
          });
      } catch {
        // Continue even if profiles table is not yet created
      }

      const updatedProfile: UserProfile = {
        id: userId,
        full_name: updates.full_name || (userData.user?.user_metadata?.full_name as string) || '',
        email: userData.user?.email || null,
        role: updates.role || (userData.user?.user_metadata?.role as string) || 'Operations Lead',
        updated_at: new Date().toISOString(),
      };

      return { profile: updatedProfile, error: null };
    } catch (err: any) {
      return { profile: null, error: err || new Error('Failed to update profile') };
    }
  },
};
