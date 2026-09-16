import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabaseService } from '@/services/supabaseService';
import {
  User as UserIcon,
  Mail,
  Shield,
  Key,
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  Save,
  Check,
} from 'lucide-react';
import { useLocation } from 'wouter';

export function SettingsPage() {
  const { user, profile, updateProfile, signOut, isConfigured } = useAuth();
  const [, setLocation] = useLocation();

  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Operations Lead');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Database Connection Health State
  const [checkingDb, setCheckingDb] = useState(false);
  const [dbStatus, setDbStatus] = useState<{ checked: boolean; ok: boolean; message: string }>({
    checked: false,
    ok: false,
    message: '',
  });

  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    } else if (user?.user_metadata?.full_name) {
      setFullName(user.user_metadata.full_name);
    }
    if (profile?.role) {
      setRole(profile.role);
    } else if (user?.user_metadata?.role) {
      setRole(user.user_metadata.role);
    }
  }, [profile, user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const { error } = await updateProfile({
        full_name: fullName.trim(),
        role: role.trim(),
      });

      if (error) {
        setSaveError(error.message || 'Failed to update profile.');
      } else {
        setSaveSuccess(true);
        window.setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: any) {
      setSaveError(err?.message || 'Error saving changes.');
    } finally {
      setSaving(false);
    }
  };

  const checkDatabaseConnection = async () => {
    setCheckingDb(true);
    try {
      const res = await supabaseService.checkConnection();
      setDbStatus({
        checked: true,
        ok: res.ok,
        message: res.message,
      });
    } finally {
      setCheckingDb(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setLocation('/login');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[.16em] text-cyan-700">
            Configuration
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Settings & Profile
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Manage your plant operator profile, credentials, and Supabase database connection.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Left Column: Operator Profile */}
        <div className="space-y-6">
          <div className="shell-card p-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-slate-900 text-base font-bold text-cyan-300 shadow-sm">
                {(fullName || user?.email || 'OP')
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">
                  {fullName || 'Plant Operator'}
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{user?.email}</span>
                  <span>•</span>
                  <span className="font-semibold text-cyan-800">{role}</span>
                </div>
              </div>
            </div>

            {saveSuccess && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>Profile updated successfully!</span>
              </div>
            )}

            {saveError && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-800">
                <AlertCircle size={16} className="text-rose-600" />
                <span>{saveError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Full Name
                </label>
                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <UserIcon size={16} />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Email Address (Identity)
                </label>
                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-600 cursor-not-allowed shadow-2xs"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Managed via Supabase Auth identity provider.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Operational Role (Display-only)
                </label>
                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Shield size={16} />
                  </div>
                  <input
                    type="text"
                    disabled
                    value={role}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-600 cursor-not-allowed shadow-2xs"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Role assignments are managed at the facility administrator level.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  data-testid="button-save-profile"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm hover:brightness-110 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save size={15} />
                      <span>Save Profile Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Account Details & Session Card */}
          <div className="shell-card p-6">
            <h3 className="font-display font-bold text-slate-900">Session & Security</h3>
            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="font-semibold text-slate-600">Supabase User UID</span>
                <span className="font-mono text-slate-800 truncate max-w-[200px] sm:max-w-[300px]">
                  {user?.id || '—'}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="font-semibold text-slate-600">Session Status</span>
                <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Authenticated
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="font-semibold text-slate-600">Last Sign-in</span>
                <span className="font-medium text-slate-700">
                  {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Current session'}
                </span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleSignOut}
                data-testid="button-settings-logout"
                className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 transition"
              >
                <LogOut size={14} />
                <span>Log Out of Session</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Database Connection Foundation */}
        <div className="space-y-6">
          <div className="shell-card p-6">
            <div className="flex items-center gap-2 font-display text-base font-bold text-slate-900">
              <Database size={18} className="text-cyan-700" />
              <span>Supabase Database Foundation</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              DriveOps-AI connects directly to your Supabase project for real-time alert dispatch and facility telemetry.
            </p>

            <div className="mt-4 space-y-3 text-xs">
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Project Name
                </div>
                <div className="mt-0.5 font-bold text-slate-800">
                  Car Manufacturing Intelligence
                </div>
              </div>

              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Target Alerts Table
                </div>
                <div className="mt-0.5 font-mono font-bold text-slate-800">
                  public.alerts
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  alert_id, machine_id, production_line, timestamp, alert_type, severity, message, recommended_action, status
                </div>
              </div>

              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Connection Configuration
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      isConfigured ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                  <span className="font-semibold text-slate-800">
                    {isConfigured ? 'Credentials configured (.env)' : 'Local fallback mode'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={checkDatabaseConnection}
                disabled={checkingDb}
                data-testid="button-test-db-connection"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw size={14} className={checkingDb ? 'animate-spin text-cyan-700' : ''} />
                <span>{checkingDb ? 'Testing Connection...' : 'Test Database Connection'}</span>
              </button>

              {dbStatus.checked && (
                <div
                  className={`mt-3 rounded-lg border p-3 text-xs ${
                    dbStatus.ok
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-amber-200 bg-amber-50 text-amber-800'
                  }`}
                >
                  <div className="font-bold">{dbStatus.ok ? 'Connection Successful' : 'Database Status'}</div>
                  <div className="mt-0.5 leading-relaxed">{dbStatus.message}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
