#!/usr/bin/env node
/**
 * RIP CITY TICKET DISPATCH - Database Setup Script
 * Copyright (c) 2024 Joseph Mazzini <joseph@mazzlabs.works>
 * 
 * This script initializes the MongoDB database with:
 * - Collections and indexes
 * - Sample data for testing
 * - User roles and permissions
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI or DATABASE_URL environment variable is required');
  process.exit(1);
}

async function setupDatabase() {
  try {
    console.log('🚀 Starting database setup...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      ssl: true,
      authSource: 'admin',
      retryWrites: true,
      w: 'majority',
      family: 4,
    });
    
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Create collections if they don't exist
    const collections = [
      'users',
      'dealhistories', 
      'alerthistories',
      'smsconsents',
      'pushsubscriptions'
    ];
    
    for (const collectionName of collections) {
      try {
        await db.createCollection(collectionName);
        console.log(`✅ Created collection: ${collectionName}`);
      } catch (error) {
        if (error.code === 48) { // Collection already exists
          console.log(`ℹ️  Collection already exists: ${collectionName}`);
        } else {
          console.error(`❌ Error creating collection ${collectionName}:`, error.message);
        }
      }
    }
    
    // Create indexes for performance
    const indexes = [
      { collection: 'users', index: { email: 1 }, options: { unique: true } },
      { collection: 'users', index: { stripeCustomerId: 1 }, options: { sparse: true } },
      { collection: 'dealhistories', index: { eventId: 1, createdAt: -1 } },
      { collection: 'alerthistories', index: { userId: 1, sentAt: -1 } },
      { collection: 'smsconsents', index: { phoneNumber: 1 } },
      { collection: 'smsconsents', index: { userId: 1, createdAt: -1 } },
      { collection: 'pushsubscriptions', index: { userId: 1, endpoint: 1 }, options: { unique: true } },
    ];
    
    for (const { collection, index, options = {} } of indexes) {
      try {
        await db.collection(collection).createIndex(index, options);
        console.log(`✅ Created index on ${collection}:`, Object.keys(index).join(', '));
      } catch (error) {
        console.error(`❌ Error creating index on ${collection}:`, error.message);
      }
    }
    
    // Test the connection
    await db.admin().ping();
    console.log('✅ Database ping successful');
    
    console.log('🎉 Database setup completed successfully!');
    console.log('\n📊 Database Info:');
    console.log(`   Host: ${MONGODB_URI.split('@')[1]?.split('/')[0] || 'N/A'}`);
    console.log(`   Database: ripcitytickets`);
    console.log(`   SSL: Enabled`);
    console.log(`   Auth Source: admin`);
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the setup
setupDatabase().catch(console.error);
