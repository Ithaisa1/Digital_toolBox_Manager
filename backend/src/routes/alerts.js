import { Router } from 'express';
import { getUpcomingRenewals, createAlert, getUserAlerts, markAlertAsRead, deleteAlert } from '../controllers/alertController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Get upcoming renewals
router.get('/upcoming', authenticateToken, getUpcomingRenewals);

// Get user alerts
router.get('/', authenticateToken, getUserAlerts);

// Create new alert
router.post('/', authenticateToken, createAlert);

// Mark alert as read
router.patch('/:alertId/read', authenticateToken, markAlertAsRead);

// Delete alert
router.delete('/:alertId', authenticateToken, deleteAlert);

export default router;
