/**
 * RIP CITY TICKET DISPATCH - MongoDB Connection
 * Copyright (c) 2024 Joseph Mazzini <joseph@mazzlabs.works>
 * All Rights Reserved. Proprietary Software.
 */

import mongoose from 'mongoose';
import logger from '../utils/logger';
import dotenv from 'dotenv';

dotenv.config();

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  subscription: { type: String, default: 'free', enum: ['free', 'pro', 'premium', 'enterprise'] },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  preferences: {
    categories: [{ type: String, enum: ['sports', 'music', 'theater', 'family'] }],
    venues: [String],
    maxPrice: Number,
    minSavings: Number,
    alertMethods: [{ type: String, enum: ['email', 'sms', 'push'] }]
  },
  stripeCustomerId: String,
}, {
  timestamps: true
});

// Alert History Schema
const alertHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dealId: { type: String, required: true },
  sentAt: { type: Date, default: Date.now },
  type: { type: String, required: true, enum: ['email', 'sms', 'push', 'webhook'] }
}, {
  timestamps: true
});

// SMS Consent Schema for TCPA Compliance
const smsConsentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  phoneNumber: { type: String, required: true },
  consentTimestamp: { type: Date, default: Date.now },
  optOutTimestamp: { type: Date },
  ipAddress: String,
  userAgent: String,
  subscriptionTier: { type: String, required: true },
  doubleOptInConfirmed: { type: Boolean, default: false },
  doubleOptInCode: String,
  doubleOptInSentAt: Date,
  doubleOptInConfirmedAt: Date,
  source: { type: String, default: 'web_app' }
}, {
  timestamps: true
});

// Push Subscription Schema
const pushSubscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  endpoint: { type: String, required: true },
  keys: {
    p256dh: String,
    auth: String
  }
}, {
  timestamps: true
});

// Create models
export const User = mongoose.model('User', userSchema);
export const AlertHistory = mongoose.model('AlertHistory', alertHistorySchema);
export const SMSConsent = mongoose.model('SMSConsent', smsConsentSchema);
export const PushSubscription = mongoose.model('PushSubscription', pushSubscriptionSchema);

class MongoDB {
  private isConnected = false;

  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
      
      if (!mongoUri) {
        throw new Error('MONGODB_URI or DATABASE_URL environment variable is required');
      }

      await mongoose.connect(mongoUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        ssl: true,
        authSource: 'admin',
        retryWrites: true,
        w: 'majority',
        family: 4, // Use IPv4, skip trying IPv6
      });

      this.isConnected = true;
      logger.info('🍃 MongoDB connected successfully');

      // Handle connection events
      mongoose.connection.on('error', (error) => {
        logger.error('MongoDB connection error:', error);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
        this.isConnected = true;
      });

    } catch (error) {
      logger.error('MongoDB connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) return;

    try {
      await mongoose.connection.close();
      this.isConnected = false;
      logger.info('MongoDB disconnected');
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await mongoose.connection.db.admin().ping();
      return true;
    } catch (error) {
      logger.error('MongoDB health check failed:', error);
      return false;
    }
  }

  // User operations
  async createUser(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    subscription?: string;
    preferences?: any;
  }) {
    const user = new User(userData);
    return await user.save();
  }

  async getUserByEmail(email: string) {
    return await User.findOne({ email });
  }

  async getUserById(id: string) {
    return await User.findById(id);
  }

  async updateUser(id: string, updates: any) {
    return await User.findByIdAndUpdate(id, updates, { new: true });
  }

  // SMS Consent operations
  async createSMSConsent(data: {
    userId: string;
    phoneNumber: string;
    subscriptionTier: string;
    ipAddress?: string;
    userAgent?: string;
    source?: string;
  }) {
    const doubleOptInCode = Math.random().toString(36).substr(2, 6).toUpperCase();
    
    const consent = new SMSConsent({
      ...data,
      doubleOptInCode,
      doubleOptInSentAt: new Date()
    });

    return await consent.save();
  }

  async confirmSMSConsent(userId: string, phoneNumber: string, confirmationCode: string) {
    const consent = await SMSConsent.findOneAndUpdate(
      {
        userId,
        phoneNumber,
        doubleOptInCode: confirmationCode,
        doubleOptInConfirmed: false,
        optOutTimestamp: null
      },
      {
        doubleOptInConfirmed: true,
        doubleOptInConfirmedAt: new Date()
      },
      { new: true }
    );

    return !!consent;
  }

  async optOutSMS(phoneNumber: string) {
    const consent = await SMSConsent.findOneAndUpdate(
      { phoneNumber, optOutTimestamp: null },
      { optOutTimestamp: new Date() },
      { new: true }
    );

    return !!consent;
  }

  async getSMSConsent(userId: string) {
    return await SMSConsent.findOne({ userId, optOutTimestamp: null }).sort({ createdAt: -1 });
  }

  async getSMSConsentByPhone(phoneNumber: string) {
    return await SMSConsent.findOne({ phoneNumber }).sort({ createdAt: -1 });
  }

  // Alert History operations
  async addAlertHistory(userId: string, dealId: string, type: string) {
    const alert = new AlertHistory({ userId, dealId, type });
    return await alert.save();
  }

  async getAlertHistory(userId: string) {
    return await AlertHistory.find({ userId }).sort({ sentAt: -1 }).limit(100);
  }

  // Push Subscription operations
  async savePushSubscription(userId: string, subscription: any) {
    return await PushSubscription.findOneAndUpdate(
      { userId, endpoint: subscription.endpoint },
      { userId, ...subscription },
      { upsert: true, new: true }
    );
  }

  async getPushSubscriptions(userId: string) {
    return await PushSubscription.find({ userId });
  }
}

// Create and export database instance
const db = new MongoDB();
export default db;
