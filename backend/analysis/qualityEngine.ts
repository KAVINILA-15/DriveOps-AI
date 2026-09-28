import type { ManufacturingRecordInput, QualityAnalysisResult, Severity } from '../models/types';
import { THRESHOLDS } from './thresholds';

/**
 * Quality Intelligence Analysis Engine
 * Evaluates first-pass yield, defect clusters, and inspection tolerances
 */
export function analyzeQualityTelemetry(record: ManufacturingRecordInput): QualityAnalysisResult {
  const line = record.production_line || 'Quality Gate';
  const qualityRate = record.quality_rate !== undefined ? Number(record.quality_rate) : 98.5;
  const defectCount = record.defect_count !== undefined ? Number(record.defect_count) : 0;
  const defectType = record.defect_type || (defectCount > 0 ? 'Geometric variance' : undefined);

  let qualityStatus: 'Optimal' | 'Degraded' | 'Critical Defect Spike' = 'Optimal';
  let severity: Severity = 'Normal';
  let explanation = `Quality rate is optimal at ${qualityRate}% on ${line} with zero recorded deviations.`;
  let recommendedAction = 'Continue automated visual inspection standards.';

  if (qualityRate < THRESHOLDS.quality.degradedMin || defectCount >= THRESHOLDS.quality.maxDefectPerStation) {
    qualityStatus = 'Critical Defect Spike';
    severity = 'High';
    explanation = `Critical quality excursion on ${line}: Quality rate plunged to ${qualityRate}% with ${defectCount} defect(s) detected${defectType ? ` (Primary type: ${defectType})` : ''}.`;
    recommendedAction = `Sample the next 15 units immediately and inspect tooling calibration for ${defectType || 'reported defects'}.`;
  } else if (qualityRate < THRESHOLDS.quality.optimalMin || defectCount > 0) {
    qualityStatus = 'Degraded';
    severity = 'Medium';
    explanation = `Quality degradation noted on ${line}: Quality rate dropped to ${qualityRate}% (${defectCount} defect(s) recorded${defectType ? ` - ${defectType}` : ''}).`;
    recommendedAction = 'Verify sensor calibration and alert quality inspector for batch spot-check.';
  }

  return {
    production_line: line,
    quality_status: qualityStatus,
    quality_rate: qualityRate,
    defect_count: defectCount,
    defect_type: defectType,
    severity,
    explanation,
    recommended_action: recommendedAction,
  };
}
