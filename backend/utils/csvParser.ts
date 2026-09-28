import type { ManufacturingRecordInput } from '../models/types';

export interface CsvValidationOptions {
  strictColumns?: boolean;
}

/**
 * Split a single CSV line respecting quotes and escaped quotes
 */
function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"' || char === "'") {
      if (inQuotes && line[i + 1] === char) {
        current += char;
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Strict RFC 4180 CSV parser and validator for manufacturing telemetry
 */
export function parseManufacturingCsv(
  csvText: string,
  options: CsvValidationOptions = {}
): ManufacturingRecordInput[] {
  if (!csvText || typeof csvText !== 'string' || csvText.trim().length === 0) {
    throw new Error('The uploaded CSV contains no records');
  }

  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length <= 1) {
    throw new Error('The uploaded CSV contains no records');
  }

  // Parse and normalize header columns
  const rawHeaders = splitCsvLine(lines[0]);
  const headers = rawHeaders.map((h) =>
    h.replace(/^["']|["']$/g, '').trim().toLowerCase().replace(/[\s_-]+/g, '_')
  );

  // Column matching aliases
  const findCol = (...aliases: string[]): number => {
    return headers.findIndex((h) => aliases.includes(h));
  };

  const colMachineId = findCol('machine_id', 'machine', 'station', 'station_id');
  const colTimestamp = findCol('timestamp', 'time', 'date', 'datetime');
  const colProductionLine = findCol('production_line', 'line', 'line_name');
  const colTemp = findCol('temperature', 'temp', 'motor_temp', 'temp_c');
  const colVib = findCol('vibration', 'vib', 'vibration_level', 'vibration_mms');
  const colPressure = findCol('pressure', 'hydraulic_pressure', 'pneumatic_pressure', 'psi');
  const colPower = findCol('power_consumption', 'power', 'power_kw', 'kw');
  const colTarget = findCol('production_target', 'target', 'target_units');
  const colActual = findCol('production_actual', 'actual', 'actual_units', 'units_produced');
  const colQuality = findCol('quality_rate', 'quality', 'quality_score', 'yield');
  const colDefects = findCol('defect_count', 'defects', 'defect_total');
  const colDefectType = findCol('defect_type', 'defect_category', 'defect');

  // Validate required essential columns
  if (colMachineId === -1) {
    throw new Error("Missing required column: machine_id");
  }
  if (colTemp === -1) {
    throw new Error("Missing required column: temperature");
  }
  if (colVib === -1) {
    throw new Error("Missing required column: vibration");
  }

  const records: ManufacturingRecordInput[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rowNumber = i + 1; // 1-based indexing matching spreadsheet row numbers
    const values = splitCsvLine(lines[i]).map((v) => v.replace(/^["']|["']$/g, '').trim());

    if (values.length < 2) {
      continue; // skip accidental blank rows
    }

    const machineIdVal = colMachineId !== -1 ? values[colMachineId] : '';
    if (!machineIdVal) {
      throw new Error(`Invalid or empty machine_id in row ${rowNumber}`);
    }

    // Temperature validation
    const tempRaw = colTemp !== -1 ? values[colTemp] : undefined;
    if (tempRaw === undefined || tempRaw === '' || isNaN(Number(tempRaw))) {
      throw new Error(`Invalid temperature value in row ${rowNumber}`);
    }
    const temp = Number(tempRaw);

    // Vibration validation
    const vibRaw = colVib !== -1 ? values[colVib] : undefined;
    if (vibRaw === undefined || vibRaw === '' || isNaN(Number(vibRaw))) {
      throw new Error(`Invalid vibration value in row ${rowNumber}`);
    }
    const vib = Number(vibRaw);

    // Pressure validation (if column present)
    let pressure: number | undefined;
    if (colPressure !== -1 && values[colPressure] !== undefined && values[colPressure] !== '') {
      if (isNaN(Number(values[colPressure]))) {
        throw new Error(`Invalid pressure value in row ${rowNumber}`);
      }
      pressure = Number(values[colPressure]);
    }

    // Power consumption validation
    let power: number | undefined;
    if (colPower !== -1 && values[colPower] !== undefined && values[colPower] !== '') {
      if (isNaN(Number(values[colPower]))) {
        throw new Error(`Invalid power_consumption value in row ${rowNumber}`);
      }
      power = Number(values[colPower]);
    }

    // Production target validation
    let target: number | undefined;
    if (colTarget !== -1 && values[colTarget] !== undefined && values[colTarget] !== '') {
      if (isNaN(Number(values[colTarget]))) {
        throw new Error(`Invalid production_target value in row ${rowNumber}`);
      }
      target = Number(values[colTarget]);
    }

    // Production actual validation
    let actual: number | undefined;
    if (colActual !== -1 && values[colActual] !== undefined && values[colActual] !== '') {
      if (isNaN(Number(values[colActual]))) {
        throw new Error(`Invalid production_actual value in row ${rowNumber}`);
      }
      actual = Number(values[colActual]);
    }

    // Quality rate validation
    let qualityRate: number | undefined;
    if (colQuality !== -1 && values[colQuality] !== undefined && values[colQuality] !== '') {
      if (isNaN(Number(values[colQuality]))) {
        throw new Error(`Invalid quality_rate value in row ${rowNumber}`);
      }
      qualityRate = Number(values[colQuality]);
    }

    // Defect count validation
    let defectCount: number | undefined;
    if (colDefects !== -1 && values[colDefects] !== undefined && values[colDefects] !== '') {
      if (isNaN(parseInt(values[colDefects], 10))) {
        throw new Error(`Invalid defect_count value in row ${rowNumber}`);
      }
      defectCount = parseInt(values[colDefects], 10);
    }

    const defectType = colDefectType !== -1 && values[colDefectType] ? values[colDefectType] : undefined;
    const productionLine = colProductionLine !== -1 && values[colProductionLine] ? values[colProductionLine] : 'Body Line A';
    const timestamp = colTimestamp !== -1 && values[colTimestamp] ? values[colTimestamp] : new Date().toISOString();

    records.push({
      machine_id: machineIdVal,
      production_line: productionLine,
      timestamp,
      temperature: temp,
      vibration: vib,
      pressure,
      power_consumption: power,
      production_target: target,
      production_actual: actual,
      quality_rate: qualityRate,
      defect_count: defectCount,
      defect_type: defectType,
    });
  }

  if (records.length === 0) {
    throw new Error('The uploaded CSV contains no records');
  }

  return records;
}
