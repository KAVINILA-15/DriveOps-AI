import crypto from 'crypto';
import { parseManufacturingCsv } from '../utils/csvParser';
import type { ManufacturingRecordInput } from '../models/types';

export const dataService = {
  /**
   * Calculate SHA-256 hash of CSV content for deterministic verification and duplicate detection
   */
  calculateHash(content: string | Buffer): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  },

  /**
   * Validate and parse raw CSV text into strictly validated manufacturing records
   */
  processCsv(csvText: string): ManufacturingRecordInput[] {
    return parseManufacturingCsv(csvText);
  },

  /**
   * Validate and normalize a single telemetry record input
   */
  validateAndNormalize(input: any): ManufacturingRecordInput {
    if (!input || typeof input !== 'object') {
      throw new Error('Manufacturing telemetry input must be an object');
    }

    if (!input.machine_id) {
      throw new Error('Missing required column: machine_id');
    }

    const temp = input.temperature !== undefined ? parseFloat(input.temperature) : undefined;
    const vib = input.vibration !== undefined ? parseFloat(input.vibration) : undefined;

    if (temp !== undefined && isNaN(temp)) {
      throw new Error('Invalid temperature value');
    }
    if (vib !== undefined && isNaN(vib)) {
      throw new Error('Invalid vibration value');
    }

    return {
      machine_id: String(input.machine_id).trim(),
      production_line: input.production_line ? String(input.production_line).trim() : 'Body Line A',
      timestamp: input.timestamp ? String(input.timestamp).trim() : new Date().toISOString(),
      temperature: temp,
      vibration: vib,
      pressure: input.pressure !== undefined ? parseFloat(input.pressure) : undefined,
      power_consumption: input.power_consumption !== undefined ? parseFloat(input.power_consumption) : undefined,
      production_target: input.production_target !== undefined ? parseFloat(input.production_target) : undefined,
      production_actual: input.production_actual !== undefined ? parseFloat(input.production_actual) : undefined,
      quality_rate: input.quality_rate !== undefined ? parseFloat(input.quality_rate) : undefined,
      defect_count: input.defect_count !== undefined ? parseInt(input.defect_count, 10) : undefined,
      defect_type: input.defect_type ? String(input.defect_type).trim() : undefined,
      machine_status: input.machine_status ? String(input.machine_status).trim() : undefined,
    };
  },
};
