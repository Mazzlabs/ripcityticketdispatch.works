/**
 * RIP CITY TICKET DISPATCH - Database Connection
 * Copyright (c) 2024 Joseph Mazzini <joseph@mazzlabs.works>
 * All Rights Reserved. Proprietary Software.
 */

import { Pool, PoolClient } from 'pg';
import logger from '../utils/logger';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  subscription?: string;
  isActive?: boolean;
  lastLogin?: Date;
  preferences?: {
    categories?: string[];
    venues?: string[];
    maxPrice?: number;
    minSavings?: number;
    alertMethods?: string[];
  };
  createdAt: Date;
}

interface AlertHistory {
  id: string;
  userId: string;
  dealId: string;
  sentAt: Date;
  type: string;
}

interface PushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  keys: any;
}

class PostgreSQLDB {
  private pool: Pool;
  private isInitialized = false;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    this.pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '20'),
      idleTimeoutMillis: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '30000'),
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      logger.error('Unexpected error on idle client', err);
    });
  }

  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const client = await this.pool.connect();
      
      // Create tables if they don't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          first_name VARCHAR(255) NOT NULL,
          last_name VARCHAR(255) NOT NULL,
          subscription VARCHAR(50) DEFAULT 'free',
          is_active BOOLEAN DEFAULT true,
          last_login TIMESTAMP,
          preferences JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS alert_history (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          deal_id VARCHAR(255) NOT NULL,
          sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          type VARCHAR(50) NOT NULL
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS push_subscriptions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          endpoint TEXT NOT NULL,
          keys JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // SMS Consent tracking table for TCPA compliance
      await client.query(`
        CREATE TABLE IF NOT EXISTS sms_consent (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          phone_number VARCHAR(20) NOT NULL,
          consent_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          opt_out_timestamp TIMESTAMP NULL,
          ip_address INET,
          user_agent TEXT,
          subscription_tier VARCHAR(20),
          double_opt_in_confirmed BOOLEAN DEFAULT FALSE,
          double_opt_in_code VARCHAR(10),
          double_opt_in_sent_at TIMESTAMP,
          double_opt_in_confirmed_at TIMESTAMP,
          source VARCHAR(50) DEFAULT 'web_app',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, phone_number)
        );
      `);

      // Create indexes for better performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_alert_history_user_id ON alert_history(user_id);
        CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
      `);

      client.release();
      this.isInitialized = true;
      logger.info('PostgreSQL database initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize database:', error);
      throw error;
    }
  }

  async getUsers(): Promise<User[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT id, email, password, first_name as "firstName", last_name as "lastName",
               subscription, is_active as "isActive", last_login as "lastLogin",
               preferences, created_at as "createdAt"
        FROM users
        ORDER BY created_at DESC
      `);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT id, email, password, first_name as "firstName", last_name as "lastName",
               subscription, is_active as "isActive", last_login as "lastLogin",
               preferences, created_at as "createdAt"
        FROM users WHERE email = $1
      `, [email]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO users (email, password, first_name, last_name, subscription, is_active, preferences)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, email, password, first_name as "firstName", last_name as "lastName",
                  subscription, is_active as "isActive", last_login as "lastLogin",
                  preferences, created_at as "createdAt"
      `, [
        user.email,
        user.password,
        user.firstName,
        user.lastName,
        user.subscription || 'free',
        user.isActive !== false,
        JSON.stringify(user.preferences || {})
      ]);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const client = await this.pool.connect();
    try {
      const setClause = [];
      const values = [];
      let paramIndex = 1;

      if (updates.email) {
        setClause.push(`email = $${paramIndex++}`);
        values.push(updates.email);
      }
      if (updates.password) {
        setClause.push(`password = $${paramIndex++}`);
        values.push(updates.password);
      }
      if (updates.firstName) {
        setClause.push(`first_name = $${paramIndex++}`);
        values.push(updates.firstName);
      }
      if (updates.lastName) {
        setClause.push(`last_name = $${paramIndex++}`);
        values.push(updates.lastName);
      }
      if (updates.subscription) {
        setClause.push(`subscription = $${paramIndex++}`);
        values.push(updates.subscription);
      }
      if (updates.isActive !== undefined) {
        setClause.push(`is_active = $${paramIndex++}`);
        values.push(updates.isActive);
      }
      if (updates.lastLogin) {
        setClause.push(`last_login = $${paramIndex++}`);
        values.push(updates.lastLogin);
      }
      if (updates.preferences) {
        setClause.push(`preferences = $${paramIndex++}`);
        values.push(JSON.stringify(updates.preferences));
      }

      if (setClause.length === 0) return null;

      values.push(id);
      const result = await client.query(`
        UPDATE users SET ${setClause.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, email, password, first_name as "firstName", last_name as "lastName",
                  subscription, is_active as "isActive", last_login as "lastLogin",
                  preferences, created_at as "createdAt"
      `, values);

      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('DELETE FROM users WHERE id = $1', [id]);
      return (result.rowCount ?? 0) > 0;
    } finally {
      client.release();
    }
  }

  async addAlertHistory(userId: string, dealId: string, type: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO alert_history (user_id, deal_id, type)
        VALUES ($1, $2, $3)
      `, [userId, dealId, type]);
    } finally {
      client.release();
    }
  }

  async getAlertHistory(userId: string): Promise<AlertHistory[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT id, user_id as "userId", deal_id as "dealId", sent_at as "sentAt", type
        FROM alert_history
        WHERE user_id = $1
        ORDER BY sent_at DESC
        LIMIT 100
      `, [userId]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async savePushSubscription(userId: string, subscription: any): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO push_subscriptions (user_id, endpoint, keys)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, endpoint) DO UPDATE SET keys = $3
      `, [userId, subscription.endpoint, JSON.stringify(subscription.keys)]);
    } finally {
      client.release();
    }
  }

  async getPushSubscriptions(userId: string): Promise<PushSubscription[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT id, user_id as "userId", endpoint, keys
        FROM push_subscriptions
        WHERE user_id = $1
      `, [userId]);
      return result.rows.map(row => ({
        ...row,
        keys: row.keys
      }));
    } finally {
      client.release();
    }
  }

  // SMS Consent Management for TCPA Compliance
  async createSMSConsent(data: {
    userId: string;
    phoneNumber: string;
    ipAddress?: string;
    userAgent?: string;
    subscriptionTier: string;
    source?: string;
  }): Promise<any> {
    const client = await this.pool.connect();
    try {
      const doubleOptInCode = Math.random().toString(36).substr(2, 6).toUpperCase();
      
      const result = await client.query(`
        INSERT INTO sms_consent 
        (user_id, phone_number, ip_address, user_agent, subscription_tier, double_opt_in_code, double_opt_in_sent_at, source)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7)
        ON CONFLICT (user_id, phone_number) 
        DO UPDATE SET 
          subscription_tier = $5,
          double_opt_in_code = $6,
          double_opt_in_sent_at = CURRENT_TIMESTAMP,
          double_opt_in_confirmed = FALSE,
          opt_out_timestamp = NULL,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id, user_id as "userId", phone_number as "phoneNumber", 
                  double_opt_in_code as "doubleOptInCode", created_at as "createdAt"
      `, [data.userId, data.phoneNumber, data.ipAddress, data.userAgent, data.subscriptionTier, doubleOptInCode, data.source || 'web_app']);
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async confirmSMSConsent(userId: string, phoneNumber: string, confirmationCode: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        UPDATE sms_consent 
        SET double_opt_in_confirmed = TRUE, 
            double_opt_in_confirmed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 
          AND phone_number = $2 
          AND double_opt_in_code = $3 
          AND double_opt_in_confirmed = FALSE
          AND opt_out_timestamp IS NULL
      `, [userId, phoneNumber, confirmationCode]);
      
      return (result.rowCount ?? 0) > 0;
    } finally {
      client.release();
    }
  }

  async optOutSMS(phoneNumber: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        UPDATE sms_consent 
        SET opt_out_timestamp = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE phone_number = $1 
          AND opt_out_timestamp IS NULL
      `, [phoneNumber]);
      
      return (result.rowCount ?? 0) > 0;
    } finally {
      client.release();
    }
  }

  async getSMSConsent(userId: string): Promise<any | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT id, user_id as "userId", phone_number as "phoneNumber",
               consent_timestamp as "consentTimestamp", opt_out_timestamp as "optOutTimestamp",
               subscription_tier as "subscriptionTier", double_opt_in_confirmed as "doubleOptInConfirmed",
               double_opt_in_confirmed_at as "doubleOptInConfirmedAt", created_at as "createdAt"
        FROM sms_consent
        WHERE user_id = $1 
          AND opt_out_timestamp IS NULL
        ORDER BY created_at DESC
        LIMIT 1
      `, [userId]);
      
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async getSMSConsentByPhone(phoneNumber: string): Promise<any | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT id, user_id as "userId", phone_number as "phoneNumber",
               consent_timestamp as "consentTimestamp", opt_out_timestamp as "optOutTimestamp",
               subscription_tier as "subscriptionTier", double_opt_in_confirmed as "doubleOptInConfirmed",
               double_opt_in_confirmed_at as "doubleOptInConfirmedAt", created_at as "createdAt"
        FROM sms_consent
        WHERE phone_number = $1
        ORDER BY created_at DESC
        LIMIT 1
      `, [phoneNumber]);
      
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  async healthCheck(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }
}

// Create and export database instance
const db = new PostgreSQLDB();

export default db;
