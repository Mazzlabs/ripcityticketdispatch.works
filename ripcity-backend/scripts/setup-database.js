/**
 * RIP CITY TICKET DISPATCH - MongoDB Database Setup
 * Copyright (c) 2024 Joseph Mazzini <joseph@mazzlabs.works>
 * All Rights Reserved. Proprietary Software.
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://j-mazz:3Cu8N6Pp5R2y0q79@private-db-mongo-nyc-888-157f5de1.mongo.ondigitalocean.com/ripcity-tickets?retryWrites=true&w=majority';

async function setupDatabase() {
  console.log('🚀 Setting up MongoDB database...');
  
  try {
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Create collections with validation
    console.log('📋 Creating collections...');
    
    // Users collection
    try {
      await db.createCollection('users', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['email', 'password', 'firstName', 'lastName'],
            properties: {
              email: { bsonType: 'string' },
              password: { bsonType: 'string' },
              firstName: { bsonType: 'string' },
              lastName: { bsonType: 'string' },
              subscription: { bsonType: 'string' },
              isActive: { bsonType: 'bool' }
            }
          }
        }
      });
      console.log('✅ Users collection created');
    } catch (err) {
      if (err.code === 48) {
        console.log('📝 Users collection already exists');
      } else {
        throw err;
      }
    }
    
    // Create indexes
    console.log('🔍 Creating indexes...');
    
    const usersCollection = db.collection('users');
    await usersCollection.createIndex({ email: 1 }, { unique: true });
    console.log('✅ Email index created');
    
    const alertHistoriesCollection = db.collection('alerthistories');
    await alertHistoriesCollection.createIndex({ userId: 1 });
    console.log('✅ Alert histories index created');
    
    const pushSubscriptionsCollection = db.collection('pushsubscriptions');
    await pushSubscriptionsCollection.createIndex({ userId: 1 });
    console.log('✅ Push subscriptions index created');
    
    const smsConsentsCollection = db.collection('smsconsents');
    await smsConsentsCollection.createIndex({ userId: 1, phoneNumber: 1 }, { unique: true });
    console.log('✅ SMS consents index created');
    
    console.log('🎉 Database setup completed successfully!');
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();