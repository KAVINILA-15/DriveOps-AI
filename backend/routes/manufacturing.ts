import { Router } from 'express';
import { manufacturingController } from '../controllers/manufacturingController';

const router = Router();

// Single record analysis (matches prior webhook payload & response contract)
router.post('/manufacturing/analyze', manufacturingController.analyzeRecord);

// Primary CSV Upload & Deterministic Processing
router.post('/manufacturing/upload', manufacturingController.uploadFile);

// Telemetry data intake (JSON array or raw CSV text)
router.post('/manufacturing/data', manufacturingController.processData);
router.post('/manufacturing/ingest', manufacturingController.processData);
router.post('/manufacturing/ingest/csv', manufacturingController.processData);

export default router;
