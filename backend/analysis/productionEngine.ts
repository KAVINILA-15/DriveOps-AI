import type { ManufacturingRecordInput, ProductionAnalysisResult, Severity } from '../models/types';
import { THRESHOLDS } from './thresholds';

/**
 * Production Intelligence Analysis Engine
 * Evaluates line throughput, target adherence, and cycle pace gaps
 */
export function analyzeProductionPerformance(record: ManufacturingRecordInput): ProductionAnalysisResult {
  const line = record.production_line || 'Main Assembly Line';
  const target = Number(record.production_target) || 40;
  const actual = Number(record.production_actual) || target;
  const gap = target - actual;
  const performance = target > 0 ? Number(((actual / target) * 100).toFixed(1)) : 100.0;

  let productionStatus: 'On Target' | 'Minor Gap' | 'Critical Behind' | 'Exceeding' = 'On Target';
  let severity: Severity = 'Normal';
  let explanation = `${line} throughput is aligned with planned shift takt time (${performance}% target attainment).`;
  let recommendedAction = 'Maintain current cycle pace and feed rate.';

  if (actual > target) {
    productionStatus = 'Exceeding';
    explanation = `${line} is exceeding production target by ${actual - target} units (${performance}% attainment).`;
    recommendedAction = 'Verify downstream buffer capacity to prevent line congestion.';
  } else if (performance < THRESHOLDS.production.minorGapRatio * 100) {
    productionStatus = 'Critical Behind';
    severity = 'High';
    explanation = `Severe throughput deficit on ${line}: Produced ${actual} units vs target of ${target} (deficit: ${gap} units, ${performance}% attainment).`;
    recommendedAction = 'Deploy relief technicians to balance bottleneck station and expedite tooling clearance.';
  } else if (performance < THRESHOLDS.production.onTargetRatio * 100) {
    productionStatus = 'Minor Gap';
    severity = 'Medium';
    explanation = `Minor pace lag on ${line}: Current throughput is ${gap} units behind planned takt time (${performance}% attainment).`;
    recommendedAction = 'Review station cycle times and adjust buffer allocation at the next handoff.';
  }

  return {
    production_line: line,
    production_status: productionStatus,
    production_target: target,
    production_actual: actual,
    production_gap: gap,
    production_performance: performance,
    severity,
    explanation,
    recommended_action: recommendedAction,
  };
}
