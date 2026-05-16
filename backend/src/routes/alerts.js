/**
 * Alertas del usuario: renovaciones próximas, lectura y borrado.
 * Prefijo: /api/alerts (montado en app.js)
 */
import { Router } from 'express';
import { getUpcomingRenewals, createAlert, getUserAlerts, markAlertAsRead, deleteAlert } from '../controllers/alertController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/upcoming', authenticateToken, getUpcomingRenewals);
router.get('/', authenticateToken, getUserAlerts);
router.post('/', authenticateToken, createAlert);
router.patch('/:alertId/read', authenticateToken, markAlertAsRead);
router.delete('/:alertId', authenticateToken, deleteAlert);

export default router;
