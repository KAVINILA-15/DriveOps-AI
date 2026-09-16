export type MachineStatus = 'Running' | 'Attention' | 'Down' | 'Maintenance';
export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';

/** Stable result shape for the future facility API. Every field is optional because
 * different source systems may only provide a subset of the manufacturing signal. */
export type ManufacturingResult = {
  machine_id?: string;
  production_line?: string;
  timestamp?: string;
  machine_status?: MachineStatus;
  detected_issues?: string[];
  severity?: Severity;
  production_status?: string;
  production_gap?: number;
  quality_status?: string;
  quality_rate?: number;
  defect_count?: number;
  overall_status?: string;
  critical_issues?: string[];
  attention_areas?: string[];
  most_important_issue?: string;
  explanation?: string;
  recommended_action?: string;
  alert_required?: boolean;
};

export type Machine = {
  machine_id: string;
  name: string;
  production_line: string;
  machine_status: MachineStatus;
  overall_status: 'Healthy' | 'Watch' | 'At risk';
  utilization: number;
  quality_rate: number;
  cycle_time: number;
  target_cycle_time: number;
  runtime: string;
  last_service: string;
  next_service: string;
  detected_issues?: string[];
};

export type Alert = {
  id: string;
  machine_id: string;
  machine: string;
  production_line: string;
  timestamp: string;
  severity: Severity;
  title: string;
  explanation: string;
  recommended_action: string;
  alert_required: boolean;
  acknowledged: boolean;
};

export type Insight = {
  id: string;
  type: 'Quality' | 'Production' | 'Maintenance';
  machine_id?: string;
  most_important_issue: string;
  explanation: string;
  recommended_action: string;
  confidence: number;
  impact: string;
};

export const machines: Machine[] = [
  { machine_id: 'M-204', name: 'Press Cell 04', production_line: 'Body Line A', machine_status: 'Attention', overall_status: 'Watch', utilization: 81, quality_rate: 97.8, cycle_time: 42.6, target_cycle_time: 40, runtime: '18h 42m', last_service: '08 Feb 2024', next_service: '18 Feb 2024', detected_issues: ['Cycle time drifting', 'Hydraulic pressure'] },
  { machine_id: 'M-117', name: 'Weld Robot 17', production_line: 'Body Line A', machine_status: 'Running', overall_status: 'Healthy', utilization: 94, quality_rate: 99.1, cycle_time: 38.2, target_cycle_time: 40, runtime: '22h 08m', last_service: '30 Jan 2024', next_service: '22 Feb 2024' },
  { machine_id: 'M-089', name: 'Paint Booth 02', production_line: 'Paint Line C', machine_status: 'Running', overall_status: 'Healthy', utilization: 88, quality_rate: 98.7, cycle_time: 56.1, target_cycle_time: 58, runtime: '16h 31m', last_service: '04 Feb 2024', next_service: '25 Feb 2024' },
  { machine_id: 'M-312', name: 'Torque Station 12', production_line: 'Final Assembly', machine_status: 'Down', overall_status: 'At risk', utilization: 0, quality_rate: 94.2, cycle_time: 0, target_cycle_time: 46, runtime: '0h 19m', last_service: '12 Jan 2024', next_service: '12 Feb 2024', detected_issues: ['Motor temperature high', 'Unplanned stop'] },
  { machine_id: 'M-052', name: 'Sealant Applicator 05', production_line: 'Final Assembly', machine_status: 'Maintenance', overall_status: 'Watch', utilization: 42, quality_rate: 96.6, cycle_time: 49.4, target_cycle_time: 47, runtime: '8h 12m', last_service: '06 Feb 2024', next_service: '06 Mar 2024', detected_issues: ['Scheduled maintenance'] },
  { machine_id: 'M-141', name: 'Vision Inspect 01', production_line: 'Quality Gate', machine_status: 'Running', overall_status: 'Healthy', utilization: 91, quality_rate: 99.5, cycle_time: 22.4, target_cycle_time: 23, runtime: '20h 56m', last_service: '01 Feb 2024', next_service: '01 Mar 2024' },
  { machine_id: 'M-226', name: 'Laser Marker 06', production_line: 'Final Assembly', machine_status: 'Running', overall_status: 'Healthy', utilization: 86, quality_rate: 98.2, cycle_time: 31.7, target_cycle_time: 32, runtime: '19h 10m', last_service: '05 Feb 2024', next_service: '05 Mar 2024' },
  { machine_id: 'M-074', name: 'Conveyor Drive 03', production_line: 'Body Line B', machine_status: 'Attention', overall_status: 'Watch', utilization: 77, quality_rate: 97.1, cycle_time: 44.9, target_cycle_time: 43, runtime: '14h 34m', last_service: '28 Jan 2024', next_service: '14 Feb 2024', detected_issues: ['Vibration above baseline'] },
];

