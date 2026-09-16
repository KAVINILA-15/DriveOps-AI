import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseAnonKey.includes('placeholder')
  );
};

// Safe fallback credentials if environment variables have not been populated yet
// This prevents uncaught constructor errors while presenting clear setup prompts
const safeUrl = supabaseUrl || 'https://placeholder.supabase.co';
const safeKey = supabaseAnonKey || 'placeholder-anon-key';

export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
});

export type UserProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  created_at?: string;
  updated_at?: string;
};

export type DatabaseAlert = {
  alert_id: string;
  machine_id: string;
  production_line: string;
  timestamp: string;
  alert_type: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | string;
  message: string;
  recommended_action: string;
  status: string;
};
