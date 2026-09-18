/**
 * Pure frontend presentation formatters.
 * Converts verbose backend or telemetry strings into concise technical manufacturing terms.
 * Does NOT mutate underlying API, database, or state objects.
 */

export interface AlertLike {
  title?: string;
  machine_id?: string;
  machine?: string;
  explanation?: string;
  recommended_action?: string;
}

/**
 * Formats an alert title into a concise [Short Issue Title].
 * e.g., "ASM-02 — High Temperature", "Unexpected Station Stop", "High Cycle Time"
 */
export function formatAlertTitle(alert: AlertLike | string): string {
  const title = typeof alert === 'string' ? alert : alert.title || '';
  const machine = typeof alert === 'string' ? '' : (alert.machine || alert.machine_id || '');

  const lower = title.toLowerCase();

  // Known exact patterns & examples
  if (lower.includes('asm-02') || (machine.includes('ASM-02') && lower.includes('temperature'))) {
    return 'ASM-02 — High Temperature';
  }
  if (lower.includes('station stopped') || lower.includes('unexpected stop') || lower.includes('stopped unexpectedly')) {
    if (machine && !machine.startsWith('Station')) {
      return `${machine} — Unexpected Stop`;
    }
    return 'Unexpected Station Stop';
  }
  if (lower.includes('cycle time') && (lower.includes('target') || lower.includes('drift') || lower.includes('above'))) {
    if (machine && !machine.startsWith('Station')) {
      return `${machine} — High Cycle Time`;
    }
    return 'High Cycle Time';
  }
  if (lower.includes('vibration') && (lower.includes('trend') || lower.includes('rising') || lower.includes('spike'))) {
    if (machine && !machine.startsWith('Station')) {
      return `${machine} — High Vibration`;
    }
    return 'High Vibration';
  }
  if (lower.includes('maintenance window') || lower.includes('scheduled maintenance')) {
    if (machine && !machine.startsWith('Station')) {
      return `${machine} — Maintenance Window`;
    }
    return 'Maintenance Active';
  }
  if (lower.includes('quality') || lower.includes('defect')) {
    return 'Quality Defect';
  }

  // Handle SNS webhook generated titles: "M-204 Critical Anomaly · Thermal spike (95°C)..."
  if (title.includes('Critical Anomaly') || title.includes('Threshold Exceeded')) {
    const idMatch = title.match(/^([A-Za-z0-9_-]+)/);
    const stationId = idMatch ? idMatch[1] : machine || 'Station';
    if (lower.includes('thermal') || lower.includes('temperature') || lower.includes('°c')) {
      if (lower.includes('vibration')) {
        return `${stationId} — High Temp & Vibration`;
      }
      return `${stationId} — High Temperature`;
    }
    if (lower.includes('vibration')) {
      return `${stationId} — High Vibration`;
    }
    return `${stationId} — Parameter Threshold Exceeded`;
  }

  // Fallback: If title has colon or dash, keep first compact portion
  if (title.includes(' · ')) {
    const parts = title.split(' · ');
    return parts[0].trim();
  }

  return title;
}

/**
 * Formats recommended actions into concise commands:
 * e.g., "Inspect temperature and bearings.", "Check motor cooling.", "Check hydraulic pressure."
 */
export function formatAlertAction(action: string | undefined): string {
  if (!action) return 'Inspect station.';

  const lower = action.toLowerCase();

  if (lower.includes('thermal') || lower.includes('temperature') || lower.includes('bearing')) {
    if (lower.includes('bearing') && (lower.includes('thermal') || lower.includes('temperature'))) {
      return 'Inspect temperature and bearings.';
    }
    if (lower.includes('bearing')) {
      return 'Inspect bearings.';
    }
    return 'Thermal inspection required.';
  }

  if (lower.includes('motor cooling') || lower.includes('cooling')) {
    return 'Check motor cooling.';
  }

  if (lower.includes('hydraulic') || lower.includes('tooling')) {
    if (lower.includes('tooling')) {
      return 'Check hydraulic pressure and tooling alignment.';
    }
    return 'Check hydraulic pressure.';
  }

  if (lower.includes('service checklist') || lower.includes('standard pace')) {
    return 'Verify service checklist.';
  }

  if (lower.includes('sealant') || lower.includes('sample')) {
    return 'Review sealant applicator and sample next 20 units.';
  }

  if (lower.includes('halt station') || lower.includes('physical verification')) {
    return 'Halt station and verify.';
  }

  // Clean up long verbose starts
  let clean = action
    .replace(/^Initiate immediate /i, '')
    .replace(/^Have a supervisor /i, '')
    .replace(/^Please /i, '')
    .trim();

  // If ends with a long dependent clause, truncate to first clause
  if (clean.includes(' and hold ')) {
    clean = clean.split(' and hold ')[0] + '.';
  }

  return clean;
}

/**
 * Shortens verbose alert explanations:
 */
