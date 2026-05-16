/**
 * Rutas administrativas para usuarios y gestión global.
 * Prefijo: /api/admin
 */
import { Router } from 'express';
import { getAdminUsers, toggleUserBlock } from '../controllers/adminController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken, requireAdmin);
router.get('/users', getAdminUsers);
router.put('/users/:id/block', toggleUserBlock);

export default router;
