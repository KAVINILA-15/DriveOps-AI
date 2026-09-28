import { Router } from 'express';
import { analysisController } from '../controllers/analysisController';

const router = Router();

// Machine intelligence analysis
router.post('/analysis/machine', analysisController.analyzeMachine);

// Production pace & throughput analysis
router.post('/analysis/production', analysisController.analyzeProduction);

// Quality rate & defect analysis
router.post('/analysis/quality', analysisController.analyzeQuality);

// Overall combined analysis
router.post('/analysis/overall', analysisController.analyzeOverall);

// Batch analysis
router.post('/analysis/batch', analysisController.analyzeBatch);

export default router;
