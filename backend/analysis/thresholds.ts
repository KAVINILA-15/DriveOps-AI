/**
 * Automotive Manufacturing Operating Thresholds
 * Centralized, deterministic thresholds for plant anomaly detection
 * The exact thresholds are defined here in one single source of truth.
 */
export const ANOMALY_THRESHOLDS = {
  // Machine physical sensor thresholds
  temperature: {
    warningMax: 85.0,  // °C: Above 85°C indicates thermal elevation
    criticalMax: 90.0, // °C: Above 90°C indicates severe thermal overload
  },
  vibration: {
    warningMax: 4.5,   // mm/s: Above 4.5 mm/s indicates mechanical vibration
    criticalMax: 6.0,  // mm/s: Above 6.0 mm/s indicates severe mechanical resonance
  },
  pressure: {
    minWarning: 70.0,  // psi: Below 70 psi indicates hydraulic/pneumatic pressure drop
    maxWarning: 115.0, // psi: Above 115 psi indicates line over-pressure
    minCritical: 60.0, // psi: Below 60 psi indicates hydraulic failure
    maxCritical: 125.0,// psi: Above 125 psi indicates dangerous over-pressure
  },
  power_consumption: {
    warningMax: 48.0,  // kW: Above 48 kW indicates high electrical load
    criticalMax: 55.0, // kW: Above 55 kW indicates electrical surge/overload
  },

  // Production throughput thresholds
  production: {
    gap_percentage_warning: 15.0, // % deficit: (target - actual)/target > 15% is a production gap
    gap_percentage_critical: 25.0, // % deficit: > 25% is a critical production delay
  },

  // Quality inspection thresholds
  quality: {
    quality_rate_warning: 95.0,   // %: Quality rate below 95% is degraded
    quality_rate_critical: 90.0,  // %: Quality rate below 90% is a critical defect excursion
    defect_count_warning: 5,      // Defect count > 5 items is a warning
    defect_count_critical: 10,    // Defect count > 10 items is critical
  },
};

// Backward-compatible alias for existing code
export const THRESHOLDS = ANOMALY_THRESHOLDS;
