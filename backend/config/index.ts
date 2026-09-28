/**
 * DriveOps-AI Backend Configuration
 * Centralized, validated environment variable access
 */

export const config = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',
  
  // Database configuration
  databaseUrl: process.env.DATABASE_URL || '',
  supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  // AI Configuration
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',

  // CORS
  corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) : '*',
};

export function hasDatabaseConfig(): boolean {
  return Boolean(
    config.databaseUrl ||
    (config.supabaseUrl && config.supabaseKey && !config.supabaseUrl.includes('placeholder'))
  );
}

export function hasAiConfig(): boolean {
  return Boolean(config.geminiApiKey || config.openaiApiKey);
}
