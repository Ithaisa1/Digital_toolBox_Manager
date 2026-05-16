/**
 * Middleware de autenticación y autorización basado en JWT.
 * Extrae el token del header Authorization y valida rol de administrador.
 */
import jwt from "jsonwebtoken";

/** Verifica Bearer JWT y adjunta el payload decodificado en req.user. */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.warn("JWT verification failed:", err);
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ error: "Token expired" });
      }
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

/** Requiere que req.user.role sea ADMIN (usar después de authenticateToken). */
export const requireAdmin = (req, res, next) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};
