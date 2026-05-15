import express from 'express';
import { 
  getAllTools, 
  getToolById, 
  createTool, 
  updateTool, 
  deleteTool 
} from '../controllers/toolsController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateCreateTool, validateUpdateTool } from '../validators/toolsValidator.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/', getAllTools);
router.get('/:id', getToolById);
router.post('/', validateCreateTool, createTool);
router.put('/:id', validateUpdateTool, updateTool);
router.delete('/:id', deleteTool);

export default router;
