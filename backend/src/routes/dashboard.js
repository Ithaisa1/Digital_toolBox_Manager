/**
 * Estadísticas agregadas para el panel del usuario y vista de administrador.
 * Prefijo: /api/dashboard
 */
import { Router } from 'express';
import { getDashboardStats, getAdminStats } from '../controllers/dashboardController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/stats', authenticateToken, getDashboardStats);
router.get('/admin-stats', authenticateToken, getAdminStats);

export default router;
