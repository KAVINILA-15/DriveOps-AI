import type { Request, Response } from 'express';
import { memoryStore } from '../database/memoryStore';
import { logger } from '../utils/logger';

export const dashboardController = {
  /**
   * Get full dashboard state
   * GET /api/dashboard
   */
  async getDashboard(req: Request, res: Response) {
    try {
      const machines = memoryStore.getMachines();
      const alerts = memoryStore.getAlerts();
      const insights = memoryStore.getInsights();
      const lineReadiness = memoryStore.getLineReadiness();
      const metrics = memoryStore.getDashboardMetrics();
      const activeDataset = memoryStore.getActiveDataset();

      return res.status(200).json({
        metrics,
        line_readiness: lineReadiness,
        machines,
        alerts: alerts.slice(0, 20),
        insights,
        dataset: activeDataset ? activeDataset.summary : undefined,
        updated_at: new Date().toISOString(),
      });
    } catch (err: any) {
      logger.error('Failed to get dashboard data:', err);
      return res.status(500).json({ error: 'Failed to retrieve dashboard data', message: err?.message });
    }
  },

  /**
   * Get machine fleet
   * GET /api/machines
   */
  async getMachines(req: Request, res: Response) {
    try {
      const machines = memoryStore.getMachines();
      return res.status(200).json(machines);
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to retrieve machines', message: err?.message });
    }
  },

  /**
   * Get a specific machine
   * GET /api/machines/:id
   */
  async getMachineById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const machine = memoryStore.getMachine(id);
      if (!machine) {
        return res.status(404).json({ error: `Machine ${id} not found` });
      }
      return res.status(200).json(machine);
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to retrieve machine', message: err?.message });
    }
  },

  /**
   * Get production intelligence & pace statistics
   * GET /api/production
   */
  async getProduction(req: Request, res: Response) {
    try {
      const stats = memoryStore.getProductionStats();
      return res.status(200).json(stats);
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to retrieve production statistics', message: err?.message });
    }
  },

  /**
   * Get quality intelligence & defect statistics
   * GET /api/quality
   */
  async getQuality(req: Request, res: Response) {
    try {
      const stats = memoryStore.getQualityStats();
      return res.status(200).json(stats);
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to retrieve quality statistics', message: err?.message });
    }
  },
};
