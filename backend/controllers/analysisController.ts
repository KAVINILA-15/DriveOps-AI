import type { Request, Response } from 'express';
import { machineAnalysisService } from '../services/machineAnalysisService';
import { productionAnalysisService } from '../services/productionAnalysisService';
import { qualityAnalysisService } from '../services/qualityAnalysisService';
import { overallAnalysisService } from '../services/overallAnalysisService';
import { dataService } from '../services/dataService';
import { logger } from '../utils/logger';

export const analysisController = {
  /**
   * Machine analysis endpoint
   * POST /api/analysis/machine
   */
  analyzeMachine(req: Request, res: Response) {
    try {
      const record = dataService.validateAndNormalize(req.body);
      const result = machineAnalysisService.analyze(record);
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(400).json({ error: 'Machine analysis failed', message: err?.message });
    }
  },

  /**
   * Production analysis endpoint
   * POST /api/analysis/production
   */
  analyzeProduction(req: Request, res: Response) {
    try {
      const record = dataService.validateAndNormalize(req.body);
      const result = productionAnalysisService.analyze(record);
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(400).json({ error: 'Production analysis failed', message: err?.message });
    }
  },

  /**
   * Quality analysis endpoint
   * POST /api/analysis/quality
   */
  analyzeQuality(req: Request, res: Response) {
    try {
      const record = dataService.validateAndNormalize(req.body);
      const result = qualityAnalysisService.analyze(record);
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(400).json({ error: 'Quality analysis failed', message: err?.message });
    }
  },

  /**
   * Overall manufacturing analysis endpoint
   * POST /api/analysis/overall
   */
  async analyzeOverall(req: Request, res: Response) {
    try {
      const record = dataService.validateAndNormalize(req.body);
      const result = await overallAnalysisService.analyze(record);
      return res.status(200).json(result);
    } catch (err: any) {
      logger.error('Overall analysis failed:', err);
      return res.status(400).json({ error: 'Overall analysis failed', message: err?.message });
    }
  },

  /**
   * Batch analysis endpoint
   * POST /api/analysis/batch
   */
  async analyzeBatch(req: Request, res: Response) {
    try {
      let records: any[] = [];
      if (Array.isArray(req.body)) {
        records = req.body;
      } else if (req.body?.records && Array.isArray(req.body.records)) {
        records = req.body.records;
      } else if (typeof req.body === 'string' || req.body?.csv) {
        records = dataService.processCsv(typeof req.body === 'string' ? req.body : req.body.csv);
      }

      const normalized = records.map(r => dataService.validateAndNormalize(r));
      const results = await overallAnalysisService.analyzeBatch(normalized);

      return res.status(200).json({
        success: true,
        count: results.length,
        results,
      });
    } catch (err: any) {
      logger.error('Batch analysis failed:', err);
      return res.status(400).json({ error: 'Batch analysis failed', message: err?.message });
    }
  },
};
