/**
 * Validación manual del cuerpo de petición (sin Zod).
 * Middlewares para suscripciones, herramientas, categorías y alertas.
 */

/** Valida campos obligatorios y enums de una suscripción nueva o actualizada. */
export const validateSubscription = (req, res, next) => {
  const { toolId, renewalDate, price, billingCycle, status } = req.body;

  if (!toolId || !renewalDate || !price || !billingCycle) {
    return res.status(400).json({
      error: 'Missing required fields: toolId, renewalDate, price, billingCycle'
    });
  }

  const validCycles = ['MONTHLY', 'YEARLY', 'QUARTERLY'];
  if (!validCycles.includes(billingCycle)) {
    return res.status(400).json({
      error: 'Invalid billing cycle. Must be one of: ' + validCycles.join(', ')
    });
  }

  const validStatuses = ['ACTIVE', 'INACTIVE', 'CANCELLED'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({
      error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
    });
  }

  if (isNaN(price) || price <= 0) {
    return res.status(400).json({
      error: 'Price must be a positive number'
    });
  }

  const renewalDateObj = new Date(renewalDate);
  if (isNaN(renewalDateObj.getTime())) {
    return res.status(400).json({
      error: 'Invalid renewal date format'
    });
  }

  next();
};

/** Valida nombre, tipo, URL opcional y precio de una herramienta. */
export const validateTool = (req, res, next) => {
  const { name, type, url, price, categoryId } = req.body;

  if (!name || !type) {
    return res.status(400).json({
      error: 'Missing required fields: name, type'
    });
  }

  if (name.length < 2 || name.length > 100) {
    return res.status(400).json({
      error: 'Tool name must be between 2 and 100 characters'
    });
  }

  const validTypes = ['SOFTWARE', 'SAAS', 'PLUGIN', 'LICENSE', 'RESOURCE'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      error: 'Invalid tool type. Must be one of: ' + validTypes.join(', ')
    });
  }

  if (url && !isValidUrl(url)) {
    return res.status(400).json({
      error: 'Invalid URL format'
    });
  }

  if (price && (isNaN(price) || price < 0)) {
    return res.status(400).json({
      error: 'Price must be a positive number'
    });
  }

  next();
};

/** Valida nombre y descripción opcional de categoría. */
export const validateCategory = (req, res, next) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({
      error: 'Category name is required'
    });
  }

  if (name.length < 2 || name.length > 50) {
    return res.status(400).json({
      error: 'Category name must be between 2 and 50 characters'
    });
  }

  if (description && description.length > 200) {
    return res.status(400).json({
      error: 'Category description must be less than 200 characters'
    });
  }

  next();
};

/** Valida tipo, mensaje y fecha programada opcional de una alerta. */
export const validateAlert = (req, res, next) => {
  const { type, message, scheduledFor } = req.body;

  if (!type || !message) {
    return res.status(400).json({
      error: 'Missing required fields: type, message'
    });
  }

  const validTypes = [
    'RENEWAL_REMINDER',
    'PRICE_CHANGE',
    'SERVICE_DISCONTINUATION',
    'NEW_FEATURE',
    'SYSTEM_MAINTENANCE'
  ];

  if (!validTypes.includes(type)) {
    return res.status(400).json({
      error: 'Invalid alert type. Must be one of: ' + validTypes.join(', ')
    });
  }

  if (message.length < 5 || message.length > 500) {
    return res.status(400).json({
      error: 'Alert message must be between 5 and 500 characters'
    });
  }

  if (scheduledFor) {
    const scheduledDate = new Date(scheduledFor);
    if (isNaN(scheduledDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid scheduled date format'
      });
    }

    if (scheduledDate <= new Date()) {
      return res.status(400).json({
        error: 'Scheduled date must be in the future'
      });
    }
  }

  next();
};

/** Comprueba que la cadena sea una URL absoluta válida. */
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}
