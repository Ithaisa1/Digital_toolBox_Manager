/**
 * Validación de registro e inicio de sesión con Zod.
 * Middlewares que parsean req.body y devuelven errores en español.
 */
import { z } from "zod";

const registerPasswordSchema = z
  .string()
  .min(6, "La contraseña debe tener al menos 6 caracteres")
  .max(100, "La contraseña no puede exceder 100 caracteres");

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre no puede exceder 50 caracteres"),
  email: z.string().email("Email inválido").toLowerCase(),
  password: registerPasswordSchema,
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido").toLowerCase(),
  password: z.string().min(1, "La contraseña es requerida"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido").toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "El token es requerido"),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(100, "La contraseña no puede exceder 100 caracteres"),
});

/** Valida el cuerpo de POST /register contra registerSchema. */
export const validateRegister = (req, res, next) => {
  try {
    req.body = registerSchema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({
      error: "Error de validación",
      details: error.errors.map((err) => ({
        campo: err.path[0],
        mensaje: err.message,
      })),
    });
  }
};

/** Valida el cuerpo de POST /login contra loginSchema. */
export const validateLogin = (req, res, next) => {
  try {
    req.body = loginSchema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({
      error: "Error de validación",
      details: error.errors.map((err) => ({
        campo: err.path[0],
        mensaje: err.message,
      })),
    });
  }
};

/** Valida el cuerpo de POST /forgot-password contra forgotPasswordSchema. */
export const validateForgotPassword = (req, res, next) => {
  try {
    req.body = forgotPasswordSchema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({
      error: "Error de validación",
      details: error.errors.map((err) => ({
        campo: err.path[0],
        mensaje: err.message,
      })),
    });
  }
};

/** Valida el cuerpo de POST /reset-password contra resetPasswordSchema. */
export const validateResetPassword = (req, res, next) => {
  try {
    req.body = resetPasswordSchema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({
      error: "Error de validación",
      details: error.errors.map((err) => ({
        campo: err.path[0],
        mensaje: err.message,
      })),
    });
  }
};

