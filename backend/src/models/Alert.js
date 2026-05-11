class Alert {
  static TYPES = {
    RENEWAL_REMINDER: 'RENEWAL_REMINDER',
    PRICE_CHANGE: 'PRICE_CHANGE',
    SERVICE_DISCONTINUATION: 'SERVICE_DISCONTINUATION',
    NEW_FEATURE: 'NEW_FEATURE',
    SYSTEM_MAINTENANCE: 'SYSTEM_MAINTENANCE'
  };

  static PRIORITIES = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL'
  };

  constructor(data) {
    this.id = data.id;
    this.userId = data.userId;
    this.subscriptionId = data.subscriptionId;
    this.type = data.type;
    this.message = data.message;
    this.priority = data.priority || Alert.PRIORITIES.MEDIUM;
    this.scheduledFor = data.scheduledFor;
    this.isRead = data.isRead || false;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  // Static methods for creating different types of alerts
  static createRenewalAlert(subscription) {
    const daysUntilRenewal = Math.ceil((subscription.renewalDate - new Date()) / (1000 * 60 * 60 * 24));
    
    return {
      type: Alert.TYPES.RENEWAL_REMINDER,
      message: `Your subscription to ${subscription.tool.name} will renew in ${daysUntilRenewal} days`,
      priority: daysUntilRenewal <= 7 ? Alert.PRIORITIES.HIGH : Alert.PRIORITIES.MEDIUM,
      scheduledFor: new Date(Date.now() + (7 - daysUntilRenewal) * 24 * 60 * 60 * 1000)
    };
  }

  static createPriceChangeAlert(subscription, oldPrice, newPrice) {
    return {
      type: Alert.TYPES.PRICE_CHANGE,
      message: `Price change for ${subscription.tool.name}: ${oldPrice}€ → ${newPrice}€`,
      priority: Math.abs(newPrice - oldPrice) > 10 ? Alert.PRIORITIES.HIGH : Alert.PRIORITIES.MEDIUM
    };
  }

  static createServiceDiscontinuationAlert(subscription) {
    return {
      type: Alert.TYPES.SERVICE_DISCONTINUATION,
      message: `${subscription.tool.name} will be discontinued. Please export your data.`,
      priority: Alert.PRIORITIES.CRITICAL
    };
  }

  // Instance methods
  markAsRead() {
    this.isRead = true;
    this.updatedAt = new Date();
  }

  updateMessage(newMessage) {
    this.message = newMessage;
    this.updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      subscriptionId: this.subscriptionId,
      type: this.type,
      message: this.message,
      priority: this.priority,
      scheduledFor: this.scheduledFor,
      isRead: this.isRead,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

export default Alert;
