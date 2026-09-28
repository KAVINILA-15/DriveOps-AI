import { Router } from 'express';
import { insightController } from '../controllers/insightController';

const router = Router();

// Insights
router.get('/insights', insightController.getInsights);

export default router;
