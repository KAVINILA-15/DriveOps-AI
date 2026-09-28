import type { Request, Response } from 'express';
import { dbClient } from '../database/db';
import { aiService } from '../services/aiService';

export const healthController = {
  /**
   * Health check endpoint
   * GET /api/healthz
   */
  async checkHealth(req: Request, res: Response) {
    const dbStatus = await dbClient.checkConnection();
    const aiStatus = aiService.getStatus();

    return res.status(200).json({
      status: 'healthy',
      service: 'DriveOps-AI Manufacturing Intelligence Backend',
      version: '1.0.0',
      uptime_seconds: process.uptime(),
      timestamp: new Date().toISOString(),
      database: dbStatus,
      ai_engine: aiStatus,
    });
  },

  /**
   * AI Engine status
   * GET /api/ai/status
   */
  getAiStatus(req: Request, res: Response) {
    return res.status(200).json(aiService.getStatus());
  },
};
