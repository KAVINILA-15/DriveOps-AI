import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import router from './routes';
import { config } from './config';
import { logger } from './utils/logger';

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(cors({
    origin: config.corsOrigin,
    credentials: true,
  }));

  // JSON and URL-encoded parsing
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Raw text parsing for CSV intake
  app.use(express.text({ type: ['text/csv', 'text/plain', 'multipart/form-data'], limit: '50mb' }));

  // Request logger
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
    });
    next();
  });

  // Mount API routes under /api
  app.use('/api', router);

  // Root welcome endpoint
  app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
      name: 'DriveOps-AI Manufacturing Intelligence Backend',
      version: '1.0.0',
      status: 'operational',
      endpoints: {
        health: '/api/healthz',
        ai_status: '/api/ai/status',
        manufacturing_analyze: '/api/manufacturing/analyze',
        manufacturing_data: '/api/manufacturing/data',
        analysis_machine: '/api/analysis/machine',
        analysis_production: '/api/analysis/production',
        analysis_quality: '/api/analysis/quality',
        analysis_overall: '/api/analysis/overall',
        analysis_batch: '/api/analysis/batch',
        dashboard: '/api/dashboard',
        machines: '/api/machines',
        alerts: '/api/alerts',
        insights: '/api/insights',
        reports_shift: '/api/reports/shift',
        reports_export: '/api/reports/export',
      },
    });
  });

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Cannot ${req.method} ${req.originalUrl}`,
    });
  });

  // Global error handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error('Unhandled server error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: config.isDev ? err?.message : 'An unexpected error occurred',
    });
  });

  return app;
}

export const app = createApp();
export default app;
