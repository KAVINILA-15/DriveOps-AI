import type {
  ManufacturingRecordInput,
  MachineAnalysisResult,
  ProductionAnalysisResult,
  QualityAnalysisResult,
  OverallManufacturingAnalysis,
  AlertRecord,
  Severity,
} from '../models/types';
import { analyzeMachineTelemetry } from './machineEngine';
import { analyzeProductionPerformance } from './productionEngine';
import { analyzeQualityTelemetry } from './qualityEngine';

/**
 * Synthesizes Machine + Production + Quality into a unified manufacturing intelligence result
 */
export function synthesizeOverallAnalysis(
  record: ManufacturingRecordInput,
  machineAnalysis?: MachineAnalysisResult,
  productionAnalysis?: ProductionAnalysisResult,
  qualityAnalysis?: QualityAnalysisResult
): OverallManufacturingAnalysis {
  const machine = machineAnalysis || analyzeMachineTelemetry(record);
  const production = productionAnalysis || analyzeProductionPerformance(record);
  const quality = qualityAnalysis || analyzeQualityTelemetry(record);

  const timestamp = record.timestamp || new Date().toISOString();
  const machineId = record.machine_id;
  const line = record.production_line || machine.metrics.pressure ? 'Body Line A' : 'Final Assembly';

  // Determine highest severity across all three dimensions
  const severities: Severity[] = [machine.severity, production.severity, quality.severity];
  const hasCritical = severities.includes('Critical');
  const hasHigh = severities.includes('High');
  const hasMedium = severities.includes('Medium');

  let overallStatus: 'Healthy' | 'Attention Required' | 'Critical Action Required' = 'Healthy';
  let overallSeverity = 'Normal';
  let anomalyDetected = false;

  if (hasCritical) {
    overallStatus = 'Critical Action Required';
    overallSeverity = 'Critical';
    anomalyDetected = true;
  } else if (hasHigh) {
    overallStatus = 'Attention Required';
    overallSeverity = 'High';
    anomalyDetected = true;
  } else if (hasMedium) {
    overallStatus = 'Attention Required';
    overallSeverity = 'Medium';
    anomalyDetected = true;
  }

  // Generate Alerts when anomalies exist
  const alerts: AlertRecord[] = [];
  if (anomalyDetected) {
    const alertSeverity: Severity = hasCritical ? 'Critical' : hasHigh ? 'High' : 'Medium';
    const alertId = `ALT-${machineId}-${Date.now().toString(36).toUpperCase()}`;

    alerts.push({
      alert_id: alertId,
      machine_id: machineId,
      production_line: line,
      timestamp: 'Just now',
      alert_type: machine.abnormal_parameters.length > 0
        ? `${machineId} Anomaly · ${machine.abnormal_parameters.join(', ')}`
        : `${machineId} Condition Alert`,
      severity: alertSeverity,
      message: machine.explanation,
      recommended_action: machine.recommended_action,
      status: 'open',
    });
  }

  // Compile unified recommendations list
  const recommendations: string[] = [];
  if (machine.recommended_action && machine.recommended_action !== 'Continue normal production pace.') {
    recommendations.push(machine.recommended_action);
  }
  if (production.recommended_action && production.recommended_action !== 'Maintain current cycle pace and feed rate.') {
    recommendations.push(production.recommended_action);
  }
  if (quality.recommended_action && quality.recommended_action !== 'Continue automated visual inspection standards.') {
    recommendations.push(quality.recommended_action);
  }
  if (recommendations.length === 0) {
    recommendations.push('Maintain current operating pace and continue routine inspections.');
  }

  // Primary explanation prioritizes machine anomalies, then production, then quality
  let explanation = machine.explanation;
  if (!hasCritical && (hasHigh || hasMedium)) {
    if (machine.severity === 'High' || machine.severity === 'Medium') {
      explanation = machine.explanation;
    } else if (production.severity === 'High') {
      explanation = production.explanation;
    } else if (quality.severity === 'High') {
      explanation = quality.explanation;
    }
  }

  return {
    overall_status: overallStatus,
    anomaly_detected: anomalyDetected,
    machine_id: machineId,
    production_line: line,
    timestamp,
    temperature: machine.metrics.temperature,
    vibration: machine.metrics.vibration,
    machine_status: machine.status,
    abnormal_parameters: machine.abnormal_parameters,
    severity: overallSeverity,
    explanation,
    recommended_action: machine.recommended_action,
    alert_sent: false,
    machine_analysis: machine,
    production_analysis: production,
    quality_analysis: quality,
    alerts,
    recommendations,
  };
}
