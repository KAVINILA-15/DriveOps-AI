import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import {
  machines as defaultMachines,
  alerts as defaultAlerts,
  insights as defaultInsights,
  type Machine,
  type Alert,
  type Insight,
  type Severity,
  type MachineStatus,
} from '@/lib/driveops-service';
import { driveopsBackendService, type ManufacturingAnalysisResponse, type ManufacturingRecordInput } from '@/services/backendService';

export interface LineReadinessItem {
  name: string;
  score: string;
  machinesReady: string;
  status: 'Healthy' | 'Watch' | 'At risk';
}

export interface ManufacturingMetrics {
  unitsProduced: number;
  unitsPace: string;
  productionHealth: number;
  qualityRate: number;
  openAlertsCount: number;
  criticalAlertsCount: number;
  total_records?: number;
  normal_records?: number;
  anomaly_count?: number;
  total_defects?: number;
  dataset_name?: string;
}

interface ManufacturingContextType {
  machines: Machine[];
  alerts: Alert[];
  insights: Insight[];
  lineReadiness: LineReadinessItem[];
  metrics: ManufacturingMetrics;
  lastSyncTime: string | null;
  source: 'demo' | 'live';
  latestAnalysis: ManufacturingAnalysisResponse[];
  refreshFromBackend: () => Promise<void>;
  applyAnalysisResults: (results: ManufacturingAnalysisResponse[], rawRows?: ManufacturingRecordInput[]) => void;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  resetToDefault: () => void;
}

const defaultLineReadiness: LineReadinessItem[] = [
  { name: 'Body Line A', score: '97.4%', machinesReady: '42 / 44', status: 'Healthy' },
  { name: 'Body Line B', score: '91.8%', machinesReady: '31 / 35', status: 'Watch' },
  { name: 'Paint Line C', score: '98.6%', machinesReady: '28 / 28', status: 'Healthy' },
  { name: 'Final Assembly', score: '86.2%', machinesReady: '35 / 41', status: 'At risk' },
];

const defaultMetrics: ManufacturingMetrics = {
  unitsProduced: 4826,
  unitsPace: '+14/h',
  productionHealth: 94.2,
  qualityRate: 98.4,
  openAlertsCount: 3,
  criticalAlertsCount: 1,
  total_records: 300,
  normal_records: 283,
  anomaly_count: 17,
  total_defects: 12,
};

const STORAGE_KEY = 'driveops_manufacturing_state_v3';

const ManufacturingContext = createContext<ManufacturingContextType | undefined>(undefined);

