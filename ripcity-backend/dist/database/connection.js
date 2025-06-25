"use strict";
/**
 * RIP CITY TICKET DISPATCH - Database Connection
 * Copyright (c) 2024 Joseph Mazzini <joseph@mazzlabs.works>
 * All Rights Reserved. Proprietary Software.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SMSConsent = exports.PushSubscription = exports.AlertHistory = exports.User = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../utils/logger"));
// Load environment variables
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// MongoDB connection configuration - Updated with correct DigitalOcean connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://j-mazz:3Cu8N6Pp5R2y0q79@private-db-mongo-nyc-888-157f5de1.mongo.ondigitalocean.com/ripcity-tickets?tls=true&authSource=admin&replicaSet=db-mongo-nyc-888';
// MongoDB Schemas
const userSchema = new mongoose_1.default.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    subscription: { type: String, default: 'free' },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    preferences: {
        categories: [String],
        venues: [String],
        maxPrice: Number,
        minSavings: Number,
        alertMethods: [String]
    }
}, {
    timestamps: true
});
const alertHistorySchema = new mongoose_1.default.Schema({
    userId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true },
    dealId: { type: String, required: true },
    type: { type: String, required: true },
    sentAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});
const pushSubscriptionSchema = new mongoose_1.default.Schema({
    userId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true },
    endpoint: { type: String, required: true },
    keys: { type: mongoose_1.default.Schema.Types.Mixed, required: true }
}, {
    timestamps: true
});
const smsConsentSchema = new mongoose_1.default.Schema({
    userId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true },
    phoneNumber: { type: String, required: true },
    consentTimestamp: { type: Date, default: Date.now },
    optOutTimestamp: { type: Date },
    ipAddress: String,
    userAgent: String,
    subscriptionTier: String,
    doubleOptInConfirmed: { type: Boolean, default: false },
    doubleOptInCode: String,
    doubleOptInSentAt: Date,
    doubleOptInConfirmedAt: Date,
    source: { type: String, default: 'web_app' }
}, {
    timestamps: true
});
// Create indexes
userSchema.index({ email: 1 });
alertHistorySchema.index({ userId: 1 });
pushSubscriptionSchema.index({ userId: 1 });
smsConsentSchema.index({ userId: 1, phoneNumber: 1 }, { unique: true });
// Create models
exports.User = mongoose_1.default.model('User', userSchema);
exports.AlertHistory = mongoose_1.default.model('AlertHistory', alertHistorySchema);
exports.PushSubscription = mongoose_1.default.model('PushSubscription', pushSubscriptionSchema);
exports.SMSConsent = mongoose_1.default.model('SMSConsent', smsConsentSchema);
class MongoDB {
    constructor() {
        this.isConnected = false;
    }
    static getInstance() {
        if (!MongoDB.instance) {
            MongoDB.instance = new MongoDB();
        }
        return MongoDB.instance;
    }
    async connect() {
        if (this.isConnected) {
            logger_1.default.info('MongoDB already connected');
            return;
        }
        try {
            await mongoose_1.default.connect(MONGODB_URI, {
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });
            this.isConnected = true;
            logger_1.default.info('🍃 MongoDB connected successfully');
            // Handle connection events
            mongoose_1.default.connection.on('error', (err) => {
                logger_1.default.error('MongoDB connection error:', err);
                this.isConnected = false;
            });
            mongoose_1.default.connection.on('disconnected', () => {
                logger_1.default.warn('MongoDB disconnected');
                this.isConnected = false;
            });
            mongoose_1.default.connection.on('reconnected', () => {
                logger_1.default.info('MongoDB reconnected');
                this.isConnected = true;
            });
        }
        catch (error) {
            logger_1.default.error('Failed to connect to MongoDB:', error);
            this.isConnected = false;
            throw error;
        }
    }
    async disconnect() {
        if (!this.isConnected) {
            return;
        }
        try {
            await mongoose_1.default.disconnect();
            this.isConnected = false;
            logger_1.default.info('MongoDB disconnected');
        }
        catch (error) {
            logger_1.default.error('Error disconnecting from MongoDB:', error);
            throw error;
        }
    }
    isConnectedStatus() {
        return this.isConnected && mongoose_1.default.connection.readyState === 1;
    }
    getConnection() {
        return mongoose_1.default.connection;
    }
    // User Management
    async getUsers() {
        return await exports.User.find().sort({ createdAt: -1 });
    }
    async getUserByEmail(email) {
        return await exports.User.findOne({ email });
    }
    async createUser(userData) {
        const user = new exports.User(userData);
        return await user.save();
    }
    async updateUser(id, updates) {
        return await exports.User.findByIdAndUpdate(id, updates, { new: true });
    }
    async deleteUser(id) {
        const result = await exports.User.findByIdAndDelete(id);
        return !!result;
    }
    // Alert History
    async addAlertHistory(userId, dealId, type) {
        const alertHistory = new exports.AlertHistory({ userId, dealId, type });
        return await alertHistory.save();
    }
    async getAlertHistory(userId) {
        return await exports.AlertHistory.find({ userId }).sort({ sentAt: -1 }).limit(100);
    }
    // Push Subscriptions
    async savePushSubscription(userId, subscription) {
        return await exports.PushSubscription.findOneAndUpdate({ userId, endpoint: subscription.endpoint }, { userId, endpoint: subscription.endpoint, keys: subscription.keys }, { upsert: true, new: true });
    }
    async getPushSubscriptions(userId) {
        return await exports.PushSubscription.find({ userId });
    }
    // SMS Consent Management
    async createSMSConsent(data) {
        const doubleOptInCode = Math.random().toString(36).substr(2, 6).toUpperCase();
        return await exports.SMSConsent.findOneAndUpdate({ userId: data.userId, phoneNumber: data.phoneNumber }, {
            ...data,
            doubleOptInCode,
            doubleOptInSentAt: new Date(),
            doubleOptInConfirmed: false,
            optOutTimestamp: undefined
        }, { upsert: true, new: true });
    }
    async confirmSMSConsent(userId, phoneNumber, confirmationCode) {
        const result = await exports.SMSConsent.findOneAndUpdate({
            userId,
            phoneNumber,
            doubleOptInCode: confirmationCode,
            doubleOptInConfirmed: false,
            optOutTimestamp: { $exists: false }
        }, {
            doubleOptInConfirmed: true,
            doubleOptInConfirmedAt: new Date()
        }, { new: true });
        return !!result;
    }
    async optOutSMS(phoneNumber) {
        const result = await exports.SMSConsent.findOneAndUpdate({
            phoneNumber,
            optOutTimestamp: { $exists: false }
        }, {
            optOutTimestamp: new Date()
        }, { new: true });
        return !!result;
    }
    async getSMSConsent(userId) {
        return await exports.SMSConsent.findOne({
            userId,
            optOutTimestamp: { $exists: false }
        }).sort({ createdAt: -1 });
    }
    async getSMSConsentByPhone(phoneNumber) {
        return await exports.SMSConsent.findOne({ phoneNumber }).sort({ createdAt: -1 });
    }
    async healthCheck() {
        try {
            const state = mongoose_1.default.connection.readyState;
            return state === 1; // 1 = connected
        }
        catch (error) {
            logger_1.default.error('Database health check failed:', error);
            return false;
        }
    }
}
// Export singleton instance
exports.default = MongoDB.getInstance();