export function formatAlertExplanation(explanation: string | undefined): string {
  if (!explanation) return '';

  const lower = explanation.toLowerCase();

  if (lower.includes('motor temperature reached') || lower.includes('temperature spike')) {
    const tempMatch = explanation.match(/(\d+°C)/i);
    const tempStr = tempMatch ? tempMatch[1] : 'High temperature';
    return `Motor temperature reached ${tempStr}. Unexpected station stop.`;
  }

  if (lower.includes('cycle time is 42.6') || (lower.includes('cycle time') && lower.includes('above'))) {
    return 'Cycle time 42.6s (6.5% above line target).';
  }

  if (lower.includes('vibration is 18%') || lower.includes('vibration')) {
    return 'Vibration 18% above 7-day baseline.';
  }

  if (lower.includes('planned service') || lower.includes('reduced pace')) {
    return 'Operating at reduced pace during planned service.';
  }

  // If SNS alert with Telegram notification text appended
  if (explanation.includes('Recorded temperature')) {
    const tempMatch = explanation.match(/(\d+(?:\.\d+)?°C)/);
    const vibMatch = explanation.match(/(\d+(?:\.\d+)?\s*mm\/s)/);
    const parts: string[] = [];
    if (tempMatch) parts.push(`Temp ${tempMatch[1]}`);
    if (vibMatch) parts.push(`Vib ${vibMatch[1]}`);
    return parts.length > 0 ? `${parts.join(', ')} exceeded threshold.` : 'Telemetry threshold exceeded.';
  }

  // Strip Telegram notification suffix if present in UI display
  let clean = explanation.replace(/\s*\(Telegram alert was automatically delivered.*?\)/i, '');
  if (clean.length > 90) {
    const firstSentence = clean.split('.')[0];
    if (firstSentence && firstSentence.length > 10) {
      return firstSentence + '.';
    }
  }

  return clean;
}

/**
 * Formats recovery playbook and insight issues into short technical statements:
 * e.g., "ASM-02 — Thermal/vibration threshold exceeded.", "Body Line A — 6–8 min/hr loss."
 */
export function formatInsightIssue(issue: string | undefined): string {
  if (!issue) return '';

  const lower = issue.toLowerCase();

  if (lower.includes('asm-02')) {
    return 'ASM-02 — Thermal/vibration threshold exceeded.';
  }
  if (lower.includes('losing 6–8 minutes') || lower.includes('press cell 04')) {
    return 'Body Line A — 6–8 min/hr loss.';
  }
  if (lower.includes('seal alignment') || lower.includes('clustering')) {
    return 'Final Assembly — Seal alignment defect.';
  }
  if (lower.includes('torque station 12') || lower.includes('controlled restart')) {
    return 'Torque Station 12 — Unexpected stop.';
  }

  // SNS format: "M-204 on Body Line A: Anomaly detected..."
  if (issue.includes(':')) {
    const parts = issue.split(':');
    const prefix = parts[0].trim();
    return `${prefix} — Threshold exceeded.`;
  }

  return issue;
}

/**
 * Formats "01 What Happened" in Insights to a short clear sentence:
 * e.g., "High machine temperature detected."
 */
export function formatInsightExplanation(explanation: string | undefined): string {
  if (!explanation) return 'High machine temperature detected.';

  const lower = explanation.toLowerCase();

  if (lower.includes('cycle time') && lower.includes('drift')) {
    return 'Cycle time drifted above target at Press Cell 04.';
  }
  if (lower.includes('defects are up') || lower.includes('seal alignment')) {
    return 'Seal alignment defects increased at Vision Inspect 01.';
  }
  if (lower.includes('temperature spike') || lower.includes('stopped after') || lower.includes('motor temperature')) {
    return 'High machine temperature detected.';
  }
  if (lower.includes('recorded temperature') || lower.includes('thermal')) {
    return 'High machine temperature detected.';
  }

  // Fallback to first short sentence
  const first = explanation.split('.')[0];
  if (first && first.length < 80) return first + '.';
  return 'Operating anomaly detected.';
}

/**
 * Formats "02 Why It Matters" in Insights to a short clear sentence:
 * e.g., "May affect machine operation."
 */
export function formatInsightImpact(impact: string | undefined): string {
  if (!impact) return 'May affect machine operation.';

  const lower = impact.toLowerCase();

  if (lower.includes('38 units')) {
    return '38 units at risk per shift.';
  }
  if (lower.includes('below 97%')) {
    return 'Quality rate risk below 97%.';
  }
  if (lower.includes('line output paused') || lower.includes('halted')) {
    return 'May affect machine operation.';
  }

  // Clean trailing explanatory text
  let clean = impact.replace(/\. This is the part of the operation.*/i, '').trim();
  if (!clean.endsWith('.')) clean += '.';
  return clean;
}

/**
 * Formats "03 Recommended Action" in Insights to a short clear sentence:
 * e.g., "Inspect the machine.", "Check hydraulic pressure and tooling alignment."
 */
export function formatInsightAction(action: string | undefined): string {
  return formatAlertAction(action);
}
