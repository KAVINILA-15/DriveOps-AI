import { Router } from 'express';
import healthRoutes from './health';
import manufacturingRoutes from './manufacturing';
import analysisRoutes from './analysis';
import alertRoutes from './alerts';
import dashboardRoutes from './dashboard';
import insightRoutes from './insights';
import reportRoutes from './reports';
import datasetRoutes from './datasets';

const router = Router();

// Mount all feature routes
router.use(healthRoutes);
router.use(datasetRoutes);
router.use(manufacturingRoutes);
router.use(analysisRoutes);
router.use(alertRoutes);
router.use(dashboardRoutes);
router.use(insightRoutes);
router.use(reportRoutes);

export default router;
