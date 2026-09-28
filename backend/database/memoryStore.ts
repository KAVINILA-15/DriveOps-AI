import fs from 'fs';
import path from 'path';
import type {
  Machine,
  AlertRecord,
  Insight,
  LineReadinessItem,
  ManufacturingMetrics,
  ManufacturingRecordInput,
  ProcessedDataset,
  DatasetRecord,
  AnalysisRun,
  ActiveDatasetResponse,
} from '../models/types';
import type { AnomalyEvaluationResult } from '../analysis/anomalyDetector';

/**
 * Seed data matching DriveOps-AI baseline
 */
const initialMachines: Machine[] = [
  { machine_id: 'M-204', name: 'Press Cell 04', production_line: 'Body Line A', machine_status: 'Attention', overall_status: 'Watch', utilization: 81, quality_rate: 97.8, cycle_time: 42.6, target_cycle_time: 40, runtime: '18h 42m', last_service: '08 Feb 2024', next_service: '18 Feb 2024', detected_issues: ['Cycle time drifting', 'Hydraulic pressure'] },
  { machine_id: 'M-117', name: 'Weld Robot 17', production_line: 'Body Line A', machine_status: 'Running', overall_status: 'Healthy', utilization: 94, quality_rate: 99.1, cycle_time: 38.2, target_cycle_time: 40, runtime: '22h 08m', last_service: '30 Jan 2024', next_service: '22 Feb 2024' },
  { machine_id: 'M-089', name: 'Paint Booth 02', production_line: 'Paint Line C', machine_status: 'Running', overall_status: 'Healthy', utilization: 88, quality_rate: 98.7, cycle_time: 56.1, target_cycle_time: 58, runtime: '16h 31m', last_service: '04 Feb 2024', next_service: '25 Feb 2024' },
  { machine_id: 'M-312', name: 'Torque Station 12', production_line: 'Final Assembly', machine_status: 'Down', overall_status: 'At risk', utilization: 0, quality_rate: 94.2, cycle_time: 0, target_cycle_time: 46, runtime: '0h 19m', last_service: '12 Jan 2024', next_service: '12 Feb 2024', detected_issues: ['Motor temperature high', 'Unplanned stop'] },
  { machine_id: 'M-052', name: 'Sealant Applicator 05', production_line: 'Final Assembly', machine_status: 'Maintenance', overall_status: 'Watch', utilization: 42, quality_rate: 96.6, cycle_time: 49.4, target_cycle_time: 47, runtime: '8h 12m', last_service: '06 Feb 2024', next_service: '06 Mar 2024', detected_issues: ['Scheduled maintenance'] },
  { machine_id: 'M-141', name: 'Vision Inspect 01', production_line: 'Quality Gate', machine_status: 'Running', overall_status: 'Healthy', utilization: 91, quality_rate: 99.5, cycle_time: 22.4, target_cycle_time: 23, runtime: '20h 56m', last_service: '01 Feb 2024', next_service: '01 Mar 2024' },
  { machine_id: 'M-226', name: 'Laser Marker 06', production_line: 'Final Assembly', machine_status: 'Running', overall_status: 'Healthy', utilization: 86, quality_rate: 98.2, cycle_time: 31.7, target_cycle_time: 32, runtime: '19h 10m', last_service: '05 Feb 2024', next_service: '05 Mar 2024' },
  { machine_id: 'M-074', name: 'Conveyor Drive 03', production_line: 'Body Line B', machine_status: 'Attention', overall_status: 'Watch', utilization: 77, quality_rate: 97.1, cycle_time: 44.9, target_cycle_time: 43, runtime: '14h 34m', last_service: '28 Jan 2024', next_service: '14 Feb 2024', detected_issues: ['Vibration above baseline'] },
];

