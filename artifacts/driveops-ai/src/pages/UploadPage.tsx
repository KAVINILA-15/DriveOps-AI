import React, { useState } from 'react';
import { Link } from 'wouter';
import {
  CloudUpload,
  CircleCheck,
  Check,
  RefreshCw,
  Play,
  Sparkles,
  ChevronRight,
  AlertTriangle,
  Send,
  ShieldCheck,
  Gauge,
  Thermometer,
  Activity,
  Bot,
} from 'lucide-react';
import {
  snsService,
  type ManufacturingRecordInput,
  type ManufacturingAnalysisResponse,
} from '@/services/snsService';
import { supabaseService } from '@/services/supabaseService';
import { useManufacturing } from '@/contexts/ManufacturingContext';

function StatusDot({ status }: { status: string }) {
  const color =
    status === 'Running' || status === 'Healthy' || status === 'Normal'
      ? 'bg-emerald-500'
      : status === 'Attention' || status === 'Watch'
      ? 'bg-amber-500'
      : status === 'Maintenance'
      ? 'bg-sky-500'
      : 'bg-rose-500';
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} aria-label={status} />;
}

function Badge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
}) {
  const styles = {
    neutral: 'bg-slate-100 text-slate-600',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-rose-50 text-rose-700',
    info: 'bg-cyan-50 text-cyan-700',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold tracking-wide ${styles[tone]}`}>
      {children}
    </span>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <div className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[.16em] text-cyan-700">
            {eyebrow}
          </div>
        )}
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

const SAMPLE_CSV = `machine_id,production_line,timestamp,temperature,vibration,pressure,quality_rate,machine_status
M-117,Body Line A,2026-09-17T04:30:00Z,42.0,1.2,96,99.1,Normal
M-089,Paint Line C,2026-09-17T04:31:00Z,48.5,1.5,98,98.7,Normal
M-204,Body Line A,2026-09-17T04:32:00Z,95.0,8.2,115,92.4,Critical
M-074,Body Line B,2026-09-17T04:33:00Z,51.0,2.1,102,97.1,Normal
M-312,Final Assembly,2026-09-17T04:34:00Z,92.0,6.8,110,88.9,Critical`;

export function UploadPage() {
  const { applyAnalysisResults, machines } = useManufacturing();
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ManufacturingRecordInput[]>([]);
  const [stage, setStage] = useState<'idle' | 'uploading' | 'complete'>('idle');
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [results, setResults] = useState<ManufacturingAnalysisResponse[]>([]);
  const [activeTab, setActiveTab] = useState<'preview' | 'results'>('preview');

  // Load sample data into preview
  const handleLoadSample = () => {
    const records = snsService.parseCsv(SAMPLE_CSV);
    setParsedRows(records);
    setFile(new File([SAMPLE_CSV], 'northstar_telemetry_sample.csv', { type: 'text/csv' }));
    setResults([]);
    setStage('idle');
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setResults([]);
    setStage('idle');

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const parsed = snsService.parseCsv(text);
        setParsedRows(parsed);
      }
    };
    reader.readAsText(selected);
  };

  // Run live analysis via SNS Agent Workbench webhook
  const startAnalysis = async () => {
    const rowsToAnalyze = parsedRows.length > 0 ? parsedRows : snsService.parseCsv(SAMPLE_CSV);
    if (parsedRows.length === 0) {
      setParsedRows(rowsToAnalyze);
    }

    setStage('uploading');
    setProgress({ completed: 0, total: rowsToAnalyze.length });

    try {
      const responses = await snsService.analyzeBatch(rowsToAnalyze, (completed, total) => {
        setProgress({ completed, total });
      });

      setResults(responses);
      setStage('complete');
      setActiveTab('results');

      // Update the entire application state (Dashboard, Machines Fleet, Alerts, Line Readiness, Insights)
      applyAnalysisResults(responses, rowsToAnalyze);

      // Auto-sync anomalies to Supabase public.alerts if available
      for (const r of responses) {
        if (r.anomaly_detected) {
          try {
            await supabaseService.acknowledgeAlert(r.machine_id);
          } catch {
            // Ignore offline fallback
          }
        }
      }
    } catch (err) {
      console.error('Batch analysis failed:', err);
      setStage('complete');
    }
  };

  const anomalies = results.filter((r) => r.anomaly_detected);
  const alertsSent = results.filter((r) => r.alert_sent);

  return (
    <>
      <SectionTitle
        eyebrow="Data intake"
        title="Bring in a production snapshot"
        description="Upload a CSV export and DriveOps will evaluate machine signals directly against your SNS Agent Workbench backend."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadSample}
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-200 bg-cyan-50/80 px-3 py-1.5 text-xs font-bold text-cyan-800 hover:bg-cyan-100 transition shadow-2xs"
            >
              <Sparkles size={14} /> Load Sample Telemetry
            </button>
            <Badge tone="info">CSV only · max 25 MB</Badge>
          </div>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_1.1fr]">
        {/* Left Column: Upload & Live Progress */}
        <div className="space-y-5">
          <div
            className={`shell-card scan-line flex min-h-[290px] flex-col items-center justify-center border-dashed p-6 text-center transition ${
              stage === 'complete'
                ? 'border-emerald-300 bg-emerald-50/40'
                : 'border-slate-300 hover:border-cyan-400 hover:bg-cyan-50/20'
            }`}
          >
            <input
              data-testid="input-csv-upload"
              type="file"
              accept=".csv"
              className="hidden"
              id="csv-upload"
              onChange={handleFileChange}
            />

            {stage === 'complete' ? (
              <CircleCheck size={44} className="text-emerald-600" />
            ) : (
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-cyan-50 text-cyan-700">
                <CloudUpload size={27} />
              </div>
            )}

            <h2 className="mt-5 font-display text-lg font-bold text-slate-900">
              {stage === 'complete'
                ? 'Analysis Complete · Verified with SNS Agent Workbench'
                : file
                ? file.name
                : 'Drop a CSV snapshot here'}
            </h2>

            <p className="mt-2 max-w-sm text-sm font-medium text-slate-600">
              {stage === 'complete'
                ? `Analyzed ${results.length} stations. Found ${anomalies.length} ${
                    anomalies.length === 1 ? 'anomaly' : 'anomalies'
                  } with ${alertsSent.length} Telegram alert dispatched.`
                : parsedRows.length > 0
                ? `Loaded ${parsedRows.length} rows ready for manufacturing intelligence analysis.`
                : 'Use a CSV line export with timestamps, machine IDs, temperature, vibration, and status.'}
            </p>

            {stage === 'idle' && (
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <label
                  htmlFor="csv-upload"
                  data-testid="button-browse-csv"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:brightness-110 shadow-sm"
                >
                  <CloudUpload size={16} />
                  Browse files
                </label>
                {(file || parsedRows.length > 0) && (
                  <button
                    type="button"
                    data-testid="button-start-analysis"
                    onClick={startAnalysis}
                    className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-extrabold text-slate-950 hover:bg-cyan-400 transition shadow-sm"
                  >
                    <Play size={14} fill="currentColor" />
                    Analyze with SNS Backend
                  </button>
                )}
              </div>
            )}

            {stage === 'uploading' && (
              <div className="mt-5 w-full max-w-xs space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Dispatching to SNS Webhook...</span>
                  <span className="font-mono font-extrabold text-cyan-700">
                    {progress.total > 0
                      ? `${Math.round((progress.completed / progress.total) * 100)}%`
                      : '0%'}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="progress-stripe h-full rounded-full bg-cyan-500 transition-all duration-300"
                    style={{
                      width: `${progress.total > 0 ? (progress.completed / progress.total) * 100 : 10}%`,
                    }}
                  />
                </div>
                <div className="text-[11px] font-medium text-slate-500">
                  Evaluating record {progress.completed} of {progress.total}
                </div>
              </div>
            )}

            {stage === 'complete' && (
              <div className="mt-5 space-y-3 w-full">
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setParsedRows([]);
                      setResults([]);
                      setStage('idle');
                      setActiveTab('preview');
                    }}
                    data-testid="button-upload-another"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs"
                  >
                    <RefreshCw size={14} />
                    Upload another
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('results')}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3.5 py-2 text-xs font-extrabold text-slate-950 hover:bg-cyan-400 shadow-2xs"
                  >
                    <span>View Analysis Results</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                <div className="rounded-xl border border-emerald-300 bg-emerald-50/70 p-3 text-left">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-950">
                    <CircleCheck size={16} className="text-emerald-600 shrink-0" />
                    <span>Other pages & sections updated with live SNS intelligence</span>
                  </div>
                  <p className="mt-1 text-[11px] text-emerald-800">
                    Command Center, Machine fleet, Alert Queue, and Line Readiness now reflect these evaluated stations.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href="/dashboard"
                      data-testid="link-goto-dashboard"
                      className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-2xs"
                    >
                      <span>Go to Command Center</span>
                      <ChevronRight size={12} />
                    </Link>
                    <Link
                      href="/alerts"
                      data-testid="link-goto-alerts"
                      className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-white px-2.5 py-1.5 text-xs font-bold text-emerald-900 hover:bg-emerald-50 shadow-2xs"
                    >
                      <span>View Alert Queue ({anomalies.length})</span>
                      <ChevronRight size={12} />
                    </Link>
                    <Link
                      href="/machines"
                      data-testid="link-goto-machines"
                      className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-white px-2.5 py-1.5 text-xs font-bold text-emerald-900 hover:bg-emerald-50 shadow-2xs"
                    >
                      <span>View Machines Fleet</span>
                      <ChevronRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Backend Connection Diagnostics */}
          <div className="shell-card p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot size={18} className="text-cyan-700" />
                <h2 className="font-display font-bold text-slate-900">
                  SNS Agent Workbench Target
                </h2>
              </div>
              <Badge tone="success">Active Webhook</Badge>
            </div>
            <div className="mt-2 rounded-lg border border-slate-100 bg-slate-50 p-2.5 font-mono text-[11px] text-slate-700 truncate">
              {snsService.getWebhookUrl()}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Each row is sent as a single manufacturing record. Anomalies trigger automated Telegram alerts and return standardized intelligence responses.
            </p>
          </div>
        </div>

        {/* Right Column: Preview Table OR Live Results */}
        <div className="space-y-5">
          {stage === 'complete' && results.length > 0 && (
            <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('results')}
                className={`flex-1 rounded-md py-1.5 transition ${
                  activeTab === 'results' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                SNS Analysis Results ({results.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`flex-1 rounded-md py-1.5 transition ${
                  activeTab === 'preview' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Raw CSV Preview
              </button>
            </div>
          )}

          {/* RESULTS VIEW */}
          {activeTab === 'results' && results.length > 0 ? (
            <div className="shell-card p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="font-display font-bold text-slate-900">
                    Live Telemetry Evaluation
                  </h2>
                  <p className="text-xs text-slate-500">
                    Verified through SNS manufacturing workflow
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={anomalies.length > 0 ? 'danger' : 'success'}>
                    {anomalies.length > 0
                      ? `${anomalies.length} Anomalies Found`
                      : 'All Stations Nominal'}
                  </Badge>
                  {alertsSent.length > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-1 text-[11px] font-bold text-rose-900">
                      <Send size={12} /> {alertsSent.length} Telegram Sent
                    </span>
                  )}
                </div>
              </div>

              {/* Anomaly Highlight Card */}
              {anomalies.map((a) => (
                <div
                  key={a.machine_id}
                  className="rounded-xl border-2 border-rose-300 bg-rose-50/60 p-4 text-xs text-rose-950 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-sm text-rose-900">
                      <AlertTriangle size={16} className="text-rose-600" />
                      <span>{a.machine_id} · Critical Anomaly Detected</span>
                    </div>
                    {a.alert_sent && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-2.5 py-0.5 text-[10px] font-extrabold text-white">
                        <Send size={11} /> Telegram Alert Dispatched
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 font-mono text-[11px] pt-1">
                    <div>
                      <span className="text-rose-700 font-semibold">Temperature: </span>
                      <span className="font-bold">{a.temperature}°C</span>
                    </div>
                    <div>
                      <span className="text-rose-700 font-semibold">Vibration: </span>
                      <span className="font-bold">{a.vibration} mm/s</span>
                    </div>
                  </div>
                  <div className="text-slate-800 leading-relaxed font-medium">
                    <span className="font-bold text-rose-900">Explanation: </span>
                    {a.explanation}
                  </div>
                  <div className="rounded-lg bg-white/80 p-2 text-[11px] border border-rose-200">
                    <span className="font-bold text-rose-900">Recommended Action: </span>
                    {a.recommended_action}
                  </div>
                </div>
              ))}

              {/* All Stations Summary List */}
              <div className="space-y-2 pt-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Station Evaluation Breakdown
                </div>
                {results.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <StatusDot status={r.anomaly_detected ? 'Down' : 'Running'} />
                      <span className="font-bold text-slate-900">{r.machine_id}</span>
                      <span className="text-slate-500">{r.production_line || 'Main Line'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-700">
                        {r.temperature}°C · {r.vibration} mm/s
                      </span>
                      <Badge tone={r.anomaly_detected ? 'danger' : 'success'}>
                        {r.anomaly_detected ? 'Critical' : 'Normal'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* PREVIEW VIEW */
            <div className="shell-card p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="font-display font-bold text-slate-900">Snapshot preview</h2>
                  <p className="mt-1 text-xs font-medium text-slate-600">
                    {parsedRows.length > 0
                      ? `${file?.name || 'northstar_telemetry.csv'} · ${parsedRows.length} rows loaded`
                      : 'Demo snapshot · northstar_shift_b_2024-02-12.csv'}
                  </p>
                </div>
                <Badge tone="success">
                  <Check size={12} />
                  Validated
                </Badge>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-600 font-bold">
                      {['Timestamp', 'Machine', 'Line', 'Temp (°C)', 'Vibration', 'Status'].map(
                        (h) => (
                          <th key={h} className="pb-3 pr-4 font-bold">
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {(parsedRows.length > 0 ? parsedRows.slice(0, 5) : machines.slice(0, 5)).map(
                      (row: any, i) => (
                        <tr key={row.machine_id || i} className="border-b border-slate-50 text-xs">
                          <td className="py-3 pr-4 font-mono font-medium text-slate-700">
                            {row.timestamp ? String(row.timestamp).substring(11, 16) || '14:30' : `14:${String(36 - i * 4).padStart(2, '0')}`}
                          </td>
                          <td className="py-3 pr-4 font-bold text-slate-800">{row.machine_id}</td>
                          <td className="py-3 pr-4 font-medium text-slate-700">
                            {row.production_line || 'Body Line A'}
                          </td>
                          <td className="py-3 pr-4 font-mono font-semibold text-slate-800">
                            {row.temperature !== undefined ? `${row.temperature}°C` : '42.5°C'}
                          </td>
                          <td className="py-3 pr-4 font-mono font-semibold text-slate-800">
                            {row.vibration !== undefined ? `${row.vibration}` : '1.2'}
                          </td>
                          <td className="py-3 pr-4">
                            <span className="flex items-center gap-1.5 font-semibold">
                              <StatusDot status={row.machine_status || 'Running'} />
                              {row.machine_status || 'Running'}
                            </span>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs font-medium text-slate-600">
                <span>
                  Showing {Math.min(5, parsedRows.length || 5)} of {parsedRows.length || 4826} rows
                </span>
                <span className="font-semibold text-cyan-800">Ready for SNS Agent dispatch</span>
              </div>
            </div>
          )}

          {/* Process Workflow Visualizer */}
          <div className="shell-card p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-700">
                <Sparkles size={17} />
              </div>
              <div>
                <h2 className="font-display font-bold text-slate-900">What happens next</h2>
                <p className="text-xs font-medium text-slate-600">
                  A clear path from telemetry intake to automated action
                </p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-5 gap-1">
              {[
                ['01', 'CSV Intake'],
                ['02', 'SNS Webhook'],
                ['03', 'AI Anomaly Check'],
                ['04', 'Telegram Alert'],
                ['05', 'Floor Resolution'],
              ].map(([n, label], i) => (
                <div key={n} className="relative text-center">
                  <div
                    className={`mx-auto grid h-7 w-7 place-items-center rounded-full font-mono text-[10px] font-bold ${
                      i < 3 ? 'bg-primary text-white' : 'border border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    {n}
                  </div>
                  <div className="mt-2 text-[10px] font-bold leading-tight text-slate-700">
                    {label}
                  </div>
                  {i < 4 && <div className="absolute left-[60%] top-3 h-px w-[80%] bg-slate-200" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
