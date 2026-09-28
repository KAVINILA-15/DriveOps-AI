import { dbClient } from '../database/db';
import type { AlertRecord, Severity } from '../models/types';

export const alertService = {
  /**
   * Get all alerts with optional filtering
   */
  async getAlerts(filter?: { status?: string; severity?: string; machine_id?: string }): Promise<AlertRecord[]> {
    let alerts = await dbClient.getAlerts();

    if (filter?.status && filter.status !== 'all') {
      alerts = alerts.filter(a => a.status === filter.status);
    }
    if (filter?.severity && filter.severity !== 'All') {
      alerts = alerts.filter(a => a.severity === filter.severity);
    }
    if (filter?.machine_id) {
      alerts = alerts.filter(a => a.machine_id === filter.machine_id);
    }

    return alerts;
  },

  /**
   * Create and persist a new alert
   */
  async createAlert(data: {
    machine_id: string;
    production_line?: string;
    alert_type: string;
    severity: Severity;
    message: string;
    recommended_action: string;
    status?: 'open' | 'acknowledged' | 'resolved';
  }): Promise<AlertRecord> {
    const alertId = `ALT-${data.machine_id}-${Date.now().toString(36).toUpperCase()}`;
    const alert: AlertRecord = {
      alert_id: alertId,
      machine_id: data.machine_id,
      production_line: data.production_line || 'Main Assembly Line',
      timestamp: 'Just now',
      alert_type: data.alert_type,
      severity: data.severity,
      message: data.message,
      recommended_action: data.recommended_action,
      status: data.status || 'open',
    };

    await dbClient.saveAlert(alert);
    return alert;
  },

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string): Promise<boolean> {
    return await dbClient.acknowledgeAlert(alertId);
  },
};