export function ManufacturingProvider({ children }: { children: ReactNode }) {
  const [machines, setMachines] = useState<Machine[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_machines`);
      return saved ? JSON.parse(saved) : defaultMachines;
    } catch {
      return defaultMachines;
    }
  });

  const [alerts, setAlerts] = useState<Alert[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_alerts`);
      return saved ? JSON.parse(saved) : defaultAlerts;
    } catch {
      return defaultAlerts;
    }
  });

  const [insights, setInsights] = useState<Insight[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_insights`);
      return saved ? JSON.parse(saved) : defaultInsights;
    } catch {
      return defaultInsights;
    }
  });

  const [lineReadiness, setLineReadiness] = useState<LineReadinessItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_lineReadiness`);
      return saved ? JSON.parse(saved) : defaultLineReadiness;
    } catch {
      return defaultLineReadiness;
    }
  });

  const [metrics, setMetrics] = useState<ManufacturingMetrics>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_metrics`);
      return saved ? JSON.parse(saved) : defaultMetrics;
    } catch {
      return defaultMetrics;
    }
  });

  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    try {
      return localStorage.getItem(`${STORAGE_KEY}_lastSyncTime`);
    } catch {
      return null;
    }
  });

  const [source, setSource] = useState<'demo' | 'live'>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_source`);
      if (saved === 'live') {
        return 'live';
      }
      return 'demo';
    } catch {
      return 'demo';
    }
  });

  const [latestAnalysis, setLatestAnalysis] = useState<ManufacturingAnalysisResponse[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_latestAnalysis`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save to localStorage when state changes
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_machines`, JSON.stringify(machines));
      localStorage.setItem(`${STORAGE_KEY}_alerts`, JSON.stringify(alerts));
      localStorage.setItem(`${STORAGE_KEY}_insights`, JSON.stringify(insights));
      localStorage.setItem(`${STORAGE_KEY}_lineReadiness`, JSON.stringify(lineReadiness));
      localStorage.setItem(`${STORAGE_KEY}_metrics`, JSON.stringify(metrics));
      if (lastSyncTime) localStorage.setItem(`${STORAGE_KEY}_lastSyncTime`, lastSyncTime);
      localStorage.setItem(`${STORAGE_KEY}_source`, source);
      localStorage.setItem(`${STORAGE_KEY}_latestAnalysis`, JSON.stringify(latestAnalysis));
    } catch {
      // Ignore storage errors
    }
  }, [machines, alerts, insights, lineReadiness, metrics, lastSyncTime, source, latestAnalysis]);

  /**
   * Real backend sync: Fetch actual calculated data from the backend API
   * The backend is the single source of truth for all calculations.
   */
  const refreshFromBackend = async () => {
    try {
      const data = await driveopsBackendService.fetchDashboard();
      if (data) {
        if (data.machines && Array.isArray(data.machines)) {
          setMachines(data.machines);
        }
        if (data.alerts && Array.isArray(data.alerts)) {
          const mappedAlerts: Alert[] = data.alerts.map((a: any) => ({
            id: a.alert_id || a.id,
            machine_id: a.machine_id,
            machine: `Station ${a.machine_id}`,
            production_line: a.production_line || 'Body Line A',
            timestamp: a.timestamp || 'Just now',
            severity: (a.severity as Severity) || 'Medium',
            title: a.alert_type || a.title || 'Operational Alert',
            explanation: a.message || a.explanation || 'Operational threshold exceeded.',
            recommended_action: a.recommended_action || 'Inspect station immediately.',
            alert_required: a.severity === 'Critical' || a.severity === 'High',
            acknowledged: a.status === 'acknowledged',
          }));
          setAlerts(mappedAlerts);
        }
        if (data.line_readiness && Array.isArray(data.line_readiness)) {
          setLineReadiness(data.line_readiness);
        }
        if (data.insights && Array.isArray(data.insights)) {
          setInsights(data.insights);
        }
        if (data.metrics) {
          setMetrics(data.metrics);
        }
        setSource('live');
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        setLastSyncTime(`Just now · ${timeStr} local (DriveOps-AI Backend)`);
      }
    } catch (err) {
      console.warn('Backend sync deferred (offline or starting up):', err);
    }
  };

  // Sync with backend on initial mount
  useEffect(() => {
    refreshFromBackend();
  }, []);

  /**
   * Apply live DriveOps-AI Backend analysis across all system components
   */
  const applyAnalysisResults = (
    results: ManufacturingAnalysisResponse[],
    _rawRows: ManufacturingRecordInput[] = []
  ) => {
    if (!results || results.length === 0) return;
    setLatestAnalysis(results);
    setSource('live');
    refreshFromBackend();
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await driveopsBackendService.acknowledgeAlert(alertId);
    } catch (err) {
      console.warn('Backend acknowledge failed, applying local update:', err);
    }
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
    );
    setMetrics((prev) => ({
      ...prev,
      openAlertsCount: Math.max(0, prev.openAlertsCount - 1),
    }));
  };

  const resetToDefault = () => {
    setMachines(defaultMachines);
    setAlerts(defaultAlerts);
    setInsights(defaultInsights);
    setLineReadiness(defaultLineReadiness);
    setMetrics(defaultMetrics);
    setLastSyncTime(null);
    setSource('demo');
    setLatestAnalysis([]);
    try {
      localStorage.removeItem(`${STORAGE_KEY}_machines`);
      localStorage.removeItem(`${STORAGE_KEY}_alerts`);
      localStorage.removeItem(`${STORAGE_KEY}_insights`);
      localStorage.removeItem(`${STORAGE_KEY}_lineReadiness`);
      localStorage.removeItem(`${STORAGE_KEY}_metrics`);
      localStorage.removeItem(`${STORAGE_KEY}_lastSyncTime`);
      localStorage.removeItem(`${STORAGE_KEY}_source`);
      localStorage.removeItem(`${STORAGE_KEY}_latestAnalysis`);
    } catch {
      // Ignore
    }
  };

  return (
    <ManufacturingContext.Provider
      value={{
        machines,
        alerts,
        insights,
        lineReadiness,
        metrics,
        lastSyncTime,
        source,
        latestAnalysis,
        refreshFromBackend,
        applyAnalysisResults,
        acknowledgeAlert,
        resetToDefault,
      }}
    >
      {children}
    </ManufacturingContext.Provider>
  );
}

export function useManufacturing(): ManufacturingContextType {
  const context = useContext(ManufacturingContext);
  if (!context) {
    throw new Error('useManufacturing must be used within a ManufacturingProvider');
  }
  return context;
}
