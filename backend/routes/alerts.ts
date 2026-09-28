import { Router } from 'express';
import { alertController } from '../controllers/alertController';

const router = Router();

// Get alerts
router.get('/alerts', alertController.getAlerts);

// Create alert
router.post('/alerts', alertController.createAlert);

// Acknowledge alert
router.patch('/alerts/:id/acknowledge', alertController.acknowledgeAlert);
router.put('/alerts/:id', alertController.acknowledgeAlert);

export default router;
