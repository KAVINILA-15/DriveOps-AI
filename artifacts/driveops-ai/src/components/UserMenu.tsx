import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, Link } from 'wouter';
import { ChevronDown, LogOut, Settings, User as UserIcon, Shield } from 'lucide-react';

export function UserMenu() {
  const { user, profile, signOut } = useAuth();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    setLocation('/login');
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Operator';
  const roleName = profile?.role || (user?.user_metadata?.role as string) || 'Operations Lead';

  // Calculate initials
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'OP';

  return (
    <div className="relative" ref={menuRef}>
      <button
        data-testid="button-profile"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg p-1.5 transition hover:bg-slate-100/80 focus:outline-none"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-900 text-xs font-bold text-cyan-300 shadow-sm ring-1 ring-slate-800">
          {initials}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-xs font-bold text-slate-950 truncate max-w-[140px]">
            {displayName}
          </span>
          <span className="block text-[11px] font-medium text-slate-600 truncate max-w-[140px]">
            {roleName}
          </span>
        </span>
        <ChevronDown size={14} className={`hidden text-slate-500 transition-transform sm:block ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          data-testid="dropdown-profile-menu"
          className="absolute right-0 mt-2 w-64 origin-top-right rounded-xl border border-slate-200 bg-white p-2 text-slate-800 shadow-xl ring-1 ring-black/5 z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          {/* User Info Header */}
          <div className="border-b border-slate-100 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-cyan-100 text-xs font-bold text-cyan-900">
                {initials}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-bold text-slate-900">{displayName}</div>
                <div className="truncate text-[11px] font-medium text-slate-500">{user?.email}</div>
              </div>
            </div>
            <div className="mt-2.5 flex items-center gap-1.5 rounded-md bg-cyan-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-800">
              <Shield size={12} />
              <span>{roleName}</span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              data-testid="menu-item-settings"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-cyan-800 transition"
            >
              <Settings size={15} className="text-slate-500" />
              <span>Workspace & Profile</span>
            </Link>
          </div>

          {/* Sign Out Action */}
          <div className="border-t border-slate-100 pt-1">
            <button
              onClick={handleSignOut}
              data-testid="button-logout"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
            >
              <LogOut size={15} className="text-rose-500" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
