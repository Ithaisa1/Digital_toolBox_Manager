import express from 'express';
import { getAllSubscriptions, getSubscriptionById, createSubscription, updateSubscription, deleteSubscription, getUpcomingRenewals } from '../controllers/subscriptionsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getAllSubscriptions);
router.get('/upcoming', getUpcomingRenewals);
router.get('/:id', getSubscriptionById);
router.post('/', createSubscription);
router.put('/:id', updateSubscription);
router.delete('/:id', deleteSubscription);

export default router;
