/**
 * Exportación de datos del usuario y informes analíticos.
 * Prefijo: /api/export (montado en app.js)
 */
import { Router } from 'express';
import { exportUserData, generateAnalyticsReport } from '../controllers/exportController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/data', authenticateToken, exportUserData);
router.get('/analytics', authenticateToken, generateAnalyticsReport);

export default router;