const initialAlerts: AlertRecord[] = [
  { alert_id: 'ALT-482', machine_id: 'M-312', production_line: 'Final Assembly', timestamp: '8 min ago', alert_type: 'Station stopped unexpectedly', severity: 'Critical', message: 'Motor temperature reached 94°C before the station stopped. Similar readings appeared twice in the last hour.', recommended_action: 'Inspect motor cooling and hold the station for maintenance clearance.', status: 'open' },
  { alert_id: 'ALT-479', machine_id: 'M-204', production_line: 'Body Line A', timestamp: '24 min ago', alert_type: 'Cycle time above target', severity: 'High', message: 'Average cycle time is 42.6 seconds, 6.5% above the line target over the last 90 minutes.', recommended_action: 'Check hydraulic pressure and review the last tooling change.', status: 'open' },
  { alert_id: 'ALT-477', machine_id: 'M-074', production_line: 'Body Line B', timestamp: '41 min ago', alert_type: 'Vibration trend rising', severity: 'Medium', message: 'Vibration is 18% above its seven-day baseline, but the drive is still running within limits.', recommended_action: 'Schedule a bearing inspection during the next planned pause.', status: 'open' },
  { alert_id: 'ALT-468', machine_id: 'M-052', production_line: 'Final Assembly', timestamp: '2h ago', alert_type: 'Maintenance window active', severity: 'Low', message: 'The machine is operating at reduced pace while a planned service task is in progress.', recommended_action: 'Confirm the service checklist before returning to standard pace.', status: 'acknowledged' },
];

const initialInsights: Insight[] = [
  { id: 'INS-18', type: 'Production', machine_id: 'M-204', most_important_issue: 'Body Line A is losing 6–8 minutes per hour at Press Cell 04.', explanation: 'Cycle time has drifted above target after the last tooling change. The drift is isolated to one station, so the line can recover without a full stop.', recommended_action: 'Have a supervisor verify hydraulic pressure and tooling alignment at the next safe handoff.', confidence: 94, impact: 'Estimated 38 units at risk per shift' },
  { id: 'INS-17', type: 'Quality', machine_id: 'M-141', most_important_issue: 'Seal alignment defects are clustering around Final Assembly.', explanation: 'Defects are up 2.1 points week over week and are concentrated on the late shift. Vision Inspect 01 is detecting a consistent edge pattern.', recommended_action: 'Review sealant application on M-052 and sample the next 20 units after maintenance release.', confidence: 88, impact: 'Quality rate could fall below 97%' },
  { id: 'INS-16', type: 'Maintenance', machine_id: 'M-312', most_important_issue: 'Torque Station 12 requires a controlled restart.', explanation: 'The station stopped after a temperature spike. Repeated temperature rise makes a simple reset unlikely to hold through the next run.', recommended_action: 'Inspect motor cooling, record the root cause, then release the station with a first-piece check.', confidence: 97, impact: 'Line output paused' },
];

const initialLineReadiness: LineReadinessItem[] = [
  { name: 'Body Line A', score: '97.4%', machinesReady: '42 / 44', status: 'Healthy' },
  { name: 'Body Line B', score: '91.8%', machinesReady: '31 / 35', status: 'Watch' },
  { name: 'Paint Line C', score: '98.6%', machinesReady: '28 / 28', status: 'Healthy' },
  { name: 'Final Assembly', score: '86.2%', machinesReady: '35 / 41', status: 'At risk' },
];

class MemoryStore {
  private machines: Map<string, Machine> = new Map();
  private alerts: Map<string, AlertRecord> = new Map();
  private insights: Map<string, Insight> = new Map();
  private lineReadiness: LineReadinessItem[] = [...initialLineReadiness];
  private datasets: Map<string, ProcessedDataset> = new Map();
  private datasetRecordsMap: Map<string, DatasetRecord> = new Map();
  private datasetHashToId: Map<string, string> = new Map();
  private analysisRuns: Map<string, AnalysisRun> = new Map();
  private rawRecords: Map<string, ManufacturingRecordInput[]> = new Map();
  private activeDatasetId: string | null = null;
  private activeDataset: ProcessedDataset | null = null;
  private stateFilePath: string = path.resolve(process.cwd(), 'backend', 'database', 'store_state.json');

  constructor() {
    this.reset();
    this.loadFromDisk();
  }

  public reset() {
    this.machines.clear();
    initialMachines.forEach((m) => this.machines.set(m.machine_id, { ...m }));

    this.alerts.clear();
    initialAlerts.forEach((a) => this.alerts.set(a.alert_id, { ...a }));

    this.insights.clear();
    initialInsights.forEach((i) => this.insights.set(i.id, { ...i }));

    this.lineReadiness = [...initialLineReadiness];
    this.datasets.clear();
    this.datasetRecordsMap.clear();
    this.datasetHashToId.clear();
    this.analysisRuns.clear();
    this.rawRecords.clear();
    this.activeDatasetId = null;
    this.activeDataset = null;
  }

