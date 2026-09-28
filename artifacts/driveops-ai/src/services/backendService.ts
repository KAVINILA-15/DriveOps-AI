/**
 * DriveOps-AI Backend Service
 * Communicates directly with the real DriveOps-AI Manufacturing Intelligence Backend
 * 100% deterministic analysis, real calculations, zero hallucinations
 */

export interface ManufacturingRecordInput {
  machine_id: string;
  production_line?: string;
  timestamp?: string;
  temperature: number;
  vibration: number;
  pressure?: number;
  power_consumption?: number;
  production_target?: number;
  production_actual?: number;
  quality_rate?: number;
  defect_count?: number;
  defect_type?: string;
  machine_status?: string;
  [key: string]: any;
}

export interface AnomalyItem {
  row_index: number;
  machine_id: string;
  production_line: string;
  timestamp: string;
  is_anomaly: boolean;
  reasons: string[];
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Normal';
  machine_issue: boolean;
  production_issue: boolean;
  quality_issue: boolean;
  explanation: string;
  recommended_action: string;
  metrics: {
    temperature?: number;
    vibration?: number;
    pressure?: number;
    power_consumption?: number;
    production_target?: number;
    production_actual?: number;
    quality_rate?: number;
    defect_count?: number;
    defect_type?: string;
  };
}

export interface UploadResult {
  success: boolean;
  dataset: {
    dataset_id: string;
    file_name: string;
    file_hash: string;
    uploaded_at: string;
    total_records: number;
    normal_records: number;
    anomaly_records: number;
    machine_issues: number;
    production_issues: number;
    quality_issues: number;
    alerts_generated: number;
  };
  summary: {
    total_records: number;
    normal_records: number;
    anomaly_count: number;
    machine_issues: number;
    production_issues: number;
    quality_issues: number;
    average_quality_rate: number;
    production_achievement_rate: number;
    total_defects: number;
    alerts_count: number;
  };
  anomalies: AnomalyItem[];
  explanation: string;
  error?: string;
}

export interface ActiveDatasetResponse {
  active: boolean;
  dataset: {
    dataset_id: string;
    filename: string;
    file_size: number;
    uploaded_at: string;
    row_count: number;
    processing_status: 'uploaded' | 'processing' | 'completed' | 'failed';
    analysis_status: 'idle' | 'running' | 'completed' | 'failed';
    analysis_completion_timestamp?: string;
    dataset_hash: string;
  } | null;
  analysis: {
    analysis_id: string;
    dataset_id: string;
    status: string;
    started_at: string;
    completed_at?: string;
    total_records: number;
    anomaly_count: number;
    normal_count: number;
    machine_issues: number;
    production_issues: number;
    quality_issues: number;
    average_quality_rate: number;
    production_achievement_rate: number;
    total_defects: number;
    alerts_count: number;
    anomalies: AnomalyItem[];
    summary: any;
    explanation: string;
  } | null;
  anomalies: AnomalyItem[];
  recordsPreview: ManufacturingRecordInput[];
  summary?: any;
}

export interface ManufacturingAnalysisResponse {
  machine_id: string;
  production_line: string;
  timestamp: string;
  temperature: number;
  vibration: number;
  anomaly_detected: boolean;
  machine_status: string;
  abnormal_parameters: string[];
  severity: string;
  explanation: string;
  recommended_action: string;
  alert_sent: boolean;
  overall_status?: string;
  machine_analysis?: any;
  production_analysis?: any;
  quality_analysis?: any;
  alerts?: any[];
  recommendations?: string[];
  raw?: any;
}

const API_BASE = import.meta.env.VITE_BACKEND_URL
  ? `${import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '')}/api`
  : '/api';

