import { createApp } from './app';
import { config } from './config';
import { dbClient } from './database/db';
import { aiService } from './services/aiService';
import { logger } from './utils/logger';

const app = createApp();
const port = config.port;

const server = app.listen(port, async () => {
  logger.info(`================================================================`);
  logger.info(`  DriveOps-AI Manufacturing Intelligence Backend`);
  logger.info(`  Server running at: http://localhost:${port}`);
  logger.info(`  Environment: ${config.nodeEnv}`);
  logger.info(`================================================================`);

  // Verify database connection
  const dbHealth = await dbClient.checkConnection();
  logger.info(`  Database Provider: [${dbHealth.provider}] ${dbHealth.message}`);

  // Check AI engine status
  const aiHealth = aiService.getStatus();
  logger.info(`  AI Reasoning Engine: [${aiHealth.provider}] ${aiHealth.message}`);
  logger.info(`================================================================`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT. Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed. Process terminated.');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM. Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed. Process terminated.');
    process.exit(0);
  });
});
