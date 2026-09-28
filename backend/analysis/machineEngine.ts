import type { ManufacturingRecordInput, MachineAnalysisResult, Severity, MachineStatus } from '../models/types';
import { THRESHOLDS } from './thresholds';

/**
 * Machine Intelligence Analysis Engine
 * Detects mechanical, thermal, vibrational, and pressure anomalies
 */
export function analyzeMachineTelemetry(record: ManufacturingRecordInput): MachineAnalysisResult {
  const machineId = record.machine_id;
  const temp = Number(record.temperature) || 0;
  const vib = Number(record.vibration) || 0;
  const pressure = record.pressure !== undefined ? Number(record.pressure) : undefined;
  const power = record.power_consumption !== undefined ? Number(record.power_consumption) : undefined;

  const abnormalParameters: string[] = [];
  const detectedIssues: string[] = [];
  let severity: Severity = 'Normal';
  let status: MachineStatus = 'Running';

  // 1. Evaluate Temperature
  if (record.temperature !== undefined) {
    if (temp >= THRESHOLDS.temperature.criticalMax) {
      severity = 'Critical';
      status = 'Down';
      abnormalParameters.push(`Thermal Spike (${temp}°C)`);
      detectedIssues.push(`Severe thermal overload: ${temp}°C exceeds critical threshold (${THRESHOLDS.temperature.criticalMax}°C)`);
    } else if (temp >= THRESHOLDS.temperature.nominalMax) {
      if (severity !== 'Critical') severity = 'High';
      if (status === 'Running') status = 'Attention';
      abnormalParameters.push(`High Temperature (${temp}°C)`);
      detectedIssues.push(`Thermal drift: ${temp}°C exceeds nominal threshold (${THRESHOLDS.temperature.nominalMax}°C)`);
    }
  }

  // 2. Evaluate Vibration
  if (record.vibration !== undefined) {
    if (vib >= THRESHOLDS.vibration.criticalMax) {
      severity = 'Critical';
      status = 'Down';
      abnormalParameters.push(`Severe Vibration (${vib} mm/s)`);
      detectedIssues.push(`Critical mechanical resonance: ${vib} mm/s indicates severe mechanical unbalance or bearing failure`);
    } else if (vib >= THRESHOLDS.vibration.nominalMax) {
      if (severity !== 'Critical') severity = vib >= THRESHOLDS.vibration.warningMax ? 'High' : 'Medium';
      if (status === 'Running') status = 'Attention';
      abnormalParameters.push(`High Vibration (${vib} mm/s)`);
      detectedIssues.push(`Vibration elevation: ${vib} mm/s exceeds standard baseline (${THRESHOLDS.vibration.nominalMax} mm/s)`);
    }
  }

  // 3. Evaluate Hydraulic Pressure (if available)
  if (pressure !== undefined) {
    if (pressure > THRESHOLDS.pressure.maxWarning || pressure < THRESHOLDS.pressure.minWarning) {
      if (severity !== 'Critical') severity = 'High';
      if (status === 'Running') status = 'Attention';
      abnormalParameters.push(`Pressure Anomaly (${pressure} psi)`);
      detectedIssues.push(`Hydraulic pressure off-nominal: ${pressure} psi outside safe operational window (${THRESHOLDS.pressure.minWarning} - ${THRESHOLDS.pressure.maxWarning} psi)`);
    } else if (pressure > THRESHOLDS.pressure.maxNominal || pressure < THRESHOLDS.pressure.minNominal) {
      if (severity === 'Normal') severity = 'Medium';
      if (status === 'Running') status = 'Attention';
      detectedIssues.push(`Hydraulic pressure variation: ${pressure} psi drifting from target`);
    }
  }

  // 4. Evaluate Power Consumption (if available)
  if (power !== undefined) {
    if (power > THRESHOLDS.powerConsumption.warningMax) {
      if (severity === 'Normal' || severity === 'Low') severity = 'Medium';
      if (status === 'Running') status = 'Attention';
      abnormalParameters.push(`High Power Draw (${power} kW)`);
      detectedIssues.push(`Electrical overload: ${power} kW indicates mechanical resistance`);
    }
  }

  // Synthesize Explanation and Recommended Action
  let explanation = 'All telemetry signals within nominal operational boundaries.';
  let recommendedAction = 'Continue normal production pace.';

  if (severity === 'Critical') {
    if (temp >= THRESHOLDS.temperature.criticalMax && vib >= THRESHOLDS.vibration.nominalMax) {
      explanation = `Compound mechanical-thermal failure on ${machineId}: Motor temperature reached ${temp}°C accompanied by severe vibration of ${vib} mm/s.`;
      recommendedAction = 'Halt station immediately, isolate electrical power, inspect mechanical bearings, and check coolant flow.';
    } else if (temp >= THRESHOLDS.temperature.criticalMax) {
      explanation = `Severe thermal spike detected on ${machineId}: Motor temperature reached ${temp}°C, exceeding safe thermal headroom.`;
      recommendedAction = 'Inspect motor cooling lines and hold station for maintenance clearance.';
    } else {
      explanation = `Critical vibrational anomaly on ${machineId}: Vibration level at ${vib} mm/s indicates imminent bearing failure or severe unbalance.`;
      recommendedAction = 'Halt station, inspect spindle/bearing assembly, and verify mounting torque.';
    }
  } else if (severity === 'High') {
    explanation = `Elevated operational stress on ${machineId}: ${detectedIssues[0] || 'Parameters approaching safety thresholds'}.`;
    recommendedAction = 'Perform immediate visual inspection and review operating parameters during the next cycle break.';
  } else if (severity === 'Medium') {
    explanation = `Telemetry deviation detected on ${machineId}: ${detectedIssues[0] || 'Signal drifting from baseline'}.`;
    recommendedAction = 'Schedule station inspection during next planned shift pause.';
  }

  return {
    machine_id: machineId,
    status,
    detected_issues: detectedIssues,
    severity,
    explanation,
    recommended_action: recommendedAction,
    abnormal_parameters: abnormalParameters,
    metrics: {
      temperature: temp,
      vibration: vib,
      pressure,
      power_consumption: power,
    },
  };
}
