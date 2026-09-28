import { Router } from 'express';
import { dashboardController } from '../controllers/dashboardController';

const router = Router();

// Dashboard summary
router.get('/dashboard', dashboardController.getDashboard);

// Machines fleet
router.get('/machines', dashboardController.getMachines);
router.get('/machines/:id', dashboardController.getMachineById);

// Production & Quality statistics
router.get('/production', dashboardController.getProduction);
router.get('/quality', dashboardController.getQuality);

export default router;
