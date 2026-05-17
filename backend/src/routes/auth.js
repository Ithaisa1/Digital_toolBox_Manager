/**
 * Rutas de autenticación: registro, login y perfil de usuario.
 * Prefijo montado en la app: /api/auth
 */
import express from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getProfile, updateProfile, deleteAccount } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRegister, validateLogin } from '../validators/authValidator.js';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', authLimiter, validateRegister, register);
router.post('/login', authLimiter, validateLogin, login);
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.delete('/profile', authenticateToken, deleteAccount);

export default router;