  private persistToDisk() {
    try {
      const dir = path.dirname(this.stateFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const state = {
        activeDatasetId: this.activeDatasetId,
        activeDataset: this.activeDataset,
        datasets: Array.from(this.datasetRecordsMap.entries()),
        hashToId: Array.from(this.datasetHashToId.entries()),
        analysisRuns: Array.from(this.analysisRuns.entries()),
        processedDatasets: Array.from(this.datasets.entries()),
        rawRecords: Array.from(this.rawRecords.entries()),
        machines: Array.from(this.machines.entries()),
        alerts: Array.from(this.alerts.entries()),
        insights: Array.from(this.insights.entries()),
        lineReadiness: this.lineReadiness,
      };
      fs.writeFileSync(this.stateFilePath, JSON.stringify(state, null, 2), 'utf8');
    } catch (err) {
      console.warn('[MemoryStore] Failed to persist state to disk:', err);
    }
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.stateFilePath)) {
        const raw = fs.readFileSync(this.stateFilePath, 'utf8');
        const state = JSON.parse(raw);
        if (state.datasets) this.datasetRecordsMap = new Map(state.datasets);
        if (state.hashToId) this.datasetHashToId = new Map(state.hashToId);
        if (state.analysisRuns) this.analysisRuns = new Map(state.analysisRuns);
        if (state.processedDatasets) this.datasets = new Map(state.processedDatasets);
        if (state.rawRecords) this.rawRecords = new Map(state.rawRecords);
        if (state.machines && state.machines.length > 0) this.machines = new Map(state.machines);
        if (state.alerts && state.alerts.length > 0) this.alerts = new Map(state.alerts);
        if (state.insights && state.insights.length > 0) this.insights = new Map(state.insights);
        if (state.lineReadiness) this.lineReadiness = state.lineReadiness;
        if (state.activeDataset) this.activeDataset = state.activeDataset;
        if (state.activeDatasetId) this.activeDatasetId = state.activeDatasetId;
        console.log('[MemoryStore] Successfully restored persistent datasets and fleet from disk');
      }
    } catch (err) {
      console.warn('[MemoryStore] Failed to load state from disk:', err);
    }
  }

  // --- DATASET STORAGE & RETRIEVAL ---

  public getDatasetById(datasetId: string): DatasetRecord | undefined {
    return this.datasetRecordsMap.get(datasetId);
  }

  public getDatasetRecordByHash(hash: string): DatasetRecord | undefined {
    const id = this.datasetHashToId.get(hash);
    return id ? this.datasetRecordsMap.get(id) : undefined;
  }

  public getDatasetByHash(hash: string): ProcessedDataset | undefined {
    return this.datasets.get(hash);
  }

  public getAnalysisRun(datasetId: string): AnalysisRun | undefined {
    return this.analysisRuns.get(datasetId);
  }

  public getDatasetRecords(datasetId: string): ManufacturingRecordInput[] | undefined {
    return this.rawRecords.get(datasetId) || this.activeDataset?.records;
  }

  public getActiveDatasetId(): string | null {
    return this.activeDatasetId;
  }

  public getActiveDataset(): ProcessedDataset | null {
    return this.activeDataset;
  }

  public getActiveDatasetInfo(): ActiveDatasetResponse {
    if (!this.activeDatasetId && !this.activeDataset) {
      return {
        active: false,
        dataset: null,
        analysis: null,
        anomalies: [],
        recordsPreview: [],
      };
    }

    const currentId = this.activeDatasetId || this.activeDataset?.dataset_id || '';
    const dataset = this.datasetRecordsMap.get(currentId);
    const analysis = this.analysisRuns.get(currentId);
    const records = this.rawRecords.get(currentId) || this.activeDataset?.records || [];

    const rawHash = dataset?.dataset_hash || (dataset as any)?.file_hash || this.activeDataset?.file_hash || '';
    const rawFilename = dataset?.filename || (dataset as any)?.file_name || this.activeDataset?.file_name || 'uploaded_dataset.csv';

    const effectiveDataset: any = {
      ...(dataset || {}),
      dataset_id: currentId,
      filename: rawFilename,
      file_name: rawFilename,
      file_size: dataset?.file_size || 24000,
      uploaded_at: dataset?.uploaded_at || this.activeDataset?.uploaded_at || new Date().toISOString(),
      row_count: dataset?.row_count || this.activeDataset?.total_records || records.length,
      total_records: dataset?.row_count || this.activeDataset?.total_records || records.length,
      processing_status: 'completed',
      analysis_status: 'completed',
      analysis_completion_timestamp: dataset?.analysis_completion_timestamp || this.activeDataset?.uploaded_at || new Date().toISOString(),
      dataset_hash: rawHash,
      file_hash: rawHash,
    };

    const effectiveAnalysis: AnalysisRun = analysis || {
      analysis_id: `ANL-${currentId}`,
      dataset_id: currentId,
      status: 'completed',
      started_at: this.activeDataset?.uploaded_at || new Date().toISOString(),
      completed_at: this.activeDataset?.uploaded_at || new Date().toISOString(),
      total_records: this.activeDataset?.total_records || records.length,
      anomaly_count: this.activeDataset?.anomaly_records || 0,
      normal_count: this.activeDataset?.normal_records || records.length,
      machine_issues: this.activeDataset?.machine_issues || 0,
      production_issues: this.activeDataset?.production_issues || 0,
      quality_issues: this.activeDataset?.quality_issues || 0,
      average_quality_rate: this.activeDataset?.summary.average_quality_rate || 98.4,
      production_achievement_rate: this.activeDataset?.summary.production_achievement_rate || 96.5,
      total_defects: this.activeDataset?.summary.total_defects || 0,
      alerts_count: this.activeDataset?.alerts_generated || 0,
      anomalies: this.activeDataset?.anomalies || [],
      summary: this.activeDataset?.summary,
      explanation: `Deterministic analysis evaluated ${this.activeDataset?.total_records || records.length} records.`,
    };

    return {
      active: true,
      dataset: effectiveDataset,
      analysis: effectiveAnalysis,
      anomalies: this.activeDataset?.anomalies || effectiveAnalysis.anomalies || [],
      recordsPreview: records.slice(0, 100),
      summary: this.activeDataset?.summary || effectiveAnalysis.summary,
    };
  }

  public deleteDataset(datasetId: string): boolean {
    const dataset = this.datasetRecordsMap.get(datasetId);
    const hash = dataset?.dataset_hash || this.activeDataset?.file_hash;

    this.datasetRecordsMap.delete(datasetId);
    this.analysisRuns.delete(datasetId);
    this.rawRecords.delete(datasetId);
    if (hash) {
      this.datasetHashToId.delete(hash);
      this.datasets.delete(hash);
    }

    if (this.activeDatasetId === datasetId || this.activeDataset?.dataset_id === datasetId || !datasetId) {
      this.activeDatasetId = null;
      this.activeDataset = null;

      // Restore default initial state for machines, alerts, insights, readiness
      this.machines.clear();
      initialMachines.forEach((m) => this.machines.set(m.machine_id, { ...m }));

      this.alerts.clear();
      initialAlerts.forEach((a) => this.alerts.set(a.alert_id, { ...a }));

      this.insights.clear();
      initialInsights.forEach((i) => this.insights.set(i.id, { ...i }));

      this.lineReadiness = [...initialLineReadiness];
    }

    this.persistToDisk();
    return true;
  }

  /**
   * Save and apply a processed dataset to the entire system.
   * This updates the machines fleet, alerts queue, line readiness, and dashboard statistics deterministically.
   */
  public saveDataset(dataset: ProcessedDataset): void {
    this.datasets.set(dataset.file_hash, dataset);
    this.activeDataset = dataset;
    this.activeDatasetId = dataset.dataset_id;

    const datasetRecord: any = {
      dataset_id: dataset.dataset_id,
      filename: dataset.file_name,
      file_name: dataset.file_name,
      file_size: Buffer.byteLength(JSON.stringify(dataset.records || []), 'utf8'),
      uploaded_at: dataset.uploaded_at,
      row_count: dataset.total_records,
      total_records: dataset.total_records,
      processing_status: 'completed',
      analysis_status: 'completed',
      analysis_completion_timestamp: new Date().toISOString(),
      dataset_hash: dataset.file_hash,
      file_hash: dataset.file_hash,
    };

    const analysisRun: AnalysisRun = {
      analysis_id: `ANL-${dataset.dataset_id}`,
      dataset_id: dataset.dataset_id,
      status: 'completed',
      started_at: dataset.uploaded_at,
      completed_at: new Date().toISOString(),
      total_records: dataset.total_records,
      anomaly_count: dataset.anomaly_records,
      normal_count: dataset.normal_records,
      machine_issues: dataset.machine_issues,
      production_issues: dataset.production_issues,
      quality_issues: dataset.quality_issues,
      average_quality_rate: dataset.summary.average_quality_rate,
      production_achievement_rate: dataset.summary.production_achievement_rate,
      total_defects: dataset.summary.total_defects,
      alerts_count: dataset.alerts_generated,
      anomalies: dataset.anomalies,
      summary: dataset.summary,
      explanation: `Deterministic analysis evaluated ${dataset.total_records} manufacturing records. Found ${dataset.anomaly_records} anomalies.`,
    };

    this.datasetRecordsMap.set(dataset.dataset_id, datasetRecord);
    this.datasetHashToId.set(dataset.file_hash, dataset.dataset_id);
    this.analysisRuns.set(dataset.dataset_id, analysisRun);
    this.rawRecords.set(dataset.dataset_id, dataset.records);

    // 1. Group records by machine_id to calculate real machine statistics
    const machineGroups: Map<string, ManufacturingRecordInput[]> = new Map();
    for (const r of dataset.records) {
      const mid = r.machine_id;
      if (!machineGroups.has(mid)) {
        machineGroups.set(mid, []);
      }
      machineGroups.get(mid)!.push(r);
    }

    // Map anomalies by machine_id
    const machineAnomalies: Map<string, AnomalyEvaluationResult[]> = new Map();
    for (const a of dataset.anomalies) {
      if (!machineAnomalies.has(a.machine_id)) {
        machineAnomalies.set(a.machine_id, []);
      }
      machineAnomalies.get(a.machine_id)!.push(a);
    }

    // 2. Update Machines Fleet with actual calculated values
    for (const [mid, records] of machineGroups.entries()) {
      const anomalies = machineAnomalies.get(mid) || [];
      const hasCritical = anomalies.some((a) => a.severity === 'Critical');
      const hasWarning = anomalies.some((a) => a.severity === 'High' || a.severity === 'Medium');

      const status = hasCritical ? 'Down' : hasWarning ? 'Attention' : 'Running';
      const overall = hasCritical ? 'At risk' : hasWarning ? 'Watch' : 'Healthy';

      // Calculate averages from actual records
      let totalActual = 0;
      let totalTarget = 0;
      let totalQuality = 0;
      let validQualityCount = 0;

      for (const r of records) {
        if (r.production_actual !== undefined) totalActual += Number(r.production_actual);
        if (r.production_target !== undefined) totalTarget += Number(r.production_target);
        if (r.quality_rate !== undefined) {
          totalQuality += Number(r.quality_rate);
          validQualityCount++;
        }
      }

      const utilization = totalTarget > 0 ? Math.min(100, Math.round((totalActual / totalTarget) * 100)) : 90;
      const qualityRate = validQualityCount > 0 ? Math.round((totalQuality / validQualityCount) * 10) / 10 : 98.5;

      const detectedIssues = Array.from(
        new Set(anomalies.flatMap((a) => a.reasons))
      ).slice(0, 3);

      const existing = this.machines.get(mid);
      const line = records[0]?.production_line || existing?.production_line || 'Body Line A';

      this.machines.set(mid, {
        machine_id: mid,
        name: existing?.name || `Station ${mid}`,
        production_line: line,
        machine_status: status,
        overall_status: overall,
        utilization,
        quality_rate: qualityRate,
        cycle_time: existing?.cycle_time || 40,
        target_cycle_time: existing?.target_cycle_time || 40,
        runtime: `${Math.min(24, Math.max(1, Math.round(records.length / 10)))}h 00m`,
        last_service: existing?.last_service || '12 Jan 2024',
        next_service: existing?.next_service || '12 Feb 2024',
        detected_issues: detectedIssues.length > 0 ? detectedIssues : undefined,
      });
    }

    // 3. Clear existing alerts and populate strictly from the dataset's anomalies
    this.alerts.clear();
    const hashShort = dataset.file_hash.substring(0, 6).toUpperCase();

    for (let i = 0; i < dataset.anomalies.length; i++) {
      const a = dataset.anomalies[i];
      const alertId = `ALT-${a.machine_id}-${hashShort}-${a.row_index}`;

      this.alerts.set(alertId, {
        alert_id: alertId,
        machine_id: a.machine_id,
        production_line: a.production_line,
        timestamp: a.timestamp || 'Just now',
        alert_type: a.reasons[0] || `${a.machine_id} Operational Anomaly`,
        severity: a.severity,
        message: a.explanation,
        recommended_action: a.recommended_action,
        status: 'open',
      });
    }

    // 4. Update Line Readiness based on actual machine states
    const lines = ['Body Line A', 'Body Line B', 'Paint Line C', 'Final Assembly', 'Quality Gate'];
    const updatedReadiness: LineReadinessItem[] = [];

    for (const lineName of lines) {
      const lineMachines = Array.from(this.machines.values()).filter(
        (m) => m.production_line.toLowerCase() === lineName.toLowerCase()
      );

      if (lineMachines.length > 0) {
        const healthyCount = lineMachines.filter((m) => m.machine_status === 'Running').length;
        const total = lineMachines.length;
        const pct = Math.round((healthyCount / total) * 100);

        updatedReadiness.push({
          name: lineName,
          score: `${pct}%`,
          machinesReady: `${healthyCount} / ${total}`,
          status: pct >= 90 ? 'Healthy' : pct >= 75 ? 'Watch' : 'At risk',
        });
      }
    }

    if (updatedReadiness.length > 0) {
      this.lineReadiness = updatedReadiness;
    }

    // 5. Generate deterministic operational insights from the dataset anomalies
    this.insights.clear();
    const machineIssues = dataset.anomalies.filter((a) => a.machine_issue);
    const prodIssues = dataset.anomalies.filter((a) => a.production_issue);
    const qualIssues = dataset.anomalies.filter((a) => a.quality_issue);

    if (machineIssues.length > 0) {
      const top = machineIssues[0];
      this.insights.set('INS-MAC-1', {
        id: 'INS-MAC-1',
        type: 'Maintenance',
        machine_id: top.machine_id,
        most_important_issue: `Critical parameter threshold exceeded on ${top.machine_id}.`,
        explanation: top.explanation,
        recommended_action: top.recommended_action,
        confidence: 96,
        impact: `${machineIssues.length} station readings exceeded operating tolerances`,
      });
    }

    if (prodIssues.length > 0) {
      const top = prodIssues[0];
      this.insights.set('INS-PRD-1', {
        id: 'INS-PRD-1',
        type: 'Production',
        machine_id: top.machine_id,
        most_important_issue: `Throughput shortfall identified on ${top.production_line}.`,
        explanation: top.explanation,
        recommended_action: top.recommended_action,
        confidence: 94,
        impact: `${prodIssues.length} shift intervals recorded production gap`,
      });
    }

    if (qualIssues.length > 0) {
      const top = qualIssues[0];
      this.insights.set('INS-QAL-1', {
        id: 'INS-QAL-1',
        type: 'Quality',
        machine_id: top.machine_id,
        most_important_issue: `Quality variance detected on ${top.production_line}.`,
        explanation: top.explanation,
        recommended_action: top.recommended_action,
        confidence: 92,
        impact: `${qualIssues.length} defect excursions recorded in dataset`,
      });
    }
  }

  // --- QUERY METHODS ---

  public getMachines(): Machine[] {
    return Array.from(this.machines.values());
  }

  public getMachine(id: string): Machine | undefined {
    return this.machines.get(id);
  }

  public getAlerts(): AlertRecord[] {
    return Array.from(this.alerts.values());
  }

  public acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.status = 'acknowledged';
      return true;
    }
    return false;
  }

  public getInsights(): Insight[] {
    return Array.from(this.insights.values());
  }

  public getLineReadiness(): LineReadinessItem[] {
    return [...this.lineReadiness];
  }

  public getMetrics(): ManufacturingMetrics {
    return this.getDashboardMetrics();
  }

  public getDashboardMetrics(): ManufacturingMetrics & {
    total_records?: number;
    normal_records?: number;
    anomaly_count?: number;
    total_defects?: number;
    dataset_name?: string;
  } {
    const allAlerts = Array.from(this.alerts.values());
    const openAlerts = allAlerts.filter((a) => a.status === 'open').length;
    const criticalAlerts = allAlerts.filter((a) => a.severity === 'Critical').length;

    if (this.activeDataset) {
      const summary = this.activeDataset.summary;
      let totalActual = 0;
      for (const r of this.activeDataset.records) {
        if (r.production_actual !== undefined) totalActual += Number(r.production_actual);
      }

      return {
        total_records: summary.total_records,
        normal_records: summary.normal_records,
        anomaly_count: summary.anomaly_count,
        unitsProduced: totalActual > 0 ? totalActual : 4826,
        unitsPace: '+14/h',
        productionHealth: summary.production_achievement_rate,
        qualityRate: summary.average_quality_rate,
        openAlertsCount: openAlerts,
        criticalAlertsCount: criticalAlerts,
        total_defects: summary.total_defects,
        dataset_name: this.activeDataset.file_name,
      };
    }

    return {
      total_records: 300,
      normal_records: 283,
      anomaly_count: 17,
      unitsProduced: 4826,
      unitsPace: '+14/h',
      productionHealth: 94.2,
      qualityRate: 98.4,
      openAlertsCount: openAlerts,
      criticalAlertsCount: criticalAlerts,
      total_defects: 12,
    };
  }

  public getProductionStats() {
    if (this.activeDataset) {
      let target = 0;
      let actual = 0;
      const lineMap: Map<string, { target: number; actual: number }> = new Map();

      for (const r of this.activeDataset.records) {
        const t = Number(r.production_target) || 0;
        const a = Number(r.production_actual) || 0;
        target += t;
        actual += a;

        const line = r.production_line || 'Body Line A';
        if (!lineMap.has(line)) lineMap.set(line, { target: 0, actual: 0 });
        lineMap.get(line)!.target += t;
        lineMap.get(line)!.actual += a;
      }

      const achievementRate = target > 0 ? Math.round((actual / target) * 1000) / 10 : 96.5;
      const lines = Array.from(lineMap.entries()).map(([line, val]) => ({
        line,
        target: val.target,
        actual: val.actual,
        gap: val.target - val.actual,
        achievement_rate: val.target > 0 ? Math.round((val.actual / val.target) * 1000) / 10 : 100,
      }));

      return {
        total_target: target,
        total_actual: actual,
        total_gap: target - actual,
        achievement_rate: achievementRate,
        lines,
      };
    }

    return {
      total_target: 5000,
      total_actual: 4826,
      total_gap: 174,
      achievement_rate: 96.5,
      lines: [
        { line: 'Body Line A', target: 2000, actual: 1940, gap: 60, achievement_rate: 97.0 },
        { line: 'Body Line B', target: 1500, actual: 1420, gap: 80, achievement_rate: 94.7 },
        { line: 'Final Assembly', target: 1500, actual: 1466, gap: 34, achievement_rate: 97.7 },
      ],
    };
  }

  public getQualityStats() {
    if (this.activeDataset) {
      let totalQuality = 0;
      let validCount = 0;
      let totalDefects = 0;
      const defectTypes: Map<string, number> = new Map();

      for (const r of this.activeDataset.records) {
        if (r.quality_rate !== undefined) {
          totalQuality += Number(r.quality_rate);
          validCount++;
        }
        if (r.defect_count !== undefined) {
          totalDefects += Number(r.defect_count);
        }
        if (r.defect_type) {
          defectTypes.set(r.defect_type, (defectTypes.get(r.defect_type) || 0) + (Number(r.defect_count) || 1));
        }
      }

      return {
        average_quality_rate: validCount > 0 ? Math.round((totalQuality / validCount) * 10) / 10 : 98.4,
        total_defects: totalDefects,
        defect_breakdown: Array.from(defectTypes.entries()).map(([type, count]) => ({ type, count })),
      };
    }

    return {
      average_quality_rate: 98.4,
      total_defects: 12,
      defect_breakdown: [
        { type: 'Weld Porosity', count: 5 },
        { type: 'Seal Misalignment', count: 4 },
        { type: 'Surface Scratch', count: 3 },
      ],
    };
  }
}

export const memoryStore = new MemoryStore();
