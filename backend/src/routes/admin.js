/**
 * Panel de control del administrador.
 * Prefijo: /api/admin — todas las rutas exigen sesión y rol ADMIN.
 */
import { Router } from 'express';
import {
  getOverview,
  getAdminUsers,
  getAdminUserDetail,
  toggleUserBlock,
  changeUserRole,
  deleteUser,
  getAdminTools,
  getAdminActivity,
  getSystemStatus,
} from '../controllers/adminController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken, requireAdmin);

router.get('/overview', getOverview);
router.get('/users', getAdminUsers);
router.get('/users/:id', getAdminUserDetail);
router.put('/users/:id/block', toggleUserBlock);
router.put('/users/:id/role', changeUserRole);
router.delete('/users/:id', deleteUser);
router.get('/tools', getAdminTools);
router.get('/activity', getAdminActivity);
router.get('/system', getSystemStatus);

export default router;
