import { Router } from 'express';
import { exportUserData, generateAnalyticsReport } from '../controllers/exportController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Export user data (CSV/JSON)
router.get('/data', authenticateToken, exportUserData);

// Generate analytics report
router.get('/analytics', authenticateToken, generateAnalyticsReport);

export default router;
