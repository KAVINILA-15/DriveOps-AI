import type {
  ManufacturingRecordInput,
  OverallManufacturingAnalysis,
} from '../models/types';
import { synthesizeOverallAnalysis } from '../analysis/overallEngine';
import { aiService } from './aiService';
import { dbClient } from '../database/db';
import { memoryStore } from '../database/memoryStore';

export const overallAnalysisService = {
  /**
   * Run overall manufacturing analysis on a single record
   */
  async analyze(record: ManufacturingRecordInput): Promise<OverallManufacturingAnalysis> {
    // 1. Synthesize analysis across Machine, Production, and Quality dimensions
    let result = synthesizeOverallAnalysis(record);

    // 2. Enhance with AI LLM reasoning if configured
    result = await aiService.enhanceAnalysis(result, record);

    // 3. Persist generated alerts to database
    if (result.anomaly_detected && result.alerts.length > 0) {
      for (const alert of result.alerts) {
        await dbClient.saveAlert(alert);
      }
    }

    // 4. Update the machine in store
    const existingMachine = memoryStore.getMachine(record.machine_id);
    const issues = result.abnormal_parameters && result.abnormal_parameters.length > 0
      ? result.abnormal_parameters
      : result.anomaly_detected
      ? [`Thermal spike (${result.temperature}°C)`, `High vibration (${result.vibration} mm/s)`]
      : [];

    await dbClient.saveMachine({
      machine_id: record.machine_id,
      name: existingMachine?.name || `Station ${record.machine_id}`,
      production_line: record.production_line || existingMachine?.production_line || 'Body Line A',
      machine_status: result.anomaly_detected ? 'Down' : result.machine_status === 'Attention' ? 'Attention' : 'Running',
      overall_status: result.anomaly_detected ? 'At risk' : result.machine_status === 'Attention' ? 'Watch' : 'Healthy',
      utilization: result.anomaly_detected ? 32 : (existingMachine?.utilization || 92),
      quality_rate: record.quality_rate !== undefined ? Number(record.quality_rate) : (existingMachine?.quality_rate || 98.4),
      cycle_time: result.anomaly_detected ? 0 : (existingMachine?.cycle_time || 39.5),
      target_cycle_time: existingMachine?.target_cycle_time || 40,
      runtime: result.anomaly_detected ? '0h 14m' : (existingMachine?.runtime || '19h 40m'),
      last_service: existingMachine?.last_service || '08 Feb 2024',
      next_service: existingMachine?.next_service || '28 Feb 2024',
      detected_issues: issues.length > 0 ? issues : undefined,
    });

    // 5. Store telemetry entry
    await dbClient.saveTelemetry(record);

    return result;
  },

  /**
   * Process a batch of records
   */
  async analyzeBatch(records: ManufacturingRecordInput[]): Promise<OverallManufacturingAnalysis[]> {
    const results: OverallManufacturingAnalysis[] = [];
    for (const record of records) {
      const res = await this.analyze(record);
      results.push(res);
    }
    return results;
  },
};
