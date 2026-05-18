/**
 * Controlador de autenticación y gestión de perfil de usuario.
 * Maneja registro, inicio de sesión, consulta/actualización de perfil y baja de cuenta.
 * Utiliza JWT para tokens y bcrypt para el hash de contraseñas.
 */

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import prisma from "../config/database.js";
import EmailService from "../utils/emailService.js";

/**
 * Genera un token JWT con los datos esenciales del usuario.
 * @param {Object} user - Usuario con id, email y role.
 * @returns {string} Token JWT firmado.
 * @throws {Error} Si JWT_SECRET no está configurado en el entorno.
 */
const buildAuthToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );
};

/**
 * Registra un nuevo usuario en el sistema.
 * @param {import('express').Request} req - body: { email, password, name }.
 * @param {import('express').Response} res - 201 con user y token, o error de validación/conflicto.
 * @param {import('express').NextFunction} next - Pasa errores al middleware de errores.
 */
export const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    console.info("Auth register attempt for email:", normalizedEmail);

    // Validación de campos obligatorios
    if (!normalizedEmail || !password || !name) {
      return res
        .status(400)
        .json({ error: "Email, password, and name are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    // Comprobar si el email ya está registrado
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    // Hashear contraseña antes de persistir
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario en base de datos
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name,
        language: req.body.language || 'es',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        language: true,
        createdAt: true,
      },
    });

    // Emitir token para sesión inmediata tras registro
    const token = buildAuthToken(user);

    res.status(201).json({
      message: "User registered successfully",
      user,
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Autentica un usuario existente mediante email y contraseña.
 * @param {import('express').Request} req - body: { email, password }.
 * @param {import('express').Response} res - 200 con user (sin password) y token, o 401 si credenciales inválidas.
 * @param {import('express').NextFunction} next - Pasa errores al middleware de errores.
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    console.info("Auth login attempt for email:", normalizedEmail);

    // Validación de campos obligatorios
    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Buscar usuario por email normalizado
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (!user) {
      return res
        .status(401)
        .json({ error: "Invalid credentials", detail: "User not found" });
    }

    if (user.isBlocked) {
      return res.status(403).json({ error: "Access denied", detail: "User account is blocked" });
    }

    // Verificar contraseña con el hash almacenado
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res
        .status(401)
        .json({ error: "Invalid credentials", detail: "Incorrect password" });
    }

    // Generar token de sesión
    const token = buildAuthToken(user);

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        language: user.language || 'es',
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene el perfil del usuario autenticado con contadores de herramientas y suscripciones.
 * @param {import('express').Request} req - req.user.userId del middleware de autenticación.
 * @param {import('express').Response} res - 200 con datos del usuario o 404 si no existe.
 * @param {import('express').NextFunction} next - Pasa errores al middleware de errores.
 */
export const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        language: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            tools: true,
            subscriptions: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza nombre, email y/o contraseña del perfil autenticado.
 * Exige contraseña actual si se cambia email o contraseña; devuelve nuevo token si hay cambios sensibles.
 * @param {import('express').Request} req - body: { name?, email?, currentPassword?, newPassword? }.
 * @param {import('express').Response} res - 200 con user actualizado y token, o errores 400/401/409.
 * @param {import('express').NextFunction} next - Pasa errores al middleware de errores.
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { name, email, currentPassword, newPassword } = req.body;

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Detectar cambios que requieren verificación de contraseña actual
    const isEmailChanging =
      typeof email === "string" &&
      email.trim() &&
      email.trim() !== currentUser.email;
    const isPasswordChanging =
      typeof newPassword === "string" && newPassword.length > 0;
    const requiresPasswordCheck = isEmailChanging || isPasswordChanging;

    if (requiresPasswordCheck) {
      if (!currentPassword) {
        return res.status(400).json({
          error: "Current password is required to change email or password",
        });
      }

      const isValidPassword = await bcrypt.compare(
        currentPassword,
        currentUser.password,
      );
      if (!isValidPassword) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }
    }

    // Construir objeto de actualización solo con campos enviados
    const data = {};

    if (typeof name === "string" && name.trim()) {
      data.name = name.trim();
    }

    // Evitar email duplicado en otro usuario
    if (isEmailChanging) {
      const normalizedEmail = email.trim().toLowerCase();
      const existingEmail = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingEmail && existingEmail.id !== userId) {
        return res.status(409).json({ error: "Email already in use" });
      }

      data.email = normalizedEmail;
    }

    if (isPasswordChanging) {
      if (newPassword.length < 6) {
        return res
          .status(400)
          .json({ error: "Password must be at least 6 characters" });
      }

      data.password = await bcrypt.hash(newPassword, 10);
    }

    if (typeof req.body.language === "string") {
      data.language = req.body.language;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: "No changes provided" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        language: true,
        createdAt: true,
        _count: {
          select: {
            tools: true,
            subscriptions: true,
          },
        },
      },
    });

    const token = buildAuthToken(updatedUser);

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Elimina la cuenta del usuario autenticado tras validar la contraseña actual.
 * @param {import('express').Request} req - body: { currentPassword }.
 * @param {import('express').Response} res - 200 con mensaje de éxito o errores 400/401/404.
 * @param {import('express').NextFunction} next - Pasa errores al middleware de errores.
 */
export const deleteAccount = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { currentPassword } = req.body;

    if (!currentPassword) {
      return res
        .status(400)
        .json({ error: "Current password is required to delete the account" });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const isValidPassword = await bcrypt.compare(
      currentPassword,
      currentUser.password,
    );
    if (!isValidPassword) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    next(error);
  }
};

/**
 * Solicita restablecimiento de contraseña: genera token, lo guarda y envía email.
 * @param {import('express').Request} req - body: { email }.
 * @param {import('express').Response} res - 200 con mensaje de éxito (siempre 200 para no exponer existencia de usuarios).
 * @param {import('express').NextFunction} next - Pasa errores al middleware de errores.
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.json({
        message: "If an account with that email exists, a reset link has been sent.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpires,
      },
    });

    const emailService = new EmailService();
    await emailService.sendPasswordResetEmail(user, resetToken);

    res.json({
      message: "If an account with that email exists, a reset link has been sent.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Restablece la contraseña usando el token recibido por email.
 * @param {import('express').Request} req - body: { token, password }.
 * @param {import('express').Response} res - 200 con mensaje de éxito o 400/401 si token inválido/expirado.
 * @param {import('express').NextFunction} next - Pasa errores al middleware de errores.
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: {
          gte: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({
        error: "Invalid or expired reset token",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    res.json({
      message: "Password reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    next(error);
  }
};
