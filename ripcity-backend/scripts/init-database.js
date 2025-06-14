#!/usr/bin/env node

/**
 * MongoDB Database Initialization Script
 * Rip City Ticket Dispatch - Database Setup
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI or DATABASE_URL not found in environment variables');
  process.exit(1);
}

console.log('🚀 Initializing Rip City Ticket Dispatch Database...');

async function initializeDatabase() {
  const client = new MongoClient(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    ssl: true,
    tls: true,
    retryWrites: true,
  });

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('ripcitytickets');

    // Create collections with proper schema validation
    const collections = [
      {
        name: 'users',
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['email', 'createdAt'],
            properties: {
              email: { bsonType: 'string' },
              phone: { bsonType: 'string' },
              subscription: {
                bsonType: 'object',
                properties: {
                  tier: { enum: ['free', 'pro', 'premium', 'enterprise'] },
                  status: { enum: ['active', 'canceled', 'past_due'] },
                  stripeCustomerId: { bsonType: 'string' },
                  stripeSubscriptionId: { bsonType: 'string' }
                }
              },
              preferences: {
                bsonType: 'object',
                properties: {
                  smsConsent: { bsonType: 'bool' },
                  emailAlerts: { bsonType: 'bool' },
                  maxAlertsPerDay: { bsonType: 'int' }
                }
              },
              createdAt: { bsonType: 'date' },
              updatedAt: { bsonType: 'date' }
            }
          }
        }
      },
      {
        name: 'events',
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['name', 'venue', 'date', 'source'],
            properties: {
              name: { bsonType: 'string' },
              venue: { bsonType: 'string' },
              date: { bsonType: 'date' },
              category: { bsonType: 'string' },
              source: { enum: ['ticketmaster', 'eventbrite', 'manual'] },
              externalId: { bsonType: 'string' },
              priceRange: {
                bsonType: 'object',
                properties: {
                  min: { bsonType: 'double' },
                  max: { bsonType: 'double' }
                }
              },
              createdAt: { bsonType: 'date' }
            }
          }
        }
      },
      {
        name: 'deals',
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['eventId', 'originalPrice', 'currentPrice', 'dealScore'],
            properties: {
              eventId: { bsonType: 'objectId' },
              originalPrice: { bsonType: 'double' },
              currentPrice: { bsonType: 'double' },
              dealScore: { bsonType: 'double' },
              discountPercent: { bsonType: 'double' },
              section: { bsonType: 'string' },
              row: { bsonType: 'string' },
              seats: { bsonType: 'array' },
              url: { bsonType: 'string' },
              isActive: { bsonType: 'bool' },
              createdAt: { bsonType: 'date' },
              expiresAt: { bsonType: 'date' }
            }
          }
        }
      },
      {
        name: 'alerts',
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['userId', 'dealId', 'type', 'status'],
            properties: {
              userId: { bsonType: 'objectId' },
              dealId: { bsonType: 'objectId' },
              type: { enum: ['email', 'sms', 'webhook'] },
              status: { enum: ['pending', 'sent', 'failed', 'delivered'] },
              sentAt: { bsonType: 'date' },
              deliveredAt: { bsonType: 'date' },
              createdAt: { bsonType: 'date' }
            }
          }
        }
      },
      {
        name: 'sms_consent',
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['phone', 'consent', 'timestamp'],
            properties: {
              phone: { bsonType: 'string' },
              consent: { bsonType: 'bool' },
              timestamp: { bsonType: 'date' },
              ipAddress: { bsonType: 'string' },
              userAgent: { bsonType: 'string' },
              doubleOptIn: { bsonType: 'bool' },
              source: { bsonType: 'string' }
            }
          }
        }
      }
    ];

    // Create collections
    for (const collection of collections) {
      try {
        await db.createCollection(collection.name, {
          validator: collection.validator
        });
        console.log(`✅ Created collection: ${collection.name}`);
      } catch (error) {
        if (error.code === 48) {
          console.log(`ℹ️  Collection ${collection.name} already exists`);
        } else {
          console.error(`❌ Error creating ${collection.name}:`, error.message);
        }
      }
    }

    // Create indexes for performance
    const indexes = [
      { collection: 'users', index: { email: 1 }, options: { unique: true } },
      { collection: 'users', index: { phone: 1 }, options: { sparse: true } },
      { collection: 'users', index: { 'subscription.stripeCustomerId': 1 }, options: { sparse: true } },
      
      { collection: 'events', index: { date: 1 } },
      { collection: 'events', index: { venue: 1 } },
      { collection: 'events', index: { source: 1, externalId: 1 }, options: { unique: true, sparse: true } },
      
      { collection: 'deals', index: { eventId: 1 } },
      { collection: 'deals', index: { dealScore: -1 } },
      { collection: 'deals', index: { isActive: 1, createdAt: -1 } },
      { collection: 'deals', index: { expiresAt: 1 }, options: { expireAfterSeconds: 0 } },
      
      { collection: 'alerts', index: { userId: 1 } },
      { collection: 'alerts', index: { dealId: 1 } },
      { collection: 'alerts', index: { status: 1, createdAt: -1 } },
      
      { collection: 'sms_consent', index: { phone: 1 }, options: { unique: true } },
      { collection: 'sms_consent', index: { timestamp: -1 } }
    ];

    for (const { collection, index, options = {} } of indexes) {
      try {
        await db.collection(collection).createIndex(index, options);
        console.log(`✅ Created index on ${collection}: ${JSON.stringify(index)}`);
      } catch (error) {
        console.error(`❌ Error creating index on ${collection}:`, error.message);
      }
    }

    console.log('🎉 Database initialization complete!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run the initialization
initializeDatabase().catch(console.error);
