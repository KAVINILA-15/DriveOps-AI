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
import type { ManufacturingAnalysisResponse, ManufacturingRecordInput } from '@/services/snsService';

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
}

export interface ManufacturingContextType {
  machines: Machine[];
  alerts: Alert[];
  insights: Insight[];
  lineReadiness: LineReadinessItem[];
  metrics: ManufacturingMetrics;
  lastSyncTime: string | null;
  source: 'demo' | 'sns-live';
  latestAnalysis: ManufacturingAnalysisResponse[];
  applyAnalysisResults: (
    results: ManufacturingAnalysisResponse[],
    rawRows?: ManufacturingRecordInput[]
  ) => void;
  acknowledgeAlert: (alertId: string) => void;
  resetToDefault: () => void;
}

const STORAGE_KEY = 'driveops_manufacturing_state_v1';

const defaultLineReadiness: LineReadinessItem[] = [
  { name: 'Body Line A', score: '97.4%', machinesReady: '42 / 44', status: 'Healthy' },
  { name: 'Body Line B', score: '91.8%', machinesReady: '31 / 35', status: 'Watch' },
  { name: 'Paint Line C', score: '98.6%', machinesReady: '28 / 28', status: 'Healthy' },
  { name: 'Final Assembly', score: '86.2%', machinesReady: '35 / 41', status: 'At risk' },
];

