import { z } from 'zod';

// Esquemas de validación para autenticación
export const registerSchema = z.object({
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres'),
  email: z.string()
    .email('Email inválido')
    .toLowerCase(),
  password: z.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(100, 'La contraseña no puede exceder 100 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe contener al menos una mayúscula, una minúscula y un número')
});

export const loginSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .toLowerCase(),
  password: z.string()
    .min(1, 'La contraseña es requerida')
});

// Middleware de validación
export const validateRegister = (req, res, next) => {
  try {
    registerSchema.parse(req.body);
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

export const validateLogin = (req, res, next) => {
  try {
    loginSchema.parse(req.body);
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
