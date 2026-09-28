import type { ManufacturingRecordInput, ProductionAnalysisResult } from '../models/types';
import { analyzeProductionPerformance } from '../analysis/productionEngine';

export const productionAnalysisService = {
  /**
   * Run standalone production performance analysis
   */
  analyze(record: ManufacturingRecordInput): ProductionAnalysisResult {
    return analyzeProductionPerformance(record);
  },
};
