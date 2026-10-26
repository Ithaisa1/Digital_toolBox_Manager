/**
 * Middleware de autenticación y autorización basado en JWT.
 * El token identifica al usuario, pero el rol y el bloqueo se leen siempre de la
 * base de datos: así bloquear o quitar el rol de admin surte efecto al instante.
 */
import jwt from "jsonwebtoken";
import prisma from "../config/database.js";

/** Verifica el Bearer JWT y adjunta { userId, email, role } actualizados en req.user. */
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    return res.status(403).json({ error: "Invalid or expired token" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, isBlocked: true },
    });

    if (!user) {
      return res.status(401).json({ error: "User no longer exists", code: "userDeleted" });
    }
    if (user.isBlocked) {
      return res.status(403).json({ error: "Account is blocked", code: "blocked" });
    }

    req.user = { ...payload, userId: user.id, email: user.email, role: user.role };
    next();
  } catch (error) {
    next(error);
  }
};

/** Requiere que req.user.role sea ADMIN (usar después de authenticateToken). */
export const requireAdmin = (req, res, next) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};
