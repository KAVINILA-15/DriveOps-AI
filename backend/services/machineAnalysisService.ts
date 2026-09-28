import type { ManufacturingRecordInput, MachineAnalysisResult } from '../models/types';
import { analyzeMachineTelemetry } from '../analysis/machineEngine';

export const machineAnalysisService = {
  /**
   * Run standalone machine intelligence analysis
   */
  analyze(record: ManufacturingRecordInput): MachineAnalysisResult {
    return analyzeMachineTelemetry(record);
  },
};
