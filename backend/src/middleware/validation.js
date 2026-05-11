// Validation middleware for request data
export const validateSubscription = (req, res, next) => {
  const { toolId, renewalDate, price, billingCycle, status } = req.body;

  // Check required fields
  if (!toolId || !renewalDate || !price || !billingCycle) {
    return res.status(400).json({
      error: 'Missing required fields: toolId, renewalDate, price, billingCycle'
    });
  }

  // Validate billing cycle
  const validCycles = ['MONTHLY', 'YEARLY', 'QUARTERLY'];
  if (!validCycles.includes(billingCycle)) {
    return res.status(400).json({
      error: 'Invalid billing cycle. Must be one of: ' + validCycles.join(', ')
    });
  }

  // Validate status
  const validStatuses = ['ACTIVE', 'INACTIVE', 'CANCELLED'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({
      error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
    });
  }

  // Validate price
  if (isNaN(price) || price <= 0) {
    return res.status(400).json({
      error: 'Price must be a positive number'
    });
  }

  // Validate renewal date
  const renewalDateObj = new Date(renewalDate);
  if (isNaN(renewalDateObj.getTime())) {
    return res.status(400).json({
      error: 'Invalid renewal date format'
    });
  }

  next();
};

export const validateTool = (req, res, next) => {
  const { name, type, url, price, categoryId } = req.body;

  // Check required fields
  if (!name || !type) {
    return res.status(400).json({
      error: 'Missing required fields: name, type'
    });
  }

  // Validate name
  if (name.length < 2 || name.length > 100) {
    return res.status(400).json({
      error: 'Tool name must be between 2 and 100 characters'
    });
  }

  // Validate type
  const validTypes = ['SOFTWARE', 'SAAS', 'PLUGIN', 'LICENSE', 'RESOURCE'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      error: 'Invalid tool type. Must be one of: ' + validTypes.join(', ')
    });
  }

  // Validate URL if provided
  if (url && !isValidUrl(url)) {
    return res.status(400).json({
      error: 'Invalid URL format'
    });
  }

  // Validate price if provided
  if (price && (isNaN(price) || price < 0)) {
    return res.status(400).json({
      error: 'Price must be a positive number'
    });
  }

  next();
};

export const validateCategory = (req, res, next) => {
  const { name, description } = req.body;

  // Check required fields
  if (!name) {
    return res.status(400).json({
      error: 'Category name is required'
    });
  }

  // Validate name
  if (name.length < 2 || name.length > 50) {
    return res.status(400).json({
      error: 'Category name must be between 2 and 50 characters'
    });
  }

  // Validate description if provided
  if (description && description.length > 200) {
    return res.status(400).json({
      error: 'Category description must be less than 200 characters'
    });
  }

  next();
};

export const validateAlert = (req, res, next) => {
  const { type, message, scheduledFor } = req.body;

  // Check required fields
  if (!type || !message) {
    return res.status(400).json({
      error: 'Missing required fields: type, message'
    });
  }

  // Validate alert type
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

  // Validate message length
  if (message.length < 5 || message.length > 500) {
    return res.status(400).json({
      error: 'Alert message must be between 5 and 500 characters'
    });
  }

  // Validate scheduled date if provided
  if (scheduledFor) {
    const scheduledDate = new Date(scheduledFor);
    if (isNaN(scheduledDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid scheduled date format'
      });
    }

    // Check if scheduled date is in the future
    if (scheduledDate <= new Date()) {
      return res.status(400).json({
        error: 'Scheduled date must be in the future'
      });
    }
  }

  next();
};

// Helper function to validate URL
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}
