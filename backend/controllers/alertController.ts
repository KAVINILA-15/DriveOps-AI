import type { Request, Response } from 'express';
import { alertService } from '../services/alertService';
import { logger } from '../utils/logger';

export const alertController = {
  /**
   * Get all alerts
   * GET /api/alerts
   */
  async getAlerts(req: Request, res: Response) {
    try {
      const { status, severity, machine_id } = req.query;
      const alerts = await alertService.getAlerts({
        status: status as string,
        severity: severity as string,
        machine_id: machine_id as string,
      });
      return res.status(200).json(alerts);
    } catch (err: any) {
      logger.error('Failed to get alerts:', err);
      return res.status(500).json({ error: 'Failed to retrieve alerts', message: err?.message });
    }
  },

  /**
   * Create an alert
   * POST /api/alerts
   */
  async createAlert(req: Request, res: Response) {
    try {
      const { machine_id, production_line, alert_type, severity, message, recommended_action } = req.body;
      if (!machine_id || !alert_type || !severity || !message) {
        return res.status(400).json({ error: 'Missing required alert fields' });
      }

      const alert = await alertService.createAlert({
        machine_id,
        production_line,
        alert_type,
        severity,
        message,
        recommended_action: recommended_action || 'Inspect station.',
      });

      return res.status(201).json(alert);
    } catch (err: any) {
      logger.error('Failed to create alert:', err);
      return res.status(500).json({ error: 'Failed to create alert', message: err?.message });
    }
  },

  /**
   * Acknowledge an alert
   * PATCH /api/alerts/:id/acknowledge
   */
  async acknowledgeAlert(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const success = await alertService.acknowledgeAlert(id);
      if (!success) {
        return res.status(404).json({ error: `Alert with ID "${id}" not found` });
      }
      return res.status(200).json({ success: true, message: `Alert ${id} acknowledged` });
    } catch (err: any) {
      logger.error('Failed to acknowledge alert:', err);
      return res.status(500).json({ error: 'Failed to acknowledge alert', message: err?.message });
    }
  },
};
