/**
 * DriveOps-AI Backend Domain Models and Types
 */

export type MachineStatus = 'Running' | 'Attention' | 'Down' | 'Maintenance';
export type OverallStatus = 'Healthy' | 'Watch' | 'At risk';
export type Severity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Normal';

/**
 * Raw structured manufacturing data input (JSON or parsed CSV)
 */
export interface ManufacturingRecordInput {
  machine_id: string;
  production_line?: string;
  timestamp?: string;
  temperature?: number;
  vibration?: number;
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

/**
 * Result of Machine Telemetry Analysis
 */
export interface MachineAnalysisResult {
  machine_id: string;
  status: MachineStatus;
  detected_issues: string[];
  severity: Severity;
  explanation: string;
  recommended_action: string;
  abnormal_parameters: string[];
  metrics: {
    temperature: number;
    vibration: number;
    pressure?: number;
    power_consumption?: number;
  };
}

/**
 * Result of Production Pace & Target Analysis
 */
export interface ProductionAnalysisResult {
  production_line: string;
  production_status: 'On Target' | 'Minor Gap' | 'Critical Behind' | 'Exceeding';
  production_target: number;
  production_actual: number;
  production_gap: number;
  production_performance: number; // percentage (e.g. 96.5)
  severity: Severity;
  explanation: string;
  recommended_action: string;
}

/**
 * Result of Quality & Defect Analysis
 */
export interface QualityAnalysisResult {
  production_line: string;
  quality_status: 'Optimal' | 'Degraded' | 'Critical Defect Spike';
  quality_rate: number;
  defect_count: number;
  defect_type?: string;
  severity: Severity;
  explanation: string;
  recommended_action: string;
}

/**
 * Alert Record matching the database schema
 */
export interface AlertRecord {
  alert_id: string;
  machine_id: string;
  production_line: string;
  timestamp: string;
  alert_type: string;
  severity: Severity;
  message: string;
  recommended_action: string;
  status: 'open' | 'acknowledged' | 'resolved';
}

/**
 * Unified Manufacturing Analysis combining Machine + Production + Quality
 * Fully compatible with the frontend expectations!
 */
export interface OverallManufacturingAnalysis {
  overall_status: 'Healthy' | 'Attention Required' | 'Critical Action Required';
  anomaly_detected: boolean;
  machine_id: string;
  production_line: string;
  timestamp: string;
  temperature: number;
  vibration: number;
  machine_status: string;
  abnormal_parameters: string[];
  severity: string;
  explanation: string;
  recommended_action: string;
  alert_sent: boolean;
  
  // Detailed modular analysis sub-objects
  machine_analysis: MachineAnalysisResult;
  production_analysis: ProductionAnalysisResult;
  quality_analysis: QualityAnalysisResult;
  alerts: AlertRecord[];
  recommendations: string[];

  // Diagnostic metadata
  ai_synthesized?: boolean;
}

/**
 * Fleet Machine representation
 */
export interface Machine {
  machine_id: string;
  name: string;
  production_line: string;
  machine_status: MachineStatus;
  overall_status: OverallStatus;
  utilization: number;
  quality_rate: number;
  cycle_time: number;
  target_cycle_time: number;
  runtime: string;
  last_service: string;
  next_service: string;
  detected_issues?: string[];
}

/**
 * Operational Insight representation
 */
export interface Insight {
  id: string;
  type: 'Quality' | 'Production' | 'Maintenance';
  machine_id?: string;
  most_important_issue: string;
  explanation: string;
  recommended_action: string;
  confidence: number;
  impact: string;
}

/**
 * Line Readiness Item representation
 */
export interface LineReadinessItem {
  name: string;
  score: string;
  machinesReady: string;
  status: 'Healthy' | 'Watch' | 'At risk';
}

/**
 * Aggregate shift production metrics
 */
export interface ManufacturingMetrics {
  unitsProduced: number;
  unitsPace: string;
  productionHealth: number;
  qualityRate: number;
  openAlertsCount: number;
  criticalAlertsCount: number;
}

export interface ShiftReport {
  report_id: string;
  generated_at: string;
  shift_name: string;
  line_name?: string;
  metrics: {
    target_units: number;
    actual_units: number;
    achievement_rate: number;
    quality_rate: number;
    total_defects: number;
    active_alarms: number;
  };
  handoff_priorities: Array<{
    station: string;
    issue: string;
    severity: Severity;
    action: string;
  }>;
}

export interface ProcessedDataset {
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
    alerts_generated?: number;
  };
  anomalies: any[];
  records: ManufacturingRecordInput[];
}

export type DatasetProcessingStatus = 'uploaded' | 'processing' | 'completed' | 'failed';
export type AnalysisStatus = 'idle' | 'running' | 'completed' | 'failed';

export interface DatasetRecord {
  dataset_id: string;
  filename: string;
  file_size: number;
  uploaded_at: string;
  row_count: number;
  processing_status: DatasetProcessingStatus;
  analysis_status: AnalysisStatus;
  analysis_completion_timestamp?: string;
  dataset_hash: string;
  error_message?: string;
}

export interface AnalysisRun {
  analysis_id: string;
  dataset_id: string;
  status: AnalysisStatus;
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
  anomalies: any[];
  summary: any;
  explanation: string;
}

export interface ActiveDatasetResponse {
  active: boolean;
  dataset: DatasetRecord | null;
  analysis: AnalysisRun | null;
  anomalies: any[];
  recordsPreview: ManufacturingRecordInput[];
  summary?: any;
}

