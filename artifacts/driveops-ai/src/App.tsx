import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Bell, Check, ChevronDown, ChevronRight, CircleAlert, CircleCheck, Clock3, CloudUpload, Download, Factory, FileText, Gauge, HardHat, HelpCircle, LayoutDashboard, ListFilter, Menu, MoreHorizontal, PackageCheck, PanelLeftClose, PanelLeftOpen, Pause, Play, RefreshCw, Search, Settings2, ShieldCheck, SlidersHorizontal, Sparkles, UploadCloud, Wrench, X, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link, Route, Switch, useLocation, useParams, Router as WouterRouter } from 'wouter';
import { alerts as seedAlerts, api, insights, machines, qualityTrend, trend, type Alert, type Machine, type Severity } from '@/lib/driveops-service';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ManufacturingProvider, useManufacturing } from '@/contexts/ManufacturingContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { UserMenu } from '@/components/UserMenu';
import { AuthPage } from '@/pages/AuthPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { UploadPage } from '@/pages/UploadPage';
import { supabaseService } from '@/services/supabaseService';

const queryClient = new QueryClient();

const nav = [
  { href: '/dashboard', label: 'Command center', icon: LayoutDashboard },
  { href: '/upload', label: 'Data intake', icon: UploadCloud },
  { href: '/production', label: 'Production', icon: Gauge },
  { href: '/machines', label: 'Machines', icon: Factory },
  { href: '/quality', label: 'Quality', icon: ShieldCheck },
  { href: '/alerts', label: 'Alerts', icon: Bell, count: 3 },
  { href: '/insights', label: 'Insights', icon: Sparkles },
  { href: '/reports', label: 'Reports', icon: FileText },
];

function StatusDot({ status }: { status: string }) {
  const color = status === 'Running' || status === 'Healthy' ? 'bg-emerald-500' : status === 'Attention' || status === 'Watch' ? 'bg-amber-500' : status === 'Maintenance' ? 'bg-sky-500' : 'bg-rose-500';
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} aria-label={status} />;
}

function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }) {
  const styles = { neutral: 'bg-slate-100 text-slate-600', success: 'bg-emerald-50 text-emerald-700', warning: 'bg-amber-50 text-amber-700', danger: 'bg-rose-50 text-rose-700', info: 'bg-cyan-50 text-cyan-700' };
  return <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold tracking-wide ${styles[tone]}`}>{children}</span>;
}

function Button({ children, variant = 'primary', onClick, disabled = false, className = '', type = 'button', testId }: { children: ReactNode; variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; onClick?: () => void; disabled?: boolean; className?: string; type?: 'button' | 'submit'; testId?: string }) {
  const styles = { primary: 'bg-primary text-primary-foreground hover:brightness-110 shadow-sm', secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50', ghost: 'text-slate-600 hover:bg-slate-100', danger: 'bg-rose-600 text-white hover:bg-rose-700' };
  return <button type={type} data-testid={testId} disabled={disabled} onClick={onClick} className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}>{children}</button>;
}

function SectionTitle({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
    <div>
      {eyebrow && <div className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[.16em] text-cyan-700">{eyebrow}</div>}
      <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
      {description && <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>}
    </div>
    {action}
  </div>;
}

function MetricCard({ label, value, delta, detail, icon: Icon, tone = 'navy', valueClassName = '' }: { label: string; value: string; delta?: string; detail?: string; icon: LucideIcon; tone?: 'navy' | 'cyan' | 'amber' | 'rose'; valueClassName?: string }) {
  const tones = {
    navy: 'border-slate-800 text-white shadow-sm',
    cyan: 'border-cyan-200 bg-cyan-50/70 text-cyan-950',
    amber: 'border-amber-200 bg-amber-50/70 text-amber-950',
    rose: 'border-rose-200 bg-rose-50/70 text-rose-950'
  };
  const isNavy = tone === 'navy';
  return <div className={`shell-card relative overflow-hidden p-4 ${tones[tone]}`} style={isNavy ? { backgroundColor: '#0f172a', color: '#ffffff' } : undefined}>
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className={`text-[11px] font-bold uppercase tracking-[.12em] ${isNavy ? 'text-slate-300' : 'text-slate-600'}`}>{label}</div>
        <div className={`mt-2 font-display text-3xl font-extrabold tracking-tight ${isNavy ? 'text-white' : 'text-slate-900'} ${valueClassName}`}>{value}</div>
      </div>
      <Icon size={20} strokeWidth={2} className={isNavy ? 'text-cyan-300' : 'text-cyan-700'} />
    </div>
    <div className="mt-3 flex items-center gap-2 text-xs">
      {delta && <span className={`font-semibold ${isNavy ? 'text-emerald-300' : 'text-emerald-700'}`}>{delta}</span>}
      <span className={isNavy ? 'text-slate-300 font-medium' : 'text-slate-600 font-medium'}>{detail}</span>
    </div>
  </div>;
}

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { metrics } = useManufacturing();
  const page = nav.find(item => location.startsWith(item.href));
  const navItems = nav.map(item => item.href === '/alerts' ? { ...item, count: metrics.openAlertsCount } : item);
  return <div className="app-shell noise flex">
    <aside className={`fixed inset-y-0 left-0 z-30 flex w-[248px] shrink-0 flex-col border-r border-slate-200 bg-white text-slate-800 shadow-[4px_0_20px_rgba(15,23,42,.06)] backdrop-blur-md transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${collapsed ? 'lg:w-[76px]' : ''} ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex h-[72px] items-center gap-3 border-b border-slate-200 px-5">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-cyan-400 text-slate-950 shadow-sm"><Zap size={21} fill="currentColor" /></div>
        {!collapsed && <div><div className="font-display text-[17px] font-extrabold tracking-tight text-slate-950">DriveOps<span className="text-cyan-600 font-extrabold">-AI</span></div><div className="font-mono text-[9px] font-bold uppercase tracking-[.2em] text-slate-600">factory intelligence</div></div>}
      </div>
      <div className="border-b border-slate-200 px-3 py-4">
        <div className={`flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-2xs ${collapsed ? 'justify-center' : ''}`}><div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-cyan-100 text-cyan-800"><Factory size={17} /></div>{!collapsed && <div className="min-w-0"><div className="truncate text-xs font-bold text-slate-950">Northstar Assembly</div><div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-600"><span className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />Live operations</div></div>}</div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-5">{!collapsed && <div className="mb-2 px-3 font-mono text-[10px] font-bold uppercase tracking-[.18em] text-slate-700">Operations</div>}{navItems.map(item => { const active = location.startsWith(item.href); return <Link href={item.href} key={item.href} onClick={() => setMobileOpen(false)} data-testid={`link-nav-${item.label.toLowerCase().replaceAll(' ', '-')}`} className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${active ? 'bg-cyan-400 font-extrabold text-slate-950 shadow-[0_4px_12px_rgba(34,211,238,.25)]' : 'text-slate-700 hover:bg-slate-100 hover:text-cyan-800'} ${collapsed ? 'justify-center' : ''}`}><item.icon size={18} strokeWidth={active ? 2.5 : 2} className={active ? 'text-slate-950' : 'text-slate-600 group-hover:text-cyan-800'} />{!collapsed && <><span className="flex-1 text-slate-900">{item.label}</span>{item.count && <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${active ? 'bg-slate-950 text-cyan-300' : 'bg-rose-600 text-white'}`}>{item.count}</span>}</>}</Link>; })}</nav>
      <div className="border-t border-slate-200 p-3">{!collapsed && <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-2xs"><div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-700"><span>Shift progress</span><span className="text-cyan-800 font-extrabold">68%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"><div className="progress-stripe h-full w-[68%] rounded-full bg-cyan-500" /></div><div className="mt-2 text-[11px] font-medium text-slate-600">B shift · 14:00–22:00</div></div>}<Link href="/settings" data-testid="button-settings" className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-cyan-800 ${collapsed ? 'justify-center' : ''}`}><Settings2 size={17} className="text-slate-600" />{!collapsed && 'Workspace settings'}</Link></div>
      <button data-testid="button-collapse-sidebar" onClick={() => setCollapsed(!collapsed)} className="absolute -right-3 top-[76px] hidden h-6 w-6 place-items-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm hover:border-cyan-500 hover:text-cyan-700 lg:grid">{collapsed ? <PanelLeftOpen size={13} /> : <PanelLeftClose size={13} />}</button>
    </aside>
    {mobileOpen && <button aria-label="Close navigation" data-testid="button-close-mobile-nav" className="fixed inset-0 z-20 bg-slate-950/30 lg:hidden" onClick={() => setMobileOpen(false)} />}
    <main className="min-w-0 flex-1">
      <header className="sticky top-0 z-10 flex h-[72px] items-center gap-3 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
        <button data-testid="button-open-mobile-nav" onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden"><Menu size={20} /></button>
        <div className="hidden items-center gap-2 text-sm font-semibold text-slate-600 sm:flex"><span className="text-slate-950 font-bold">Northstar Assembly</span><ChevronRight size={14} className="text-slate-400" /><span className="text-slate-800">{page?.label || 'Overview'}</span></div>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <label className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-2xs md:flex"><Search size={15} className="text-slate-400" /><input data-testid="input-global-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search machines, alerts..." className="w-44 bg-transparent outline-none placeholder:text-slate-400 text-slate-800 font-medium" /></label>
          <button data-testid="button-refresh" className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-2xs transition hover:text-cyan-800 hover:bg-slate-50"><RefreshCw size={16} /></button>
          <Link href="/alerts" data-testid="link-notifications" className="relative rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-2xs transition hover:text-cyan-800 hover:bg-slate-50"><Bell size={16} /><span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-rose-500" /></Link>
          <div className="hidden h-8 w-px bg-slate-200 sm:block" />
          <UserMenu />
        </div>
      </header>
      <div className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8"><DemoNotice />{children}</div>
    </main>
  </div>;
}

