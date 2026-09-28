import { ANOMALY_THRESHOLDS } from './thresholds';
import type { ManufacturingRecordInput, Severity } from '../models/types';

export interface AnomalyEvaluationResult {
  row_index: number;
  machine_id: string;
  production_line: string;
  timestamp: string;
  is_anomaly: boolean;
  reasons: string[];
  severity: Severity;
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

/**
 * Deterministic Anomaly Evaluation Engine
 * Pure function: Given the exact same inputs, it ALWAYS returns the EXACT same output.
 * No random values, no LLM hallucinations.
 */
export function evaluateRecordDeterministic(
  record: ManufacturingRecordInput,
  rowIndex: number = 0
): AnomalyEvaluationResult {
  const reasons: string[] = [];
  const actionItems: string[] = [];

  let hasCritical = false;
  let hasWarning = false;
  let machineIssue = false;
  let productionIssue = false;
  let qualityIssue = false;

  const machineId = record.machine_id || `M-${100 + rowIndex}`;
  const productionLine = record.production_line || 'Body Line A';
  const timestamp = record.timestamp || new Date().toISOString();

  // 1. Evaluate Temperature
  if (record.temperature !== undefined && !isNaN(Number(record.temperature))) {
    const temp = Number(record.temperature);
    if (temp >= ANOMALY_THRESHOLDS.temperature.criticalMax) {
      reasons.push(
        `Critical thermal overload: Temperature (${temp}°C) exceeds critical safety limit (${ANOMALY_THRESHOLDS.temperature.criticalMax}°C)`
      );
      actionItems.push('Initiate emergency station cooldown and inspect thermal sensors');
      hasCritical = true;
      machineIssue = true;
    } else if (temp >= ANOMALY_THRESHOLDS.temperature.warningMax) {
      reasons.push(
        `Temperature (${temp}°C) exceeded operational threshold (${ANOMALY_THRESHOLDS.temperature.warningMax}°C)`
      );
      actionItems.push('Inspect cooling circuits and review station lubrication');
      hasWarning = true;
      machineIssue = true;
    }
  }

  // 2. Evaluate Vibration
  if (record.vibration !== undefined && !isNaN(Number(record.vibration))) {
    const vib = Number(record.vibration);
    if (vib >= ANOMALY_THRESHOLDS.vibration.criticalMax) {
      reasons.push(
        `Severe mechanical vibration: Vibration (${vib} mm/s) exceeds critical limit (${ANOMALY_THRESHOLDS.vibration.criticalMax} mm/s)`
      );
      actionItems.push('Halt spindle drive immediately to prevent bearing catastrophic failure');
      hasCritical = true;
      machineIssue = true;
    } else if (vib >= ANOMALY_THRESHOLDS.vibration.warningMax) {
      reasons.push(
        `Vibration (${vib} mm/s) exceeded operational baseline (${ANOMALY_THRESHOLDS.vibration.warningMax} mm/s)`
      );
      actionItems.push('Schedule bearing alignment check at next planned shift change');
      hasWarning = true;
      machineIssue = true;
    }
  }

  // 3. Evaluate Hydraulic / Pneumatic Pressure (if present)
  if (record.pressure !== undefined && !isNaN(Number(record.pressure))) {
    const pressure = Number(record.pressure);
    if (pressure <= ANOMALY_THRESHOLDS.pressure.minCritical) {
      reasons.push(
        `Critical pressure drop: Pressure (${pressure} psi) is critically low (minimum: ${ANOMALY_THRESHOLDS.pressure.minCritical} psi)`
      );
      actionItems.push('Check hydraulic lines for leaks or pump seal failure');
      hasCritical = true;
      machineIssue = true;
    } else if (pressure >= ANOMALY_THRESHOLDS.pressure.maxCritical) {
      reasons.push(
        `Dangerous over-pressure: Pressure (${pressure} psi) exceeds critical threshold (${ANOMALY_THRESHOLDS.pressure.maxCritical} psi)`
      );
      actionItems.push('Release relief valve and check pressure regulators');
      hasCritical = true;
      machineIssue = true;
    } else if (pressure < ANOMALY_THRESHOLDS.pressure.minWarning) {
      reasons.push(
        `Low operating pressure: Pressure (${pressure} psi) dropped below warning limit (${ANOMALY_THRESHOLDS.pressure.minWarning} psi)`
      );
      actionItems.push('Verify compressor supply pressure and intake filters');
      hasWarning = true;
      machineIssue = true;
    } else if (pressure > ANOMALY_THRESHOLDS.pressure.maxWarning) {
      reasons.push(
        `Elevated operating pressure: Pressure (${pressure} psi) exceeds warning limit (${ANOMALY_THRESHOLDS.pressure.maxWarning} psi)`
      );
      actionItems.push('Calibrate pressure relief switch');
      hasWarning = true;
      machineIssue = true;
    }
  }

  // 4. Evaluate Power Consumption (if present)
  if (record.power_consumption !== undefined && !isNaN(Number(record.power_consumption))) {
    const power = Number(record.power_consumption);
    if (power >= ANOMALY_THRESHOLDS.power_consumption.criticalMax) {
      reasons.push(
        `Electrical surge: Power consumption (${power} kW) exceeds critical limit (${ANOMALY_THRESHOLDS.power_consumption.criticalMax} kW)`
      );
      actionItems.push('Inspect motor windings and check for mechanical binding');
      hasCritical = true;
      machineIssue = true;
    } else if (power >= ANOMALY_THRESHOLDS.power_consumption.warningMax) {
      reasons.push(
        `High power draw: Power consumption (${power} kW) exceeds warning limit (${ANOMALY_THRESHOLDS.power_consumption.warningMax} kW)`
      );
      actionItems.push('Monitor motor temperature and electrical phase balance');
      hasWarning = true;
      machineIssue = true;
    }
  }

  // 5. Evaluate Production Gap (Target vs Actual)
  if (
    record.production_target !== undefined &&
    record.production_actual !== undefined &&
    Number(record.production_target) > 0
  ) {
    const target = Number(record.production_target);
    const actual = Number(record.production_actual);
    if (actual < target) {
      const gap = target - actual;
      const gapPct = (gap / target) * 100;

      if (gapPct >= ANOMALY_THRESHOLDS.production.gap_percentage_critical) {
        reasons.push(
          `Critical throughput deficit: Produced ${actual} vs target ${target} (${gap} units gap, ${gapPct.toFixed(1)}% deficit)`
        );
        actionItems.push('Rebalance assembly line bottleneck and verify feeder supply');
        hasCritical = true;
        productionIssue = true;
      } else if (gapPct >= ANOMALY_THRESHOLDS.production.gap_percentage_warning) {
        reasons.push(
          `Production gap detected: Produced ${actual} vs target ${target} (${gap} units gap, ${gapPct.toFixed(1)}% deficit)`
        );
        actionItems.push('Adjust line speed or deploy relief operators to recover takt time');
        hasWarning = true;
        productionIssue = true;
      }
    }
  }

  // 6. Evaluate Quality Rate
  if (record.quality_rate !== undefined && !isNaN(Number(record.quality_rate))) {
    const qualityRate = Number(record.quality_rate);
    if (qualityRate <= ANOMALY_THRESHOLDS.quality.quality_rate_critical) {
      reasons.push(
        `Critical quality plunge: Quality rate (${qualityRate}%) dropped below critical threshold (${ANOMALY_THRESHOLDS.quality.quality_rate_critical}%)`
      );
      actionItems.push('Halt batch for 100% manual quality audit and recalibrate vision inspection');
      hasCritical = true;
      qualityIssue = true;
    } else if (qualityRate <= ANOMALY_THRESHOLDS.quality.quality_rate_warning) {
      reasons.push(
        `Quality rate (${qualityRate}%) degraded below warning threshold (${ANOMALY_THRESHOLDS.quality.quality_rate_warning}%)`
      );
      actionItems.push('Increase spot inspection frequency and check tooling wear');
      hasWarning = true;
      qualityIssue = true;
    }
  }

  // 7. Evaluate Defect Count
  if (record.defect_count !== undefined && !isNaN(Number(record.defect_count))) {
    const defects = Number(record.defect_count);
    const defectType = record.defect_type ? ` (Type: ${record.defect_type})` : '';

    if (defects >= ANOMALY_THRESHOLDS.quality.defect_count_critical) {
      reasons.push(
        `Critical defect cluster: ${defects} defects detected${defectType} (critical limit: ${ANOMALY_THRESHOLDS.quality.defect_count_critical})`
      );
      actionItems.push(`Isolate defective lot immediately and inspect tooling for ${record.defect_type || 'flaws'}`);
      hasCritical = true;
      qualityIssue = true;
    } else if (defects >= ANOMALY_THRESHOLDS.quality.defect_count_warning) {
      reasons.push(
        `Defect count elevated: ${defects} defects detected${defectType} (warning limit: ${ANOMALY_THRESHOLDS.quality.defect_count_warning})`
      );
      actionItems.push(`Perform QA root-cause analysis for ${record.defect_type || 'defects'}`);
      hasWarning = true;
      qualityIssue = true;
    }
  }

  // Determine Final Severity
  let severity: Severity = 'Normal';
  const isAnomaly = reasons.length > 0;

  if (hasCritical) {
    severity = 'Critical';
  } else if (hasWarning || reasons.length >= 2) {
    severity = 'High';
  } else if (reasons.length === 1) {
    severity = 'Medium';
  }

  // Generate clear explanations and recommended actions
  const explanation = isAnomaly
    ? `Station ${machineId} on ${productionLine} triggered ${reasons.length} operational anomaly check(s): ${reasons.join('; ')}`
    : `All monitored manufacturing signals for Station ${machineId} on ${productionLine} are within standard operating baselines.`;

  const recommendedAction = actionItems.length > 0
    ? actionItems.join('. ') + '.'
    : 'Continue standard shift production cadence.';

  return {
    row_index: rowIndex,
    machine_id: machineId,
    production_line: productionLine,
    timestamp,
    is_anomaly: isAnomaly,
    reasons,
    severity,
    machine_issue: machineIssue,
    production_issue: productionIssue,
    quality_issue: qualityIssue,
    explanation,
    recommended_action: recommendedAction,
    metrics: {
      temperature: record.temperature !== undefined ? Number(record.temperature) : undefined,
      vibration: record.vibration !== undefined ? Number(record.vibration) : undefined,
      pressure: record.pressure !== undefined ? Number(record.pressure) : undefined,
      power_consumption: record.power_consumption !== undefined ? Number(record.power_consumption) : undefined,
      production_target: record.production_target !== undefined ? Number(record.production_target) : undefined,
      production_actual: record.production_actual !== undefined ? Number(record.production_actual) : undefined,
      quality_rate: record.quality_rate !== undefined ? Number(record.quality_rate) : undefined,
      defect_count: record.defect_count !== undefined ? Number(record.defect_count) : undefined,
      defect_type: record.defect_type,
    },
  };
}
