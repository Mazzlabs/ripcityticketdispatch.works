"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AlertService {
    constructor() {
        this.alerts = new Map();
    }
    createAlert(userId, config) {
        const alert = {
            id: this.generateId(),
            userId,
            config,
            isActive: true,
            createdAt: new Date()
        };
        this.alerts.set(alert.id, alert);
        return alert;
    }
    getAlert(alertId) {
        return this.alerts.get(alertId);
    }
    getUserAlerts(userId) {
        return Array.from(this.alerts.values()).filter(alert => alert.userId === userId);
    }
    updateAlert(alertId, config) {
        const alert = this.alerts.get(alertId);
        if (!alert)
            return null;
        alert.config = { ...alert.config, ...config };
        this.alerts.set(alertId, alert);
        return alert;
    }
    deleteAlert(alertId) {
        return this.alerts.delete(alertId);
    }
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
}
exports.default = new AlertService();
