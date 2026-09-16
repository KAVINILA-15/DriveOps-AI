import React, { useEffect, type ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Zap } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      setLocation('/login');
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative">
            <div className="absolute -inset-2 rounded-2xl bg-cyan-500/20 blur-lg animate-pulse" />
            <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-600 text-slate-950 shadow-xl">
              <Zap size={30} fill="currentColor" />
            </div>
          </div>
          <div>
            <div className="font-display text-xl font-extrabold tracking-tight text-white">
              DriveOps<span className="text-cyan-400">-AI</span>
            </div>
            <div className="mt-1 font-mono text-[10px] font-bold uppercase tracking-[.25em] text-slate-400">
              Verifying credentials...
            </div>
          </div>
          <div className="mt-2 h-1.5 w-36 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full w-full origin-left animate-pulse bg-cyan-400" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
