export interface AlertConfig {
  email?: string;
  phone?: string;
  maxPrice?: number;
  minPrice?: number;
  eventTypes?: string[];
  venues?: string[];
}

export interface Alert {
  id: string;
  userId: string;
  config: AlertConfig;
  isActive: boolean;
  createdAt: Date;
  lastTriggered?: Date;
}

class AlertService {
  private alerts: Map<string, Alert> = new Map();

  createAlert(userId: string, config: AlertConfig): Alert {
    const alert: Alert = {
      id: this.generateId(),
      userId,
      config,
      isActive: true,
      createdAt: new Date()
    };

    this.alerts.set(alert.id, alert);
    return alert;
  }

  getAlert(alertId: string): Alert | undefined {
    return this.alerts.get(alertId);
  }

  getUserAlerts(userId: string): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => alert.userId === userId);
  }

  updateAlert(alertId: string, config: Partial<AlertConfig>): Alert | null {
    const alert = this.alerts.get(alertId);
    if (!alert) return null;

    alert.config = { ...alert.config, ...config };
    this.alerts.set(alertId, alert);
    return alert;
  }

  deleteAlert(alertId: string): boolean {
    return this.alerts.delete(alertId);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

export default new AlertService();