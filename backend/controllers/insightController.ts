import type { Request, Response } from 'express';
import { memoryStore } from '../database/memoryStore';

export const insightController = {
  /**
   * Get operational insights
   * GET /api/insights
   */
  getInsights(req: Request, res: Response) {
    const insights = memoryStore.getInsights();
    return res.status(200).json(insights);
  },
};