function DemoNotice() {
  const { source, lastSyncTime, latestAnalysis, resetToDefault } = useManufacturing();
  if (source === 'sns-live') {
    return (
      <div data-testid="status-demo-data" className="mb-5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-lg border border-emerald-300 bg-emerald-50/90 px-4 py-2.5 text-xs text-emerald-950 shadow-2xs">
        <div className="flex items-center gap-2 font-bold">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono uppercase tracking-wider text-emerald-900">LIVE SNS BACKEND SYNC</span>
          <span className="h-3 w-px bg-emerald-300" />
          <span className="font-medium text-emerald-800">
            {latestAnalysis.length} stations evaluated via SNS Agent Workbench ({lastSyncTime || 'Active'}). Fleet, alerts, and line metrics updated.
          </span>
        </div>
        <button
          type="button"
          onClick={resetToDefault}
          className="font-bold text-xs text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
        >
          Reset to baseline
        </button>
      </div>
    );
  }
  return (
    <div data-testid="status-demo-data" className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-cyan-200 bg-cyan-50/70 px-3.5 py-2.5 text-xs text-cyan-900">
      <span className="flex items-center gap-2 font-bold"><Sparkles size={14} />BASELINE FACILITY FEED</span>
      <span className="h-3 w-px bg-cyan-200" />
      <span>Standard facility signals. Upload or load telemetry in Data Intake to evaluate via SNS Agent Workbench.</span>
    </div>
  );
}

