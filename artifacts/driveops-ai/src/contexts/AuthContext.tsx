import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { authService } from '@/services/authService';
import type { UserProfile } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isConfigured: boolean;
  signIn: (creds: { email: string; password: string }) => Promise<{ error: Error | null }>;
  signInDemo: () => void;
  signUp: (params: { email: string; password: string; fullName: string }) => Promise<{ emailConfirmationRequired: boolean; error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error: Error | null }>;
  updateProfile: (updates: { full_name?: string; role?: string }) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const isConfigured = authService.isConfigured();

  const loadUserProfile = async (currentUser: User) => {
    try {
      const p = await authService.getProfile(currentUser);
      setProfile(p);
    } catch {
      // Ignore profile load errors
    }
  };

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const initialSession = await authService.getSession();
        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          if (initialSession?.user) {
            await loadUserProfile(initialSession.user);
          }
        }
      } catch (err) {
        console.warn('Error hydrating auth session:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initAuth();

    const { data: authListener } = authService.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        await loadUserProfile(newSession.user);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signIn = async ({ email, password }: { email: string; password: string }) => {
    const res = await authService.signIn({ email, password });
    if (!res.error && res.user) {
      setUser(res.user);
      setSession(res.session);
      await loadUserProfile(res.user);
    }
    return { error: res.error };
  };

  const signInDemo = () => {
    const demoUser: User = {
      id: 'demo-operator-id',
      app_metadata: { provider: 'demo' },
      user_metadata: { full_name: 'Alex Chen', role: 'Operations Lead' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: 'alex.chen@northstar-assembly.com',
    } as any;
    setUser(demoUser);
    setProfile({
      id: 'demo-operator-id',
      full_name: 'Alex Chen',
      email: 'alex.chen@northstar-assembly.com',
      role: 'Operations Lead',
      updated_at: new Date().toISOString(),
    });
  };

  const signUp = async ({ email, password, fullName }: { email: string; password: string; fullName: string }) => {
    const res = await authService.signUp({ email, password, fullName });
    if (!res.error && res.user && res.session) {
      setUser(res.user);
      setSession(res.session);
      await loadUserProfile(res.user);
    }
    return {
      emailConfirmationRequired: res.emailConfirmationRequired,
      error: res.error,
    };
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    return authService.resetPassword(email);
  };

  const updateProfile = async (updates: { full_name?: string; role?: string }) => {
    if (!user) return { error: new Error('No authenticated user') };
    const res = await authService.updateProfile(user.id, updates);
    if (!res.error && res.profile) {
      setProfile(res.profile);
    }
    return { error: res.error };
  };

  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isConfigured,
        signIn,
        signInDemo,
        signUp,
        signOut,
        resetPassword,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
