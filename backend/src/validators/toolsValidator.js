/**
 * Validación Zod para creación y actualización de herramientas digitales.
 */
import { z } from 'zod';

// Esquemas de validación para herramientas
export const createToolSchema = z.object({
  name: z.string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  type: z.string()
    .min(1, 'El tipo es requerido')
    .max(50, 'El tipo no puede exceder 50 caracteres'),
  url: z.string()
    .url('URL inválida')
    .optional()
    .or(z.literal('')),
  price: z.number()
    .min(0, 'El precio no puede ser negativo')
    .optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED'])
    .optional()
    .default('ACTIVE'),
  categoryId: z.string()
    .uuid('ID de categoría inválido')
    .optional()
    .or(z.literal(''))
});

export const updateToolSchema = z.object({
  name: z.string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .optional(),
  type: z.string()
    .min(1, 'El tipo es requerido')
    .max(50, 'El tipo no puede exceder 50 caracteres')
    .optional(),
  url: z.string()
    .url('URL inválida')
    .optional()
    .or(z.literal('')),
  price: z.number()
    .min(0, 'El precio no puede ser negativo')
    .optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED'])
    .optional(),
  categoryId: z.string()
    .uuid('ID de categoría inválido')
    .optional()
    .or(z.literal(''))
});

/** Valida POST /tools con createToolSchema. */
export const validateCreateTool = (req, res, next) => {
  try {
    createToolSchema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({ 
      error: 'Error de validación',
      details: error.errors.map(err => ({
        campo: err.path[0],
        mensaje: err.message
      }))
    });
  }
};

/** Valida PUT /tools/:id con updateToolSchema. */
export const validateUpdateTool = (req, res, next) => {
  try {
    updateToolSchema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({ 
      error: 'Error de validación',
      details: error.errors.map(err => ({
        campo: err.path[0],
        mensaje: err.message
      }))
    });
  }
};
