/**
 * Database Schema and Column Definitions
 * Compatible with Supabase PostgreSQL and Drizzle ORM
 */

export interface DatabaseAlertRow {
  alert_id: string;
  machine_id: string;
  production_line: string;
  timestamp: string;
  alert_type: string;
  severity: string;
  message: string;
  recommended_action: string;
  status: string;
}

export interface DatabaseMachineRow {
  machine_id: string;
  name: string;
  production_line: string;
  machine_status: string;
  overall_status: string;
  utilization: number;
  quality_rate: number;
  cycle_time: number;
  target_cycle_time: number;
  runtime: string;
  last_service: string;
  next_service: string;
  detected_issues?: string[];
}

export interface DatabaseTelemetryRow {
  id: string;
  machine_id: string;
  production_line?: string;
  timestamp: string;
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
}
