import type { Request, Response } from 'express';
import { reportService } from '../services/reportService';
import { logger } from '../utils/logger';

export const reportController = {
  /**
   * Get shift report
   * GET /api/reports/shift
   */
  async getShiftReport(req: Request, res: Response) {
    try {
      const report = await reportService.getShiftReport();
      return res.status(200).json(report);
    } catch (err: any) {
      logger.error('Failed to get shift report:', err);
      return res.status(500).json({ error: 'Failed to generate shift report', message: err?.message });
    }
  },

  /**
   * Export shift report as CSV
   * GET or POST /api/reports/export
   */
  async exportReport(req: Request, res: Response) {
    try {
      const csv = await reportService.exportCsvReport();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="driveops-shift-report.csv"');
      return res.status(200).send(csv);
    } catch (err: any) {
      logger.error('Failed to export shift report:', err);
      return res.status(500).json({ error: 'Export failed', message: err?.message });
    }
  },
};