export const driveopsBackendService = {
  getBackendUrl(): string {
    return API_BASE;
  },

  /**
   * Upload CSV file to backend for 100% deterministic analysis
   * Single call, zero random anomaly counts, guaranteed identical results for duplicate files
   */
  async uploadCsv(file: File | string, fileName?: string): Promise<UploadResult> {
    const url = `${this.getBackendUrl()}/datasets/upload`;

    let payload: { csv: string; fileName: string };
    if (typeof file === 'string') {
      payload = { csv: file, fileName: fileName || 'manufacturing_telemetry.csv' };
    } else {
      const text = await file.text();
      payload = { csv: text, fileName: file.name };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || `Upload failed with status ${res.status}`);
    }

    return data as UploadResult;
  },

  /**
   * Retrieve active dataset and completed analysis run
   */
  async getActiveDataset(): Promise<ActiveDatasetResponse> {
    const res = await fetch(`${this.getBackendUrl()}/datasets/active`);
    if (!res.ok) throw new Error('Failed to retrieve active dataset');
    return await res.json();
  },

  /**
   * Delete dataset and reset active telemetry to initial baseline
   */
  async deleteDataset(datasetId: string): Promise<boolean> {
    const res = await fetch(`${this.getBackendUrl()}/datasets/${encodeURIComponent(datasetId)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to delete dataset');
    }
    return true;
  },

  /**
   * Retrieve dataset processing and analysis status
   */
  async getDatasetStatus(datasetId: string) {
    const res = await fetch(`${this.getBackendUrl()}/datasets/${encodeURIComponent(datasetId)}/status`);
    if (!res.ok) throw new Error('Failed to retrieve dataset status');
    return await res.json();
  },

  /**
   * Trigger or retrieve analysis for a dataset
   */
  async analyzeDataset(datasetId: string) {
    const res = await fetch(`${this.getBackendUrl()}/datasets/${encodeURIComponent(datasetId)}/analyze`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to analyze dataset');
    return await res.json();
  },

  /**
   * Parse a raw CSV text string into typed ManufacturingRecordInput items for preview
   */
  parseCsv(csvText: string): ManufacturingRecordInput[] {
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) return [];

    const headers = lines[0]
      .split(',')
      .map((h) => h.replace(/^["']|["']$/g, '').trim().toLowerCase().replace(/[\s_-]+/g, '_'));

    const records: ManufacturingRecordInput[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.replace(/^["']|["']$/g, '').trim());
      if (values.length < 2) continue;

      const obj: Record<string, any> = {};
      headers.forEach((h, idx) => {
        const val = values[idx];
        if (h === 'temperature' || h === 'temp') {
          obj.temperature = parseFloat(val) || 0;
        } else if (h === 'vibration' || h === 'vib') {
          obj.vibration = parseFloat(val) || 0;
        } else if (h === 'pressure') {
          obj.pressure = parseFloat(val) || 0;
        } else if (h === 'power_consumption') {
          obj.power_consumption = parseFloat(val) || 0;
        } else if (h === 'production_target') {
          obj.production_target = parseFloat(val) || 0;
        } else if (h === 'production_actual') {
          obj.production_actual = parseFloat(val) || 0;
        } else if (h === 'quality_rate') {
          obj.quality_rate = parseFloat(val) || 0;
        } else if (h === 'defect_count') {
          obj.defect_count = parseInt(val, 10) || 0;
        } else {
          obj[h] = val;
        }
      });

      records.push({
        machine_id: obj.machine_id || obj.machine || `M-${100 + i}`,
        production_line: obj.production_line || obj.line || 'Body Line A',
        timestamp: obj.timestamp || obj.time || new Date().toISOString(),
        temperature: obj.temperature !== undefined ? obj.temperature : 40,
        vibration: obj.vibration !== undefined ? obj.vibration : 1.0,
        pressure: obj.pressure,
        power_consumption: obj.power_consumption,
        production_target: obj.production_target,
        production_actual: obj.production_actual,
        quality_rate: obj.quality_rate,
        defect_count: obj.defect_count,
        defect_type: obj.defect_type,
        machine_status: obj.machine_status || obj.status,
      });
    }

    return records;
  },

  /**
   * Send a single manufacturing record to the DriveOps-AI backend analysis endpoint
   */
  async analyzeRecord(record: ManufacturingRecordInput): Promise<ManufacturingAnalysisResponse> {
    const url = `${this.getBackendUrl()}/manufacturing/analyze`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(record),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Backend returned HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    return this.normalizeResponse(data, record);
  },

  /**
   * Fetch full dashboard state calculated directly from the active backend dataset
   */
  async fetchDashboard() {
    const res = await fetch(`${this.getBackendUrl()}/dashboard`);
    if (!res.ok) throw new Error('Failed to retrieve dashboard data');
    return await res.json();
  },

  /**
   * Fetch live alerts from the DriveOps-AI backend
   */
  async getAlerts() {
    try {
      const res = await fetch(`${this.getBackendUrl()}/alerts`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Failed to fetch alerts from backend:', err);
    }
    return [];
  },

  /**
   * Acknowledge an alert via DriveOps-AI backend
   */
  async acknowledgeAlert(alertId: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.getBackendUrl()}/alerts/${encodeURIComponent(alertId)}/acknowledge`, {
        method: 'PATCH',
      });
      return res.ok;
    } catch (err) {
      console.warn('Failed to acknowledge alert via backend:', err);
      return false;
    }
  },

  /**
   * Fetch production intelligence from backend
   */
  async fetchProduction() {
    const res = await fetch(`${this.getBackendUrl()}/production`);
    if (!res.ok) throw new Error('Failed to retrieve production statistics');
    return await res.json();
  },

  /**
   * Fetch quality intelligence from backend
   */
  async fetchQuality() {
    const res = await fetch(`${this.getBackendUrl()}/quality`);
    if (!res.ok) throw new Error('Failed to retrieve quality statistics');
    return await res.json();
  },

  /**
   * Fetch machines fleet from backend
   */
  async fetchMachines() {
    const res = await fetch(`${this.getBackendUrl()}/machines`);
    if (!res.ok) throw new Error('Failed to retrieve machines fleet');
    return await res.json();
  },

  /**
   * Fetch operational insights from backend
   */
  async fetchInsights() {
    const res = await fetch(`${this.getBackendUrl()}/insights`);
    if (!res.ok) throw new Error('Failed to retrieve insights');
    return await res.json();
  },

  /**
   * Fetch shift report from backend
   */
  async fetchShiftReport() {
    const res = await fetch(`${this.getBackendUrl()}/reports/shift`);
    if (!res.ok) throw new Error('Failed to retrieve shift report');
    return await res.json();
  },

  /**
   * Check backend server health
   */
  async checkHealth(): Promise<{ ok: boolean; status?: string; message?: string }> {
    try {
      const res = await fetch(`${this.getBackendUrl()}/healthz`);
      if (res.ok) {
        const data = await res.json();
        return { ok: true, status: data.status, message: 'Connected to DriveOps-AI Backend' };
      }
      return { ok: false, message: `HTTP ${res.status}: ${res.statusText}` };
    } catch (err: any) {
      return { ok: false, message: err?.message || 'Backend unreachable' };
    }
  },

  /**
   * Normalize backend response to ensure consistent fields
   */
  normalizeResponse(
    data: any,
    fallbackInput: ManufacturingRecordInput
  ): ManufacturingAnalysisResponse {
    if (data && typeof data.anomaly_detected !== 'undefined') {
      return {
        machine_id: data.machine_id || fallbackInput.machine_id,
        production_line: data.production_line || fallbackInput.production_line || '',
        timestamp: data.timestamp || fallbackInput.timestamp || '',
        temperature: Number(data.temperature ?? fallbackInput.temperature),
        vibration: Number(data.vibration ?? fallbackInput.vibration),
        anomaly_detected: Boolean(data.anomaly_detected),
        machine_status: data.machine_status || (data.anomaly_detected ? 'Critical' : 'Normal'),
        abnormal_parameters: Array.isArray(data.abnormal_parameters) ? data.abnormal_parameters : [],
        severity: data.severity || (data.anomaly_detected ? 'Critical' : 'Normal'),
        explanation: data.explanation || (data.anomaly_detected ? 'Operational threshold exceeded' : 'All parameters nominal'),
        recommended_action: data.recommended_action || (data.anomaly_detected ? 'Inspect station immediately' : ''),
        alert_sent: Boolean(data.alert_sent),
        overall_status: data.overall_status,
        machine_analysis: data.machine_analysis,
        production_analysis: data.production_analysis,
        quality_analysis: data.quality_analysis,
        alerts: data.alerts,
        recommendations: data.recommendations,
        raw: data,
      };
    }

    return {
      machine_id: fallbackInput.machine_id,
      production_line: fallbackInput.production_line || '',
      timestamp: fallbackInput.timestamp || '',
      temperature: fallbackInput.temperature,
      vibration: fallbackInput.vibration,
      anomaly_detected: false,
      machine_status: 'Normal',
      abnormal_parameters: [],
      severity: 'Normal',
      explanation: 'All parameters nominal',
      recommended_action: '',
      alert_sent: false,
      raw: data,
    };
  },
};

// Aliased export for compatibility
export const backendService = driveopsBackendService;
