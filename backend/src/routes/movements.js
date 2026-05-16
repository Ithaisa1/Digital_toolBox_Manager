/**
 * Historial de movimientos (auditoría de cambios) del usuario autenticado.
 * Prefijo: /api/movements
 */
import express from 'express';
import { getAllMovements, getMovementById } from '../controllers/movementsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getAllMovements);
router.get('/:id', getMovementById);

export default router;
