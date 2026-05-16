/**
 * Manejo centralizado de errores de Express.
 * Mapea errores de validación, JWT y códigos Prisma a respuestas HTTP coherentes.
 */

/** Middleware de cuatro argumentos: último en la cadena de Express. */
export const errorHandler = (err, req, res, next) => {
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    code: err.code,
    name: err.name
  });

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Violación de unicidad en Prisma
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Resource already exists' });
  }

  // Registro no encontrado en Prisma
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Resource not found' });
  }

  // Enviar error detallado en desarrollo
  if (process.env.NODE_ENV === 'development') {
    return res.status(500).json({ 
      error: 'Internal server error',
      details: err.message,
      stack: err.stack
    });
  }

  res.status(500).json({ error: 'Internal server error' });
};

/** Responde 404 cuando ninguna ruta coincide con la petición. */
export const notFound = (req, res) => {
  res.status(404).json({ error: 'Route not found' });
};
