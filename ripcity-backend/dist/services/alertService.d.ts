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
declare class AlertService {
    private alerts;
    createAlert(userId: string, config: AlertConfig): Alert;
    getAlert(alertId: string): Alert | undefined;
    getUserAlerts(userId: string): Alert[];
    updateAlert(alertId: string, config: Partial<AlertConfig>): Alert | null;
    deleteAlert(alertId: string): boolean;
    private generateId;
}
declare const _default: AlertService;
export default _default;
