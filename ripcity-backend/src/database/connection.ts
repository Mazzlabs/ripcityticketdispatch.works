/**
 * RIP CITY TICKET DISPATCH - Database Connection
 * Copyright (c) 2024 Joseph Mazzini <joseph@mazzlabs.works>
 * All Rights Reserved. Proprietary Software.
 */

import mongoose from 'mongoose';
import logger from '../utils/logger';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// MongoDB connection configuration - Updated with correct DigitalOcean connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://j-mazz:3Cu8N6Pp5R2y0q79@private-db-mongo-nyc-888-157f5de1.mongo.ondigitalocean.com/ripcity-tickets?tls=true&authSource=admin&replicaSet=db-mongo-nyc-888';

// MongoDB Schemas
const userSchema = new mongoose.Schema({
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

const alertHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dealId: { type: String, required: true },
  type: { type: String, required: true },
  sentAt: { type: Date, default: Date.now }
}, { 
  timestamps: true 
});

const pushSubscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  endpoint: { type: String, required: true },
  keys: { type: mongoose.Schema.Types.Mixed, required: true }
}, { 
  timestamps: true 
});

const smsConsentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
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
export const User = mongoose.model('User', userSchema);
export const AlertHistory = mongoose.model('AlertHistory', alertHistorySchema);
export const PushSubscription = mongoose.model('PushSubscription', pushSubscriptionSchema);
export const SMSConsent = mongoose.model('SMSConsent', smsConsentSchema);

class MongoDB {
  private static instance: MongoDB;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): MongoDB {
    if (!MongoDB.instance) {
      MongoDB.instance = new MongoDB();
    }
    return MongoDB.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      logger.info('MongoDB already connected');
      return;
    }

    try {
      await mongoose.connect(MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      this.isConnected = true;
      logger.info('🍃 MongoDB connected successfully');

      // Handle connection events
      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error:', err);
        this.isConnected = false;
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
      logger.error('Failed to connect to MongoDB:', error);
      this.isConnected = false;
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info('MongoDB disconnected');
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  public isConnectedStatus(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  public getConnection() {
    return mongoose.connection;
  }

  // User Management
  async getUsers() {
    return await User.find().sort({ createdAt: -1 });
  }

  async getUserByEmail(email: string) {
    return await User.findOne({ email });
  }

  async createUser(userData: any) {
    const user = new User(userData);
    return await user.save();
  }

  async updateUser(id: string, updates: any) {
    return await User.findByIdAndUpdate(id, updates, { new: true });
  }

  async deleteUser(id: string) {
    const result = await User.findByIdAndDelete(id);
    return !!result;
  }

  // Alert History
  async addAlertHistory(userId: string, dealId: string, type: string) {
    const alertHistory = new AlertHistory({ userId, dealId, type });
    return await alertHistory.save();
  }

  async getAlertHistory(userId: string) {
    return await AlertHistory.find({ userId }).sort({ sentAt: -1 }).limit(100);
  }

  // Push Subscriptions
  async savePushSubscription(userId: string, subscription: any) {
    return await PushSubscription.findOneAndUpdate(
      { userId, endpoint: subscription.endpoint },
      { userId, endpoint: subscription.endpoint, keys: subscription.keys },
      { upsert: true, new: true }
    );
  }

  async getPushSubscriptions(userId: string) {
    return await PushSubscription.find({ userId });
  }

  // SMS Consent Management
  async createSMSConsent(data: {
    userId: string;
    phoneNumber: string;
    ipAddress?: string;
    userAgent?: string;
    subscriptionTier: string;
    source?: string;
  }) {
    const doubleOptInCode = Math.random().toString(36).substr(2, 6).toUpperCase();
    
    return await SMSConsent.findOneAndUpdate(
      { userId: data.userId, phoneNumber: data.phoneNumber },
      {
        ...data,
        doubleOptInCode,
        doubleOptInSentAt: new Date(),
        doubleOptInConfirmed: false,
        optOutTimestamp: undefined
      },
      { upsert: true, new: true }
    );
  }

  async confirmSMSConsent(userId: string, phoneNumber: string, confirmationCode: string) {
    const result = await SMSConsent.findOneAndUpdate(
      { 
        userId, 
        phoneNumber, 
        doubleOptInCode: confirmationCode,
        doubleOptInConfirmed: false,
        optOutTimestamp: { $exists: false }
      },
      {
        doubleOptInConfirmed: true,
        doubleOptInConfirmedAt: new Date()
      },
      { new: true }
    );
    
    return !!result;
  }

  async optOutSMS(phoneNumber: string) {
    const result = await SMSConsent.findOneAndUpdate(
      { 
        phoneNumber,
        optOutTimestamp: { $exists: false }
      },
      {
        optOutTimestamp: new Date()
      },
      { new: true }
    );
    
    return !!result;
  }

  async getSMSConsent(userId: string) {
    return await SMSConsent.findOne({ 
      userId, 
      optOutTimestamp: { $exists: false }
    }).sort({ createdAt: -1 });
  }

  async getSMSConsentByPhone(phoneNumber: string) {
    return await SMSConsent.findOne({ phoneNumber }).sort({ createdAt: -1 });
  }

  async healthCheck(): Promise<boolean> {
    try {
      const state = mongoose.connection.readyState;
      return state === 1; // 1 = connected
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export default MongoDB.getInstance();