function TrendBars({ values, color = 'bg-cyan-500' }: { values: number[]; color?: string }) { const max = Math.max(...values); return <div className="flex h-28 items-end gap-1.5">{values.map((v, i) => <div key={i} className="group flex h-full flex-1 items-end"><div title={`${v}`} className={`w-full rounded-t-sm ${color} opacity-80 transition-all duration-300 group-hover:opacity-100`} style={{ height: `${Math.max(8, (v / max) * 100)}%` }} /></div>)}</div>; }
function Dashboard() {
  const { user, profile } = useAuth();
  const { machines, alerts, insights, lineReadiness, metrics, lastSyncTime, source } = useManufacturing();
  const [showAll, setShowAll] = useState(false);
  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Alex Chen';
  const firstName = displayName.split(' ')[0];
  return <><div className="stagger-in mb-7 flex flex-wrap items-end justify-between gap-4"><div><div className="mb-1 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[.18em] text-cyan-700"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />Shift live · {source === 'sns-live' ? 'SNS Synced' : '14:36 local'}</div><h1 data-testid="text-dashboard-title" className="font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Good afternoon, {firstName}.</h1><p className="mt-1 text-sm font-medium text-slate-600">{source === 'sns-live' ? `Live intelligence active across ${machines.length} monitored stations.` : 'Here is what needs your attention across Northstar Assembly.'}</p></div><Link href="/reports" data-testid="link-view-report" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"><FileText size={16} />Shift report <ChevronRight size={14} /></Link></div>
     <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Units this shift" value={metrics.unitsProduced.toLocaleString()} delta="+7.4%" detail="vs. shift target" icon={PackageCheck} tone="navy" /><MetricCard label="Production health" value={`${metrics.productionHealth.toFixed(1)}`} delta={metrics.productionHealth > 90 ? '+2.1 pts' : '-4.8 pts'} detail="line average" icon={Gauge} tone="cyan" /><MetricCard label="Quality rate" value={`${metrics.qualityRate.toFixed(1)}%`} delta="+0.8 pts" detail="last 24 hours" icon={ShieldCheck} tone="amber" /><MetricCard label="Needs attention" value={String(metrics.openAlertsCount).padStart(2, '0')} delta={`${metrics.criticalAlertsCount} critical`} detail="open alerts" icon={CircleAlert} tone="rose" /></div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_1fr]"><div className="shell-card stagger-in stagger-2 p-5"><div className="mb-5 flex items-start justify-between"><div><h2 className="font-display font-bold text-slate-900">Production pulse</h2><p className="mt-1 text-xs font-medium text-slate-600">Throughput against the shift plan · last 14 intervals</p></div><Badge tone={metrics.criticalAlertsCount > 0 ? 'warning' : 'success'}><span className={`h-1.5 w-1.5 rounded-full ${metrics.criticalAlertsCount > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`} />{metrics.criticalAlertsCount > 0 ? 'Active attention' : 'On plan'}</Badge></div><TrendBars values={trend} /><div className="mt-3 flex justify-between text-[11px] font-mono font-bold text-slate-600"><span>08:00</span><span>12:00</span><span>16:00</span><span>Now</span></div><div className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4"><div><div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Current pace</div><div className="mt-1 text-lg font-bold text-slate-800">{metrics.unitsPace}</div></div><div><div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Shift target</div><div className="mt-1 text-lg font-bold text-slate-800">1,840 units</div></div><div><div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Gap</div><div className="mt-1 text-lg font-bold text-emerald-700">+38 units</div></div></div></div>
      <div className="shell-card stagger-in stagger-3 overflow-hidden"><div className="border-b border-slate-100 p-5"><div className="flex items-center justify-between"><div><h2 className="font-display font-bold text-slate-900">Attention queue</h2><p className="mt-1 text-xs font-medium text-slate-600">What needs a decision now</p></div><Link href="/alerts" data-testid="link-all-alerts" className="text-xs font-bold text-cyan-700 hover:text-cyan-900">View all ({alerts.filter(a => !a.acknowledged).length})</Link></div></div><div>{alerts.slice(0, 3).map((a, i) => <Link href={`/machines/${a.machine_id}`} data-testid={`link-attention-${a.id}`} key={a.id} className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 transition hover:bg-slate-50"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${a.severity === 'Critical' ? 'bg-rose-500' : a.severity === 'High' ? 'bg-amber-500' : 'bg-cyan-500'}`} /><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-bold text-slate-800">{a.title}</span><span className="shrink-0 text-[11px] font-semibold text-slate-500">{a.timestamp}</span></div><p className="mt-1 truncate text-xs font-medium text-slate-600">{a.machine} · {a.recommended_action}</p></div><ChevronRight size={15} className="mt-1 shrink-0 text-slate-400" /></Link>)}</div></div></div>
    <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_.85fr]"><div className="shell-card stagger-in stagger-3 p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-display font-bold text-slate-900">Line readiness</h2><p className="mt-1 text-xs font-medium text-slate-600">A quick view of each production area</p></div><Link href="/production" data-testid="link-line-performance" className="text-xs font-bold text-cyan-700 hover:text-cyan-900">Detailed view</Link></div><div className="space-y-3">{lineReadiness.map((line) => <div key={line.name} className="flex items-center gap-3"><div className="w-28 shrink-0 text-xs font-bold text-slate-800 sm:w-36">{line.name}</div><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${line.status === 'Healthy' ? 'bg-emerald-500' : line.status === 'Watch' ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: line.score }} /></div><div className="w-12 text-right font-mono text-[11px] font-extrabold text-slate-900">{line.score}</div><div className="hidden w-16 text-right text-[11px] font-bold text-slate-600 sm:block">{line.machinesReady}</div><StatusDot status={line.status} /></div>)}</div></div><div className="shell-card stagger-in stagger-4 p-5"><div className="flex items-center justify-between"><div><h2 className="font-display font-bold text-slate-900">Latest understanding</h2><p className="mt-1 text-xs font-medium text-slate-600">Signals translated into decisions</p></div><Sparkles size={18} className="text-cyan-600" /></div>{insights.length > 0 && <div className="mt-4 rounded-lg border border-cyan-100 bg-cyan-50/60 p-4"><div className="flex items-center gap-2"><Badge tone={insights[0].type === 'Quality' ? 'warning' : 'danger'}>Most important</Badge><span className="text-[11px] font-semibold text-slate-500">{source === 'sns-live' ? 'SNS Webhook' : '2 min ago'}</span></div><h3 className="mt-3 text-sm font-bold leading-snug text-slate-800">{insights[0].most_important_issue}</h3><p className="mt-2 text-xs leading-relaxed text-slate-700">{insights[0].explanation}</p><Link href="/insights" data-testid="link-read-insight" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-cyan-700 hover:text-cyan-900">Read recommended action <ChevronRight size={13} /></Link></div>}</div></div>
    <div className="mt-5 flex items-center justify-between rounded-lg border border-slate-200 bg-white/80 px-4 py-3 text-xs font-medium text-slate-700"><span className="flex items-center gap-2"><Clock3 size={14} className="text-cyan-700" />{lastSyncTime ? `Data synced with SNS Backend (${lastSyncTime})` : 'Data refreshed 2 minutes ago · all times local'}</span><button data-testid="button-show-data-context" onClick={() => setShowAll(!showAll)} className="font-bold text-cyan-800 hover:text-cyan-950">{showAll ? 'Hide data context' : 'How this is calculated'}</button>{showAll && <span className="hidden md:inline font-normal text-slate-600">Production signals, quality checks, and maintenance events are combined into one operating view.</span>}</div>
  </>;
}

