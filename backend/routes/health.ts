import { Router } from 'express';
import { healthController } from '../controllers/healthController';

const router = Router();

// Health check
router.get('/healthz', healthController.checkHealth);
router.get('/health', healthController.checkHealth);

// AI status
router.get('/ai/status', healthController.getAiStatus);

export default router;