export const alerts: Alert[] = [
  { id: 'ALT-482', machine_id: 'M-312', machine: 'Torque Station 12', production_line: 'Final Assembly', timestamp: '8 min ago', severity: 'Critical', title: 'Station stopped unexpectedly', explanation: 'Motor temperature reached 94°C before the station stopped. Similar readings appeared twice in the last hour.', recommended_action: 'Inspect motor cooling and hold the station for maintenance clearance.', alert_required: true, acknowledged: false },
  { id: 'ALT-479', machine_id: 'M-204', machine: 'Press Cell 04', production_line: 'Body Line A', timestamp: '24 min ago', severity: 'High', title: 'Cycle time above target', explanation: 'Average cycle time is 42.6 seconds, 6.5% above the line target over the last 90 minutes.', recommended_action: 'Check hydraulic pressure and review the last tooling change.', alert_required: true, acknowledged: false },
  { id: 'ALT-477', machine_id: 'M-074', machine: 'Conveyor Drive 03', production_line: 'Body Line B', timestamp: '41 min ago', severity: 'Medium', title: 'Vibration trend rising', explanation: 'Vibration is 18% above its seven-day baseline, but the drive is still running within limits.', recommended_action: 'Schedule a bearing inspection during the next planned pause.', alert_required: true, acknowledged: false },
  { id: 'ALT-468', machine_id: 'M-052', machine: 'Sealant Applicator 05', production_line: 'Final Assembly', timestamp: '2h ago', severity: 'Low', title: 'Maintenance window active', explanation: 'The machine is operating at reduced pace while a planned service task is in progress.', recommended_action: 'Confirm the service checklist before returning to standard pace.', alert_required: false, acknowledged: true },
];

export const insights: Insight[] = [
  { id: 'INS-18', type: 'Production', machine_id: 'M-204', most_important_issue: 'Body Line A is losing 6–8 minutes per hour at Press Cell 04.', explanation: 'Cycle time has drifted above target after the last tooling change. The drift is isolated to one station, so the line can recover without a full stop.', recommended_action: 'Have a supervisor verify hydraulic pressure and tooling alignment at the next safe handoff.', confidence: 94, impact: 'Estimated 38 units at risk per shift' },
  { id: 'INS-17', type: 'Quality', machine_id: 'M-141', most_important_issue: 'Seal alignment defects are clustering around Final Assembly.', explanation: 'Defects are up 2.1 points week over week and are concentrated on the late shift. Vision Inspect 01 is detecting a consistent edge pattern.', recommended_action: 'Review sealant application on M-052 and sample the next 20 units after maintenance release.', confidence: 88, impact: 'Quality rate could fall below 97%' },
  { id: 'INS-16', type: 'Maintenance', machine_id: 'M-312', most_important_issue: 'Torque Station 12 requires a controlled restart.', explanation: 'The station stopped after a temperature spike. Repeated temperature rise makes a simple reset unlikely to hold through the next run.', recommended_action: 'Inspect motor cooling, record the root cause, then release the station with a first-piece check.', confidence: 97, impact: 'Line output paused' },
];

export const trend = [68, 72, 70, 76, 74, 79, 81, 78, 85, 83, 88, 86, 89, 91];
export const qualityTrend = [98.4, 98.1, 98.6, 98.3, 98.8, 98.5, 98.2, 97.9, 98.1, 98.4, 98.7, 98.5];

export const api = {
  async getDashboard() { return { machines, alerts, insights, demo: true }; },
  async getMachines() { return machines; },
  async getAlerts() { return alerts; },
  async getInsights() { return insights; },
  async exportReport() { return { ok: true, fileName: 'driveops-shift-report-demo.csv' }; },
};