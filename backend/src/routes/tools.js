import express from 'express';
import { getAllTools, getToolById, createTool, updateTool, deleteTool } from '../controllers/toolsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getAllTools);
router.get('/:id', getToolById);
router.post('/', createTool);
router.put('/:id', updateTool);
router.delete('/:id', deleteTool);

export default router;
