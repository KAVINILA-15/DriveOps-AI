import type { ManufacturingRecordInput, QualityAnalysisResult } from '../models/types';
import { analyzeQualityTelemetry } from '../analysis/qualityEngine';

export const qualityAnalysisService = {
  /**
   * Run standalone quality intelligence analysis
   */
  analyze(record: ManufacturingRecordInput): QualityAnalysisResult {
    return analyzeQualityTelemetry(record);
  },
};
