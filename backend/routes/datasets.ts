import { Router } from 'express';
import { datasetController } from '../controllers/datasetController';

const router = Router();

// Upload CSV and create dataset
router.post('/datasets/upload', datasetController.upload);

// Retrieve active dataset and completed analysis
router.get('/datasets/active', datasetController.getActive);

// Retrieve specific dataset metadata
router.get('/datasets/:datasetId', datasetController.getById);

// Retrieve processing / analysis status
router.get('/datasets/:datasetId/status', datasetController.getStatus);

// Trigger analysis (re-uses existing completed analysis if already finished)
router.post('/datasets/:datasetId/analyze', datasetController.analyze);

// Retrieve persisted analysis results
router.get('/datasets/:datasetId/analysis', datasetController.getAnalysis);

// Delete dataset and reset active state
router.delete('/datasets/:datasetId', datasetController.delete);

export default router;