function ProductionPage() {
  const { insights, lineReadiness, metrics } = useManufacturing();
  return <><SectionTitle eyebrow="Production" title="Production line performance" description="See pace, gaps, and recovery opportunities across every active line." action={<Button variant="secondary" testId="button-production-filter"><SlidersHorizontal size={15} />Filter view</Button>} /><div className="grid gap-4 sm:grid-cols-3"><MetricCard label="Units this shift" value={metrics.unitsProduced.toLocaleString()} delta="+38" detail="ahead of target" icon={PackageCheck} tone="navy" /><MetricCard label="Average line pace" value={metrics.unitsPace} delta="+4.8%" detail="vs. prior shift" icon={Gauge} tone="cyan" /><MetricCard label="Production gap" value="18 min" delta={`${metrics.criticalAlertsCount} lines`} detail="recoverable" icon={Clock3} tone="amber" /></div><div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_.8fr]"><div className="shell-card p-5"><div className="mb-5 flex items-start justify-between"><div><h2 className="font-display font-bold text-slate-900">Throughput by line</h2><p className="mt-1 text-xs font-medium text-slate-600">Actual output vs. scheduled pace</p></div><select data-testid="select-production-window" className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none"><option>Current shift</option><option>Last 24 hours</option><option>Last 7 days</option></select></div><div className="space-y-6">{lineReadiness.map((line) => { const pct = parseInt(line.score, 10) || 90; return <div key={line.name}><div className="mb-2 flex items-center justify-between"><span className="text-sm font-bold text-slate-900">{line.name}</span><span className="font-mono text-xs font-bold text-slate-700">{line.machinesReady} stations</span></div><div className="flex items-center gap-3"><div className="h-3 flex-1 overflow-hidden rounded-sm bg-slate-100"><div className={`h-full rounded-sm ${Number(pct) >= 95 ? 'bg-emerald-500' : Number(pct) >= 88 ? 'bg-cyan-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(Number(pct), 100)}%` }} /></div><span className="w-10 text-right font-mono text-xs font-extrabold text-slate-900">{line.score}</span></div><div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-slate-600"><StatusDot status={line.status === 'At risk' ? 'Down' : line.status === 'Watch' ? 'Attention' : 'Running'} />{line.status === 'At risk' ? 'Stations under maintenance / alert' : line.status === 'Watch' ? 'Active station observation' : 'Healthy operating conditions'}</div></div>; })}</div></div><div className="shell-card p-5"><h2 className="font-display font-bold text-slate-900">Recovery playbook</h2><p className="mt-1 text-xs font-medium text-slate-600">The fastest opportunities to get back on plan</p><div className="mt-4 space-y-3">{insights.map(item => <div key={item.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3"><div className="flex items-center justify-between"><Badge tone={item.type === 'Production' ? 'info' : item.type === 'Quality' ? 'warning' : 'danger'}>{item.type}</Badge><span className="font-mono text-[11px] font-bold text-slate-600">{item.confidence}% confidence</span></div><div className="mt-2 text-xs font-bold leading-relaxed text-slate-800">{item.most_important_issue}</div><div className="mt-2 text-[11px] font-medium leading-relaxed text-slate-600">{item.recommended_action}</div></div>)}</div></div></div></>;
}

