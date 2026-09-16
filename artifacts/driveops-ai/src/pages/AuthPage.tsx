import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import {
  Zap,
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Factory,
  Sparkles,
  Info,
} from 'lucide-react';

interface AuthPageProps {
  initialMode?: 'signin' | 'signup' | 'forgot';
}

export function AuthPage({ initialMode = 'signin' }: AuthPageProps) {
  const { user, signIn, signInDemo, signUp, resetPassword, isConfigured } = useAuth();
  const [, setLocation] = useLocation();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // State Feedback
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      setLocation('/dashboard');
    }
  }, [user, setLocation]);

  const clearMessages = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signIn({ email, password });
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrorMessage('Invalid email or password. Please check your credentials and try again.');
        } else if (error.message.includes('Email not confirmed')) {
          setErrorMessage('Please confirm your email address before signing in. Check your inbox for the activation link.');
        } else if (error.message.includes('Failed to fetch') || error.message.includes('Network error')) {
          setErrorMessage('Unable to connect to Supabase endpoint. Please verify that your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in artifacts/driveops-ai/.env point to your active Supabase project.');
        } else {
          setErrorMessage(error.message || 'Authentication failed. Please try again.');
        }
      } else {
        setLocation('/dashboard');
      }
    } catch (err: any) {
      if (err?.message?.includes('Failed to fetch')) {
        setErrorMessage('Unable to reach Supabase project. Please verify your Supabase project URL and anon key in .env.');
      } else {
        setErrorMessage(err?.message || 'An unexpected connection error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!fullName.trim()) {
      setErrorMessage('Please provide your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter your confirmation password.');
      return;
    }

    setLoading(true);
    try {
      const { emailConfirmationRequired, error } = await signUp({
        email,
        password,
        fullName,
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          setErrorMessage('An account with this email already exists. Please sign in instead.');
        } else if (error.message.includes('Failed to fetch') || error.message.includes('Network error')) {
          setErrorMessage('Unable to connect to Supabase endpoint. Please verify that your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in artifacts/driveops-ai/.env point to your active Supabase project.');
        } else {
          setErrorMessage(error.message || 'Registration failed. Please try again.');
        }
      } else if (emailConfirmationRequired) {
        setSuccessMessage('Registration successful! Please check your email to confirm your account, then sign in.');
        setMode('signin');
      } else {
        setSuccessMessage('Account created successfully! Redirecting...');
        setLocation('/dashboard');
      }
    } catch (err: any) {
      if (err?.message?.includes('Failed to fetch')) {
        setErrorMessage('Unable to reach Supabase project. Please verify your Supabase project URL and anon key in .env.');
      } else {
        setErrorMessage(err?.message || 'Failed to complete registration.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please provide the email address associated with your account.');
      return;
    }

    setLoading(true);
    try {
      const { success, error } = await resetPassword(email);
      if (error) {
        setErrorMessage(error.message || 'Unable to send password reset email.');
      } else if (success) {
        setSuccessMessage('Password reset link sent! Please check your inbox for instructions.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to request password reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
      {/* Left Industrial Branding Banner (Visible on large screens) */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-slate-800 bg-slate-900 p-12 lg:flex">
        {/* Background Grid Accent */}
        <div className="pointer-events-none absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#38bdf8_1px,transparent_1px),linear-gradient(to_bottom,#38bdf8_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        
        {/* Top Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/20">
            <Zap size={24} fill="currentColor" />
          </div>
          <div>
            <div className="font-display text-2xl font-extrabold tracking-tight text-white">
              DriveOps<span className="text-cyan-400">-AI</span>
            </div>
            <div className="font-mono text-[9px] font-bold uppercase tracking-[.25em] text-cyan-300/80">
              Smart Car Manufacturing Intelligence
            </div>
          </div>
        </div>

        {/* Center Feature Highlights */}
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300 backdrop-blur-md">
            <Sparkles size={14} /> Production Intelligence Engine
          </div>
          <h1 className="font-display text-4xl font-extrabold leading-tight text-white xl:text-5xl">
            Real-time control for smart automotive lines.
          </h1>
          <p className="max-w-md text-base leading-relaxed text-slate-400">
            Secure, role-based manufacturing telemetry powered by Supabase authentication and operational databases.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 text-xs">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex items-center gap-2 font-bold text-cyan-400">
                <Factory size={16} /> Northstar Assembly
              </div>
              <div className="mt-1 text-slate-400">Continuous telemetry monitoring across 4 production lines.</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex items-center gap-2 font-bold text-emerald-400">
                <ShieldCheck size={16} /> Supabase Auth
              </div>
              <div className="mt-1 text-slate-400">Enterprise session tokens, secure RLS, and encrypted identity.</div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500">
          <span>DriveOps-AI Enterprise Edition</span>
          <span>v1.0.0 · Supabase Connected</span>
        </div>
      </div>

      {/* Right Authentication Form Container */}
      <div className="flex w-full items-center justify-center p-6 lg:w-1/2 lg:p-12">
        <div className="w-full max-w-md space-y-7">
          {/* Mobile Logo Header */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-400 text-slate-950 shadow-md">
              <Zap size={22} fill="currentColor" />
            </div>
            <div>
              <div className="font-display text-xl font-extrabold tracking-tight text-white">
                DriveOps<span className="text-cyan-400">-AI</span>
              </div>
              <div className="font-mono text-[9px] font-bold uppercase tracking-[.2em] text-slate-400">
                Factory Intelligence
              </div>
            </div>
          </div>

          {/* Form Header */}
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {mode === 'signin' && 'Sign in to your station'}
              {mode === 'signup' && 'Register operator account'}
              {mode === 'forgot' && 'Reset station password'}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              {mode === 'signin' && 'Enter your factory credentials to access line telemetry and alert feeds.'}
              {mode === 'signup' && 'Create a new operator profile backed by Supabase authentication.'}
              {mode === 'forgot' && 'Enter your operator email and we will dispatch a password recovery link.'}
            </p>
          </div>

          {/* Supabase Configuration Notice (Visible if .env has placeholders or is missing) */}
          {!isConfigured && (
            <div
              data-testid="alert-supabase-unconfigured"
              className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-200"
            >
              <div className="flex items-start gap-2.5">
                <Info size={18} className="shrink-0 text-amber-400 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-amber-300">Supabase Credentials Notice</div>
                  <p className="text-amber-200/90 leading-relaxed">
                    Set <code className="rounded bg-amber-950/60 px-1 py-0.5 font-mono text-[11px] text-amber-300">VITE_SUPABASE_URL</code> and{' '}
                    <code className="rounded bg-amber-950/60 px-1 py-0.5 font-mono text-[11px] text-amber-300">VITE_SUPABASE_ANON_KEY</code> in{' '}
                    <code className="rounded bg-amber-950/60 px-1 py-0.5 font-mono text-[11px] text-amber-300">artifacts/driveops-ai/.env</code> to connect to your live project.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div
              data-testid="alert-auth-error"
              className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 animate-in fade-in"
            >
              <AlertCircle size={18} className="shrink-0 text-rose-400 mt-0.5" />
              <div className="font-medium leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div
              data-testid="alert-auth-success"
              className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 animate-in fade-in"
            >
              <CheckCircle2 size={18} className="shrink-0 text-emerald-400 mt-0.5" />
              <div className="font-medium leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* Mode Switcher Tabs (Sign In vs Sign Up) */}
          {mode !== 'forgot' && (
            <div className="flex rounded-lg border border-slate-800 bg-slate-900/80 p-1">
              <button
                type="button"
                data-testid="tab-signin"
                onClick={() => {
                  clearMessages();
                  setMode('signin');
                }}
                className={`flex-1 rounded-md py-2 text-xs font-bold transition ${
                  mode === 'signin'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                data-testid="tab-signup"
                onClick={() => {
                  clearMessages();
                  setMode('signup');
                }}
                className={`flex-1 rounded-md py-2 text-xs font-bold transition ${
                  mode === 'signup'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Register
              </button>
            </div>
          )}

          {/* SIGN IN FORM */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4" data-testid="form-signin">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Email Address
                </label>
                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    required
                    data-testid="input-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operator@northstar-assembly.com"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/90 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Password
                  </label>
                  <button
                    type="button"
                    data-testid="link-forgot-password"
                    onClick={() => {
                      clearMessages();
                      setMode('forgot');
                    }}
                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    data-testid="input-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/90 py-2.5 pl-10 pr-11 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                  <button
                    type="button"
                    data-testid="button-toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-400"
                  />
                  <span className="text-xs text-slate-400">Remember authenticated session</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                data-testid="button-submit-signin"
                className="group flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-400 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60 shadow-md shadow-cyan-400/10"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Station</span>
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>

              <div className="relative my-3 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800" /></div>
                <span className="relative bg-slate-950 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">or preview</span>
              </div>

              <button
                type="button"
                data-testid="button-demo-signin"
                onClick={() => {
                  signInDemo();
                  setLocation('/dashboard');
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-950/40 py-2.5 text-xs font-bold text-cyan-300 hover:bg-cyan-900/50 hover:border-cyan-400 transition"
              >
                <Sparkles size={14} /> Quick Demo Access (Operations Lead)
              </button>
            </form>
          )}

          {/* SIGN UP FORM */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4" data-testid="form-signup">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Full Name
                </label>
                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <UserIcon size={16} />
                  </div>
                  <input
                    type="text"
                    required
                    data-testid="input-signup-name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Chen"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/90 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Email Address
                </label>
                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    required
                    data-testid="input-signup-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex.chen@northstar-assembly.com"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/90 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Password (min. 6 characters)
                </label>
                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    data-testid="input-signup-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/90 py-2.5 pl-10 pr-11 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Confirm Password
                </label>
                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    data-testid="input-signup-confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/90 py-2.5 pl-10 pr-11 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                data-testid="button-submit-signup"
                className="group flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-400 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60 shadow-md shadow-cyan-400/10"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                    <span>Registering Operator...</span>
                  </>
                ) : (
                  <>
                    <span>Create Operator Account</span>
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4" data-testid="form-forgot">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Registered Email Address
                </label>
                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    required
                    data-testid="input-forgot-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operator@northstar-assembly.com"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/90 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                data-testid="button-submit-forgot"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-400 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                    <span>Sending Reset Link...</span>
                  </>
                ) : (
                  <span>Send Recovery Email</span>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  data-testid="link-back-to-signin"
                  onClick={() => {
                    clearMessages();
                    setMode('signin');
                  }}
                  className="text-xs font-semibold text-slate-400 hover:text-cyan-400"
                >
                  ← Return to Sign In
                </button>
              </div>
            </form>
          )}

          {/* Footer Assistance */}
          <div className="border-t border-slate-900 pt-6 text-center text-xs text-slate-500">
            <span>Need immediate access to factory floor systems? Contact Northstar plant IT operations.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
