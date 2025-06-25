"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.monetizedAlertService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const twilio_1 = __importDefault(require("twilio"));
const stripeService_1 = require("./stripeService");
const smsConsentService_1 = require("./smsConsentService");
const logger_1 = require("../utils/logger");
class MonetizedAlertService {
    constructor() {
        // Email setup
        this.emailTransporter = nodemailer_1.default.createTransport({
            service: 'gmail', // or your preferred email service
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        // SMS setup
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
            this.twilioClient = (0, twilio_1.default)(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        }
    }
    /**
     * Send an alert to a user (enforces subscription limits)
     */
    async sendAlert(userId, deal, preferences) {
        try {
            // Check user's subscription tier and limits
            const subscription = await stripeService_1.stripeService.getSubscription(userId);
            const tier = subscription?.items.data[0]?.price.nickname || 'free';
            // Enforce tier limits
            const dailyLimit = this.getDailyAlertLimit(tier);
            const todayAlerts = await this.getTodayAlertCount(userId);
            if (todayAlerts >= dailyLimit) {
                logger_1.logger.warn(`User ${userId} has reached daily alert limit (${dailyLimit})`);
                return [];
            }
            const alertsToSend = [];
            // Calculate savings
            const savings = deal.originalPrice - deal.currentPrice;
            const savingsPercentage = (savings / deal.originalPrice) * 100;
            // Check if deal meets user's minimum savings threshold
            if (savingsPercentage < preferences.minSavingsPercentage) {
                return [];
            }
            // Create alert object
            const alert = {
                id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                userId,
                dealId: deal.id,
                venue: deal.venue,
                originalPrice: deal.originalPrice,
                currentPrice: deal.currentPrice,
                savings,
                savingsPercentage,
                alertLevel: this.getAlertLevel(savingsPercentage),
                sentAt: new Date(),
                method: 'email' // Will be updated per method
            };
            // Send email alert (all tiers)
            if (preferences.alertMethods.includes('email') && preferences.email) {
                try {
                    await this.sendEmailAlert(preferences.email, alert, deal);
                    alertsToSend.push({ ...alert, method: 'email' });
                    logger_1.logger.info(`Email alert sent to ${preferences.email} for deal ${deal.id}`);
                }
                catch (error) {
                    logger_1.logger.error('Failed to send email alert:', error);
                }
            }
            // Send SMS alert (Pro tier and above) - Check SMS consent first
            if (preferences.alertMethods.includes('sms') && preferences.phone && tier !== 'free') {
                try {
                    // Verify SMS consent before sending
                    const canReceiveSMS = await smsConsentService_1.smsConsentService.canReceiveSMS(userId);
                    if (canReceiveSMS) {
                        await this.sendSMSAlert(preferences.phone, alert, deal);
                        alertsToSend.push({ ...alert, method: 'sms' });
                        logger_1.logger.info(`SMS alert sent to ${preferences.phone} for deal ${deal.id}`);
                    }
                    else {
                        logger_1.logger.warn(`SMS consent not found or expired for user ${userId}`);
                    }
                }
                catch (error) {
                    logger_1.logger.error('Failed to send SMS alert:', error);
                }
            }
            // Send webhook alert (Premium tier and above)
            if (preferences.alertMethods.includes('webhook') && preferences.webhook && tier === 'premium') {
                try {
                    await this.sendWebhookAlert(preferences.webhook, alert, deal);
                    alertsToSend.push({ ...alert, method: 'webhook' });
                    logger_1.logger.info(`Webhook alert sent to ${preferences.webhook} for deal ${deal.id}`);
                }
                catch (error) {
                    logger_1.logger.error('Failed to send webhook alert:', error);
                }
            }
            // TODO: Increment user's alert count in database
            return alertsToSend;
        }
        catch (error) {
            logger_1.logger.error('Error in sendAlert:', error);
            return [];
        }
    }
    getDailyAlertLimit(tier) {
        switch (tier) {
            case 'free': return 3;
            case 'pro': return 15;
            case 'premium': return 50;
            default: return 3;
        }
    }
    getAlertLevel(savingsPercentage) {
        if (savingsPercentage >= 50)
            return 'hot';
        if (savingsPercentage >= 30)
            return 'warm';
        if (savingsPercentage >= 15)
            return 'good';
        return 'normal';
    }
    async getTodayAlertCount(userId) {
        // TODO: Implement database query to get today's alert count
        return 0;
    }
    async sendEmailAlert(email, alert, deal) {
        const subject = `🎟️ ${alert.alertLevel.toUpperCase()} Deal Alert: ${deal.name}`;
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e53e3e;">🎟️ Rip City Ticket Alert</h2>
        <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>${deal.name}</h3>
          <p><strong>Venue:</strong> ${deal.venue}</p>
          <p><strong>Original Price:</strong> $${alert.originalPrice}</p>
          <p><strong>Current Price:</strong> $${alert.currentPrice}</p>
          <p style="color: #38a169; font-size: 18px; font-weight: bold;">
            💰 Save $${alert.savings} (${alert.savingsPercentage.toFixed(1)}%)
          </p>
          <a href="${deal.url}" style="background: #e53e3e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 10px;">
            View Deal
          </a>
        </div>
        <p style="color: #666; font-size: 12px;">
          This alert was sent because the deal meets your savings threshold of ${alert.savingsPercentage}%.
        </p>
      </div>
    `;
        await this.emailTransporter.sendMail({
            from: process.env.EMAIL_FROM || 'alerts@ripcityticketdispatch.works',
            to: email,
            subject,
            html
        });
    }
    async sendSMSAlert(phone, alert, deal) {
        if (!this.twilioClient) {
            throw new Error('Twilio not configured');
        }
        // Check if phone number is opted out before sending
        const isOptedOut = await smsConsentService_1.smsConsentService.isPhoneOptedOut(phone);
        if (isOptedOut) {
            throw new Error('Phone number has opted out of SMS alerts');
        }
        const message = `🌹 RIP CITY ALERT: ${deal.name} at ${deal.venue}. Was $${alert.originalPrice}, now $${alert.currentPrice}. Save $${alert.savings} (${alert.savingsPercentage.toFixed(1)}%)! ${deal.url}

Reply STOP to opt-out`;
        await this.twilioClient.messages.create({
            body: message,
            from: process.env.TWILIO_FROM_NUMBER,
            to: phone
        });
    }
    async sendWebhookAlert(webhookUrl, alert, deal) {
        const payload = {
            alert,
            deal,
            timestamp: new Date().toISOString(),
            source: 'ripcityticketdispatch'
        };
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'RipCityTicketDispatch/1.0'
            },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
        }
    }
    /**
     * Get user's alert preferences
     */
    async getAlertPreferences(userId) {
        // TODO: Implement database query
        return {
            userId,
            email: 'user@example.com',
            minSavingsPercentage: 15,
            alertMethods: ['email'],
            maxAlertsPerDay: 5,
            categories: ['sports'],
            venues: ['Moda Center']
        };
    }
    /**
     * Update user's alert preferences
     */
    async updateAlertPreferences(userId, preferences) {
        // TODO: Implement database update
        logger_1.logger.info(`Updated alert preferences for user ${userId}`, preferences);
    }
}
exports.monetizedAlertService = new MonetizedAlertService();
exports.default = exports.monetizedAlertService;
