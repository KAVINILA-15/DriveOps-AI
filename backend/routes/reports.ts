import { Router } from 'express';
import { reportController } from '../controllers/reportController';

const router = Router();

// Shift summary report
router.get('/reports', reportController.getShiftReport);
router.get('/reports/shift', reportController.getShiftReport);

// Export report as CSV
router.get('/reports/export', reportController.exportReport);
router.post('/reports/export', reportController.exportReport);

export default router;