const defaultMetrics: ManufacturingMetrics = {
  unitsProduced: 1284,
  unitsPace: '91 units/hr',
  productionHealth: 92.6,
  qualityRate: 98.2,
  openAlertsCount: 3,
  criticalAlertsCount: 1,
};

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

  const [source, setSource] = useState<'demo' | 'sns-live'>(() => {
    try {
      return (localStorage.getItem(`${STORAGE_KEY}_source`) as 'demo' | 'sns-live') || 'demo';
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
   * Apply live SNS Agent Workbench analysis across all system components
   */
  const applyAnalysisResults = (
    results: ManufacturingAnalysisResponse[],
    rawRows: ManufacturingRecordInput[] = []
  ) => {
    if (!results || results.length === 0) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const syncTimestamp = `Just now · ${timeStr} local (SNS Backend)`;

    // 1. UPDATE MACHINES FLEET
    setMachines((prevMachines) => {
      const updated = [...prevMachines];

      results.forEach((r) => {
        const existingIdx = updated.findIndex((m) => m.machine_id === r.machine_id);
        const isAnomaly = Boolean(r.anomaly_detected);

        const newStatus: MachineStatus = isAnomaly
          ? 'Down'
          : r.machine_status === 'Attention'
          ? 'Attention'
          : 'Running';

        const newOverallStatus: 'Healthy' | 'Watch' | 'At risk' = isAnomaly
          ? 'At risk'
          : r.machine_status === 'Attention'
          ? 'Watch'
          : 'Healthy';

        const issues = r.abnormal_parameters && r.abnormal_parameters.length > 0
          ? r.abnormal_parameters
          : isAnomaly
          ? [`Thermal spike (${r.temperature}°C)`, `High vibration (${r.vibration} mm/s)`]
          : [];

        if (existingIdx >= 0) {
          // Update existing machine
          updated[existingIdx] = {
            ...updated[existingIdx],
            production_line: r.production_line || updated[existingIdx].production_line,
            machine_status: newStatus,
            overall_status: newOverallStatus,
            utilization: isAnomaly ? Math.max(0, updated[existingIdx].utilization - 45) : Math.max(88, updated[existingIdx].utilization),
            cycle_time: isAnomaly ? 0 : updated[existingIdx].cycle_time || 38.5,
            runtime: isAnomaly ? '0h 18m (Stopped)' : updated[existingIdx].runtime,
            detected_issues: issues.length > 0 ? issues : undefined,
          };
        } else {
          // Append new machine dynamically from uploaded dataset
          updated.push({
            machine_id: r.machine_id,
            name: `Station ${r.machine_id}`,
            production_line: r.production_line || 'Body Line A',
            machine_status: newStatus,
            overall_status: newOverallStatus,
            utilization: isAnomaly ? 32 : 92,
            quality_rate: 98.4,
            cycle_time: isAnomaly ? 0 : 39.5,
            target_cycle_time: 40,
            runtime: isAnomaly ? '0h 14m' : '19h 40m',
            last_service: '08 Feb 2024',
            next_service: '28 Feb 2024',
            detected_issues: issues.length > 0 ? issues : undefined,
          });
        }
      });

      return updated;
    });

    // 2. GENERATE NEW ALERTS FROM ANOMALIES
    const newAlerts: Alert[] = [];
    results.forEach((r) => {
      if (r.anomaly_detected) {
        const severity: Severity =
          r.severity === 'Critical'
            ? 'Critical'
            : r.severity === 'High'
            ? 'High'
            : r.severity === 'Medium'
            ? 'Medium'
            : 'Critical';

        newAlerts.push({
          id: `ALT-SNS-${r.machine_id}`,
          machine_id: r.machine_id,
          machine: `Station ${r.machine_id}`,
          production_line: r.production_line || 'Main Line',
          timestamp: 'Just now · SNS Webhook',
          severity,
          title: `${r.machine_id} Critical Anomaly · ${r.abnormal_parameters.join(', ') || 'Threshold Exceeded'}`,
          explanation: `${r.explanation}${r.alert_sent ? ' (Telegram alert was automatically delivered to floor engineers).' : ''}`,
          recommended_action: r.recommended_action || 'Inspect station thermal sensors and check mechanical bearings.',
          alert_required: true,
          acknowledged: false,
        });
      }
    });

    setAlerts((prevAlerts) => {
      // Filter out existing alerts with same ID to avoid duplicates
      const filtered = prevAlerts.filter((a) => !newAlerts.some((na) => na.machine_id === a.machine_id));
      return [...newAlerts, ...filtered];
    });

    // 3. GENERATE HIGH PRIORITY INSIGHTS
    const newInsights: Insight[] = [];
    const anomalies = results.filter((r) => r.anomaly_detected);

    if (anomalies.length > 0) {
      anomalies.forEach((a) => {
        newInsights.push({
          id: `INS-SNS-${a.machine_id}`,
          type: 'Maintenance',
          machine_id: a.machine_id,
          most_important_issue: `${a.machine_id} on ${a.production_line || 'Assembly'}: ${a.explanation}`,
          explanation: `${a.explanation} Recorded temperature ${a.temperature}°C with vibration ${a.vibration} mm/s.${a.alert_sent ? ' Automated Telegram notification dispatched.' : ''}`,
          recommended_action: a.recommended_action || 'Halt station and perform physical verification.',
          confidence: 96,
          impact: `${a.machine_id} station halted · Line pace impacted`,
        });
      });
    }

    setInsights((prevInsights) => {
      if (newInsights.length === 0) return prevInsights;
      const filtered = prevInsights.filter((pi) => !newInsights.some((ni) => ni.id === pi.id));
      return [...newInsights, ...filtered];
    });

    // 4. RECALCULATE LINE READINESS
    const anomaliesByLine = new Set(anomalies.map((a) => a.production_line).filter(Boolean));
    setLineReadiness((prevLines) =>
      prevLines.map((line) => {
        if (anomaliesByLine.has(line.name)) {
          return {
            ...line,
            score: '84.2%',
            status: 'At risk',
          };
        }
        return {
          ...line,
          status: 'Healthy',
          score: '98.1%',
        };
      })
    );

    // 5. RECALCULATE OVERALL PRODUCTION METRICS
    const totalAnomalies = anomalies.length;
    setMetrics((prev) => ({
      ...prev,
      openAlertsCount: prev.openAlertsCount + totalAnomalies,
      criticalAlertsCount: totalAnomalies,
      productionHealth: totalAnomalies > 0 ? Math.max(78, 92.6 - totalAnomalies * 6.5) : 94.2,
      qualityRate: totalAnomalies > 0 ? 96.8 : 98.6,
    }));

    setLastSyncTime(syncTimestamp);
    setSource('sns-live');
    setLatestAnalysis(results);
  };

  const acknowledgeAlert = (alertId: string) => {
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