function MachineTable({ rows }: { rows: Machine[] }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[750px] text-left"><thead><tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-600 font-bold">{['Machine', 'Line', 'Status', 'Utilization', 'Quality', 'Cycle time', 'Next service', ''].map(h => <th key={h} className="px-4 pb-3 font-bold first:pl-0 last:pr-0">{h}</th>)}</tr></thead><tbody>{rows.map(m => <tr key={m.machine_id} className="group border-b border-slate-50 text-xs transition hover:bg-slate-50"><td className="px-4 py-3.5 pl-0"><Link href={`/machines/${m.machine_id}`} data-testid={`link-machine-${m.machine_id}`} className="flex items-center gap-3"><div className="grid h-8 w-8 place-items-center rounded-md bg-slate-100 text-slate-600"><Factory size={15} /></div><div><div className="font-bold text-slate-900 group-hover:text-cyan-700">{m.machine_id} · {m.name}</div><div className="mt-0.5 text-[11px] font-medium text-slate-500">{m.overall_status} condition</div></div></Link></td><td className="px-4 py-3.5 font-medium text-slate-700">{m.production_line}</td><td className="px-4 py-3.5"><Badge tone={m.machine_status === 'Running' ? 'success' : m.machine_status === 'Attention' ? 'warning' : m.machine_status === 'Down' ? 'danger' : 'info'}><StatusDot status={m.machine_status} />{m.machine_status}</Badge></td><td className="px-4 py-3.5"><div className="flex items-center gap-2"><div className="h-1.5 w-16 rounded-full bg-slate-100"><div className="h-full rounded-full bg-cyan-500" style={{ width: `${m.utilization}%` }} /></div><span className="font-mono text-[11px] font-bold text-slate-800">{m.utilization}%</span></div></td><td className="px-4 py-3.5 font-mono font-bold text-slate-800">{m.quality_rate}%</td><td className="px-4 py-3.5 font-mono text-slate-700">{m.cycle_time ? `${m.cycle_time}s` : '—'} <span className="text-[10px] font-medium text-slate-500">/ {m.target_cycle_time}s</span></td><td className="px-4 py-3.5 font-medium text-slate-700">{m.next_service}</td><td className="px-4 py-3.5 pr-0"><Link href={`/machines/${m.machine_id}`} data-testid={`link-view-machine-${m.machine_id}`} className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-cyan-700"><ChevronRight size={16} /></Link></td></tr>)}</tbody></table></div>;
}

function MachinesPage() {
  const { machines } = useManufacturing();
  const [query, setQuery] = useState(''); const [status, setStatus] = useState('All');
  const runningCount = machines.filter(m => m.machine_status === 'Running').length;
  const attentionCount = machines.filter(m => m.machine_status === 'Attention').length;
  const downCount = machines.filter(m => m.machine_status === 'Down' || m.machine_status === 'Maintenance').length;
  const filtered = useMemo(() => machines.filter(m => (status === 'All' || m.machine_status === status || (status === 'Down' && (m.machine_status === 'Down' || m.machine_status === 'Maintenance'))) && `${m.machine_id} ${m.name} ${m.production_line}`.toLowerCase().includes(query.toLowerCase())), [machines, query, status]);
  return <><SectionTitle eyebrow="Fleet view" title="Machine fleet health" description="Every asset, its current condition, and the next useful action." action={<Button variant="secondary" testId="button-machine-filters"><ListFilter size={15} />Saved view <ChevronDown size={13} /></Button>} /><div className="mb-5 grid gap-3 sm:grid-cols-4">{[['All machines', String(machines.length).padStart(2, '0'), 'All'], ['Running', String(runningCount).padStart(2, '0'), 'Running'], ['Attention', String(attentionCount).padStart(2, '0'), 'Attention'], ['Down / service', String(downCount).padStart(2, '0'), 'Down']].map(([label, count, value]) => <button key={label} data-testid={`button-filter-${value.toLowerCase()}`} onClick={() => setStatus(value === 'Down' ? 'Down' : value)} className={`shell-card flex items-center justify-between p-3 text-left transition hover:-translate-y-0.5 ${status === value ? 'border-cyan-400 ring-1 ring-cyan-400' : ''}`}><span className="text-xs font-bold text-slate-700">{label}</span><span className="font-display text-xl font-bold text-slate-950">{count}</span></button>)}</div><div className="shell-card p-5"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><label className="flex min-w-[260px] flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"><Search size={15} className="text-slate-400" /><input data-testid="input-machine-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by machine, line, or ID..." className="w-full bg-transparent outline-none placeholder:text-slate-400 text-slate-800 font-medium" /></label><div className="text-xs font-medium text-slate-600"><span className="font-bold text-slate-900">{filtered.length}</span> of {machines.length} machines</div></div><MachineTable rows={filtered} />{filtered.length === 0 && <div data-testid="status-machines-empty" className="py-12 text-center"><Search className="mx-auto text-slate-400" /><p className="mt-3 text-sm font-bold text-slate-800">No machines match that search</p><p className="mt-1 text-xs font-medium text-slate-600">Try another name, line, or status.</p></div>}</div></>;
}

function MachineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { machines, alerts } = useManufacturing();
  const machine = machines.find(m => m.machine_id === id) || machines[0];
  const [ack, setAck] = useState(false);
  const related = alerts.filter(a => a.machine_id === machine.machine_id);
  return <><div className="mb-5 flex items-center gap-2 text-xs font-medium text-slate-600"><Link href="/machines" data-testid="link-back-machines" className="font-bold text-cyan-800 hover:text-cyan-950">Machines</Link><ChevronRight size={13} className="text-slate-400" /><span>{machine.machine_id}</span></div><SectionTitle eyebrow={`${machine.production_line} · ${machine.machine_id}`} title={machine.name} description={`Last signal received 2 minutes ago · runtime ${machine.runtime}`} action={<div className="flex items-center gap-2"><Badge tone={machine.machine_status === 'Running' ? 'success' : machine.machine_status === 'Down' ? 'danger' : 'warning'}><StatusDot status={machine.machine_status} />{machine.machine_status}</Badge><Button variant="secondary" testId="button-machine-actions"><MoreHorizontal size={16} />Actions</Button></div>} /><div className="grid gap-4 sm:grid-cols-4"><MetricCard label="Utilization" value={`${machine.utilization}%`} delta={machine.utilization > 80 ? '+4.2%' : '-8.6%'} detail="vs. 7-day average" icon={Gauge} tone="navy" /><MetricCard label="Quality rate" value={`${machine.quality_rate}%`} delta="+0.6 pts" detail="last 24 hours" icon={ShieldCheck} tone="cyan" /><MetricCard label="Cycle time" value={machine.cycle_time ? `${machine.cycle_time}s` : 'Stopped'} delta={machine.cycle_time > machine.target_cycle_time ? `+${(machine.cycle_time - machine.target_cycle_time).toFixed(1)}s` : 'On target'} detail={`target ${machine.target_cycle_time}s`} icon={Clock3} tone="amber" /><MetricCard label="Condition" value={machine.overall_status} detail={`Next service ${machine.next_service}`} icon={Wrench} tone="rose" /></div><div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_.85fr]"><div className="space-y-5"><div className="shell-card p-5"><div className="mb-5 flex items-start justify-between"><div><h2 className="font-display font-bold text-slate-900">Signal trends</h2><p className="mt-1 text-xs font-medium text-slate-600">Machine behavior compared with the expected range</p></div><Badge tone="info">Last 24 hours</Badge></div><div className="rounded-lg bg-slate-950 p-4"><div className="mb-3 flex items-center justify-between text-[11px] font-semibold text-slate-400"><span>Utilization signal</span><span className="font-mono text-cyan-300">LIVE</span></div><TrendBars values={[62, 75, 73, 70, 80, 84, 82, 78, 81, 89, 86, machine.utilization]} color="bg-cyan-400" /><div className="mt-3 flex justify-between font-mono text-[10px] font-bold text-slate-400"><span>-12h</span><span>-8h</span><span>-4h</span><span>Now</span></div></div><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-lg border border-slate-100 p-3"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Last service</div><div className="mt-1 text-sm font-bold text-slate-800">{machine.last_service}</div></div><div className="rounded-lg border border-slate-100 p-3"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Time in current state</div><div className="mt-1 text-sm font-bold text-slate-800">{machine.runtime}</div></div></div></div><div className="shell-card p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-display font-bold text-slate-900">Recent signals</h2><p className="mt-1 text-xs font-medium text-slate-600">The raw facts behind this status</p></div><button data-testid="button-refresh-signals" className="text-slate-500 hover:text-cyan-700"><RefreshCw size={15} /></button></div><div className="space-y-3">{['Machine status reported', 'Cycle time sampled', 'Quality check completed', 'Maintenance history synced'].map((x, i) => <div key={x} className="flex items-center gap-3 text-xs"><span className={`grid h-6 w-6 place-items-center rounded-full ${i === 0 && machine.machine_status !== 'Running' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}><Check size={13} /></span><span className="flex-1 font-semibold text-slate-800">{x}</span><span className="font-mono text-[11px] font-semibold text-slate-500">{i * 8 + 2} min ago</span></div>)}</div></div></div><div className="space-y-5"><div className="shell-card overflow-hidden border-l-4 border-l-amber-400"><div className="p-5"><div className="flex items-center justify-between"><h2 className="font-display font-bold text-slate-900">Detected issues</h2><Badge tone={machine.detected_issues?.length ? 'warning' : 'success'}>{machine.detected_issues?.length || 0} open</Badge></div>{machine.detected_issues?.length ? <div className="mt-4 space-y-2">{machine.detected_issues.map(issue => <div key={issue} className="flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900"><CircleAlert size={14} className="text-amber-700" />{issue}</div>)}</div> : <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-700"><CircleCheck size={15} />No active issues detected.</div>}</div></div><div className="shell-card bg-slate-900 p-5 text-white" style={{ backgroundColor: '#0f172a', color: '#ffffff' }}><div className="flex items-center gap-2 text-cyan-300"><Sparkles size={16} /><span className="text-[10px] font-bold uppercase tracking-[.16em]">Recommended action</span></div><h2 className="mt-4 font-display text-lg font-bold leading-snug">{related[0]?.recommended_action || 'Keep the machine in its current run plan and review at the next handoff.'}</h2><p className="mt-3 text-xs leading-relaxed text-slate-300">{related[0]?.explanation || 'Signals remain inside the expected operating range. Continue monitoring the next production interval.'}</p><div className="mt-5 flex gap-2"><Button onClick={() => setAck(true)} disabled={ack} testId="button-acknowledge-machine">{ack ? <><Check size={14} />Action noted</> : <><Check size={14} />Mark action noted</>}</Button><Link href="/alerts" data-testid="link-machine-alerts" className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800">View alerts</Link></div></div></div></div></>;
}

function QualityPage() {
  const { insights, metrics } = useManufacturing();
  const defects = [['Seal alignment', 31, 'Final Assembly', 'High'], ['Surface finish', 24, 'Paint Line C', 'Medium'], ['Torque variance', 18, 'Final Assembly', 'High'], ['Weld penetration', 12, 'Body Line A', 'Low'], ['Marking readability', 8, 'Final Assembly', 'Low']];
  return <><SectionTitle eyebrow="Quality" title="Quality monitoring" description="Find the defect patterns that can become tomorrow’s production problem." action={<Button variant="secondary" testId="button-quality-export"><Download size={15} />Export quality view</Button>} /><div className="grid gap-4 sm:grid-cols-3"><MetricCard label="Quality rate" value={`${metrics.qualityRate.toFixed(1)}%`} delta="+0.8 pts" detail="vs. last shift" icon={ShieldCheck} tone="navy" /><MetricCard label="Defects found" value="93" delta="-14" detail="vs. 7-day average" icon={CircleAlert} tone="amber" /><MetricCard label="First-pass yield" value="96.8%" delta="+1.4 pts" detail="current shift" icon={PackageCheck} tone="cyan" /></div><div className="mt-5 grid gap-5 xl:grid-cols-[1fr_.8fr]"><div className="shell-card p-5"><div className="mb-5 flex items-start justify-between"><div><h2 className="font-display font-bold text-slate-900">Quality rate trend</h2><p className="mt-1 text-xs font-medium text-slate-600">Hourly rate · target is 97.0%</p></div><Badge tone="success">Above target</Badge></div><TrendBars values={qualityTrend} color="bg-emerald-500" /><div className="mt-3 flex justify-between font-mono text-[11px] font-bold text-slate-600"><span>06:00</span><span>10:00</span><span>14:00</span><span>Now</span></div><div className="mt-5 border-t border-slate-100 pt-4 text-xs font-medium text-slate-700">The last two intervals improved after the sealant application check on Final Assembly.</div></div><div className="shell-card p-5"><h2 className="font-display font-bold text-slate-900">Defect mix</h2><p className="mt-1 text-xs font-medium text-slate-600">Share of 93 defects this shift</p><div className="mt-5 space-y-4">{defects.map(([label, count, line, severity]) => <div key={label}><div className="mb-1.5 flex items-center justify-between text-xs"><span className="font-bold text-slate-800">{label}</span><span className="font-mono font-bold text-slate-700">{count}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${severity === 'High' ? 'bg-amber-500' : severity === 'Medium' ? 'bg-cyan-500' : 'bg-slate-400'}`} style={{ width: `${Number(count) / 31 * 100}%` }} /></div><div className="mt-1 text-[11px] font-semibold text-slate-600">{line}</div></div>)}</div></div></div><div className="mt-5 shell-card p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-display font-bold text-slate-900">Where quality needs attention</h2><p className="mt-1 text-xs font-medium text-slate-600">Prioritized by repeat frequency and production impact</p></div><Link href="/insights" data-testid="link-quality-insights" className="text-xs font-bold text-cyan-800 hover:text-cyan-950">Open insights <ChevronRight size={13} className="inline" /></Link></div><div className="grid gap-3 md:grid-cols-3">{insights.filter(i => i.type === 'Quality' || i.type === 'Maintenance').map(i => <div key={i.id} className="rounded-lg border border-slate-100 p-4"><div className="flex items-center justify-between"><Badge tone={i.type === 'Quality' ? 'warning' : 'danger'}>{i.type}</Badge><span className="font-mono text-[11px] font-bold text-slate-600">{i.confidence}% match</span></div><div className="mt-3 text-sm font-bold text-slate-800">{i.most_important_issue}</div><div className="mt-2 text-xs font-medium leading-relaxed text-slate-600">{i.recommended_action}</div></div>)}</div></div></>;
}

function AlertsPage() {
  const { alerts, acknowledgeAlert } = useManufacturing();
  const [filter, setFilter] = useState<'All' | Severity>('All');
  const [query, setQuery] = useState('');

  const filtered = alerts.filter(a => (filter === 'All' || a.severity === filter) && `${a.title} ${a.machine} ${a.production_line}`.toLowerCase().includes(query.toLowerCase()));
  const handleAcknowledge = (id: string) => {
    acknowledgeAlert(id);
    supabaseService.acknowledgeAlert(id).catch(() => {});
  };
  return <><SectionTitle eyebrow="Alerts" title="Alert center" description="A focused queue of signals that need an operator, supervisor, or maintenance decision." action={<Badge tone="danger"><span className="h-1.5 w-1.5 rounded-full bg-rose-500" />{alerts.filter(a => !a.acknowledged).length} open</Badge>} /><div className="shell-card mb-5 p-3"><div className="flex flex-wrap gap-2"><label className="flex min-w-[230px] flex-1 items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500"><Search size={15} className="text-slate-400" /><input data-testid="input-alert-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search alerts..." className="w-full bg-transparent outline-none text-slate-800 font-medium placeholder:text-slate-400" /></label>{(['All', 'Critical', 'High', 'Medium', 'Low'] as const).map(level => <button key={level} data-testid={`button-alert-filter-${level.toLowerCase()}`} onClick={() => setFilter(level)} className={`rounded-lg px-3 py-2 text-xs font-bold transition ${filter === level ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'}`}>{level}</button>)}</div></div><div className="space-y-3">{filtered.map(a => <div data-testid={`card-alert-${a.id}`} key={a.id} className={`shell-card flex flex-col gap-4 border-l-4 p-4 sm:flex-row sm:items-start ${a.severity === 'Critical' ? 'border-l-rose-500' : a.severity === 'High' ? 'border-l-amber-500' : 'border-l-cyan-500'} ${a.acknowledged ? 'opacity-60' : ''}`}><div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700"><CircleAlert size={18} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Badge tone={a.severity === 'Critical' ? 'danger' : a.severity === 'High' ? 'warning' : 'info'}>{a.severity}</Badge><span className="font-mono text-[11px] font-bold text-slate-600">{a.id} · {a.timestamp}</span>{a.acknowledged && <Badge tone="success"><Check size={11} />Acknowledged</Badge>}</div><h2 className="mt-2 text-sm font-bold text-slate-900">{a.title}</h2><div className="mt-1 text-xs font-medium text-slate-600">{a.machine} · {a.production_line}</div><p className="mt-3 max-w-3xl text-xs font-normal leading-relaxed text-slate-700">{a.explanation}</p><div className="mt-3 rounded-md bg-slate-100/90 px-3 py-2 text-xs"><span className="font-bold text-slate-800">Recommended action: </span><span className="text-slate-700 font-medium">{a.recommended_action}</span></div></div><div className="flex shrink-0 gap-2 sm:flex-col">{!a.acknowledged && <Button variant="secondary" onClick={() => handleAcknowledge(a.id)} testId={`button-acknowledge-${a.id}`}><Check size={14} />Acknowledge</Button>}<Link href={`/machines/${a.machine_id}`} data-testid={`link-alert-machine-${a.id}`} className="inline-flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-bold text-cyan-800 hover:bg-cyan-50">Open machine <ChevronRight size={13} /></Link></div></div>)}{filtered.length === 0 && <div data-testid="status-alerts-empty" className="shell-card py-16 text-center"><CircleCheck className="mx-auto text-emerald-600" size={28} /><p className="mt-3 text-sm font-bold text-slate-800">No alerts match this view</p><p className="mt-1 text-xs font-medium text-slate-600">Try a different severity or search term.</p></div>}</div></>;
}

function InsightsPage() {
  const { insights } = useManufacturing();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const activeItem = insights.find(i => i.id === selectedId) || insights[0];
  const [done, setDone] = useState<string[]>([]);

  if (!activeItem) {
    return <div className="shell-card p-12 text-center text-slate-500">No active insights available.</div>;
  }

  return <><SectionTitle eyebrow="Understanding" title="Insights & recommendations" description="The short version of what happened, why it matters, and what to do next." action={<Badge tone="info"><Sparkles size={12} />{insights.length} fresh insights</Badge>} /><div className="grid gap-5 xl:grid-cols-[.75fr_1.25fr]"><div className="space-y-2">{insights.map(item => <button key={item.id} data-testid={`button-select-insight-${item.id}`} onClick={() => setSelectedId(item.id)} className={`w-full rounded-lg border p-4 text-left transition ${activeItem.id === item.id ? 'border-cyan-400 bg-cyan-50/70 shadow-sm' : 'border-slate-200 bg-white hover:border-cyan-200'}`}><div className="flex items-center justify-between"><Badge tone={item.type === 'Quality' ? 'warning' : item.type === 'Maintenance' ? 'danger' : 'info'}>{item.type}</Badge><span className="font-mono text-[11px] font-bold text-slate-600">{item.confidence}%</span></div><div className="mt-3 text-sm font-bold leading-snug text-slate-800">{item.most_important_issue}</div><div className="mt-2 text-[11px] font-medium text-slate-600">{item.impact}</div></button>)}<div className="rounded-lg border border-dashed border-slate-300 p-4 text-xs font-medium text-slate-600"><div className="flex items-center gap-2 font-bold text-slate-800"><HelpCircle size={15} />How to read this page</div><p className="mt-2 leading-relaxed">Insights connect the signal to its production impact. Treat the recommended action as a starting point for your team’s decision.</p></div></div><div className="shell-card overflow-hidden"><div className="bg-slate-900 p-6 text-white" style={{ backgroundColor: '#0f172a', color: '#ffffff' }}><div className="flex flex-wrap items-center justify-between gap-3"><Badge tone="info">{activeItem.type} insight</Badge><span className="font-mono text-[11px] font-semibold text-slate-300">ID {activeItem.id} · updated recently</span></div><h2 className="mt-5 max-w-2xl font-display text-2xl font-bold leading-tight">{activeItem.most_important_issue}</h2><div className="mt-5 flex items-center gap-3 text-xs text-slate-300"><span>Confidence</span><div className="h-1.5 w-28 overflow-hidden rounded-full bg-slate-700"><div className="h-full rounded-full bg-cyan-400" style={{ width: `${activeItem.confidence}%` }} /></div><span className="font-mono text-cyan-300 font-bold">{activeItem.confidence}%</span></div></div><div className="space-y-5 p-6"><div><div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-cyan-800"><span className="grid h-5 w-5 place-items-center rounded-full bg-cyan-100 text-[10px]">01</span>What happened</div><p className="text-sm leading-relaxed text-slate-800">{activeItem.explanation}</p></div><div className="border-t border-slate-100 pt-5"><div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-amber-800"><span className="grid h-5 w-5 place-items-center rounded-full bg-amber-100 text-[10px]">02</span>Why it matters</div><p className="text-sm leading-relaxed text-slate-800">{activeItem.impact}. This is the part of the operation most likely to change if no action is taken.</p></div><div className="border-t border-slate-100 pt-5"><div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-emerald-800"><span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-100 text-[10px]">03</span>Recommended action</div><div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-relaxed text-emerald-950">{activeItem.recommended_action}</div></div><div className="flex flex-wrap gap-2 pt-1"><Button onClick={() => setDone(prev => prev.includes(activeItem.id) ? prev : [...prev, activeItem.id])} disabled={done.includes(activeItem.id)} testId="button-complete-recommendation">{done.includes(activeItem.id) ? <><Check size={14} />Action noted</> : <><Check size={14} />Mark recommendation complete</>}</Button>{activeItem.machine_id && <Link href={`/machines/${activeItem.machine_id}`} data-testid="link-insight-machine" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Open related machine <ChevronRight size={14} /></Link>}</div></div></div></div></>;
}

function ReportsPage() {
  const { alerts, insights, metrics, source, lastSyncTime } = useManufacturing();
  const [exported, setExported] = useState(false);
  const exportReport = async () => { await api.exportReport(); setExported(true); window.setTimeout(() => setExported(false), 3000); };
  return <>
    <SectionTitle eyebrow="Reports" title="Shift summary report" description="A concise handoff for supervisors, managers, and the teams taking the next shift." action={<Button onClick={exportReport} testId="button-export-report">{exported ? <><Check size={15} />Exported</> : <><Download size={15} />Export report</>}</Button>} />
    <div className="mb-5 flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-700 font-medium"><Clock3 size={15} className="text-cyan-700" /><span><strong>Shift B</strong> · {lastSyncTime ? `Live SNS Ingestion (${lastSyncTime})` : 'February 12, 2024 · 14:00–22:00'}</span><span className="ml-auto hidden text-slate-500 sm:block font-medium">{source === 'sns-live' ? 'Generated from live SNS telemetry snapshot' : 'Generated from demo baseline'}</span></div>
    <div className="shell-card overflow-hidden">
      <div className="border-b border-slate-200 bg-slate-900 p-6 text-white sm:p-8" style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div><div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.18em] text-cyan-300 font-bold"><Factory size={14} />Northstar Assembly</div><h2 className="mt-4 font-display text-3xl font-bold">Shift B operations brief</h2><p className="mt-2 max-w-xl text-sm text-slate-300">A clear readout of the signals, issues, and decisions shaping the floor right now.</p></div>
          <div className="rounded-lg border border-slate-700 px-4 py-3 text-right"><div className="font-mono text-[10px] text-slate-300 font-bold">OVERALL STATUS</div><div className={`mt-1 flex items-center gap-2 text-lg font-bold ${metrics.criticalAlertsCount > 0 ? 'text-amber-300' : 'text-emerald-300'}`}><span className={`h-2 w-2 rounded-full ${metrics.criticalAlertsCount > 0 ? 'bg-amber-400' : 'bg-emerald-400'}`} />{metrics.criticalAlertsCount > 0 ? 'Action Required' : 'On plan'}</div></div>
        </div>
      </div>
      <div className="p-6 sm:p-8">
        <div className="grid gap-4 sm:grid-cols-4">
          {[['Units produced', metrics.unitsProduced.toLocaleString(), '+7.4% vs target', 'text-emerald-700'], ['Quality rate', `${metrics.qualityRate.toFixed(1)}%`, '+0.8 pts', 'text-emerald-700'], ['Open alerts', String(metrics.openAlertsCount).padStart(2, '0'), `${metrics.criticalAlertsCount} critical`, 'text-rose-700'], ['Fleet ready', metrics.criticalAlertsCount > 0 ? '62%' : '88%', `${metrics.criticalAlertsCount} in attention`, 'text-amber-700']].map(([label, value, note, tone]) => <div key={label}><div className="text-[11px] font-bold uppercase tracking-wider text-slate-600">{label}</div><div className="mt-1 font-display text-2xl font-extrabold text-slate-950">{value}</div><div className={`mt-1 text-xs font-semibold ${tone}`}>{note}</div></div>)}
        </div>
        <div className="mt-8 grid gap-6 border-t border-slate-100 pt-7 lg:grid-cols-2">
          <div><h3 className="font-display text-lg font-bold text-slate-900">What needs a handoff</h3><div className="mt-4 space-y-3">{alerts.slice(0, 3).map(a => <div key={a.id} className="flex gap-3"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${a.severity === 'Critical' ? 'bg-rose-500' : 'bg-amber-500'}`} /><div><div className="text-sm font-bold text-slate-900">{a.title}</div><div className="mt-1 text-xs font-medium leading-relaxed text-slate-600">{a.machine} · {a.recommended_action}</div></div></div>)}</div></div>
          <div><h3 className="font-display text-lg font-bold text-slate-900">Recommended focus</h3>{insights.length > 0 && <div className="mt-4 rounded-lg border border-cyan-200 bg-cyan-50 p-4"><div className="flex items-center gap-2 text-xs font-bold text-cyan-900"><Sparkles size={14} />Most important issue</div><div className="mt-3 text-sm font-bold leading-relaxed text-slate-900">{insights[0].most_important_issue}</div><div className="mt-2 text-xs font-medium leading-relaxed text-slate-700">{insights[0].recommended_action}</div></div>}</div>
        </div>
        <div className="mt-8 border-t border-slate-100 pt-5 text-[11px] font-medium text-slate-500">Prepared by DriveOps-AI · {source === 'sns-live' ? 'Live SNS Agent Workbench Ingestion' : 'Baseline Data'} · all times local · report ID DOP-B-0212</div>
      </div>
    </div>
  </>;
}

function NotFound() { return <div className="grid min-h-[70vh] place-items-center"><div className="text-center"><div className="font-mono text-xs font-bold uppercase tracking-[.2em] text-cyan-700">404 · route not found</div><h1 className="mt-3 font-display text-3xl font-bold">That view is not on the floor plan.</h1><Link href="/dashboard" data-testid="link-back-dashboard" className="mt-5 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white">Back to command center</Link></div></div>; }
function HomeRedirect() { const [, setLocation] = useLocation(); useEffect(() => { setLocation('/dashboard'); }, [setLocation]); return null; }
function RoutedErrorBoundary({ children }: { children: ReactNode }) { const [location] = useLocation(); return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>; }

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        {/* Public Authentication Routes */}
        <Route path="/login">{() => <AuthPage initialMode="signin" />}</Route>
        <Route path="/signup">{() => <AuthPage initialMode="signup" />}</Route>
        <Route path="/forgot-password">{() => <AuthPage initialMode="forgot" />}</Route>

        {/* Protected Operations Routes */}
        <Route path="/">{() => <ProtectedRoute><Shell><Dashboard /></Shell></ProtectedRoute>}</Route>
        <Route path="/dashboard">{() => <ProtectedRoute><Shell><Dashboard /></Shell></ProtectedRoute>}</Route>
        <Route path="/upload">{() => <ProtectedRoute><Shell><UploadPage /></Shell></ProtectedRoute>}</Route>
        <Route path="/production">{() => <ProtectedRoute><Shell><ProductionPage /></Shell></ProtectedRoute>}</Route>
        <Route path="/machines/:id">{() => <ProtectedRoute><Shell><MachineDetailPage /></Shell></ProtectedRoute>}</Route>
        <Route path="/machines">{() => <ProtectedRoute><Shell><MachinesPage /></Shell></ProtectedRoute>}</Route>
        <Route path="/quality">{() => <ProtectedRoute><Shell><QualityPage /></Shell></ProtectedRoute>}</Route>
        <Route path="/alerts">{() => <ProtectedRoute><Shell><AlertsPage /></Shell></ProtectedRoute>}</Route>
        <Route path="/insights">{() => <ProtectedRoute><Shell><InsightsPage /></Shell></ProtectedRoute>}</Route>
        <Route path="/reports">{() => <ProtectedRoute><Shell><ReportsPage /></Shell></ProtectedRoute>}</Route>
        <Route path="/settings">{() => <ProtectedRoute><Shell><SettingsPage /></Shell></ProtectedRoute>}</Route>

        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <ManufacturingProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <Router />
            </WouterRouter>
            <Toaster />
          </ManufacturingProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
export default App;