/**
 * RIP CITY TICKET DISPATCH - MongoDB Connection Test
 * Copyright (c) 2024 Joseph Mazzini <joseph@mazzlabs.works>
 * All Rights Reserved. Proprietary Software.
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://j-mazz:3Cu8N6Pp5R2y0q79@private-db-mongo-nyc-888-157f5de1.mongo.ondigitalocean.com/ripcity-tickets?retryWrites=true&w=majority';

async function testConnection() {
  console.log('🔍 Testing MongoDB connection...');
  console.log('URI:', MONGODB_URI.replace(/\/\/[^@]+@/, '//***:***@')); // Hide credentials
  
  try {
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ MongoDB connected successfully!');
    
    // Test basic operations
    const testCollection = mongoose.connection.db.collection('test');
    
    // Insert test document
    const insertResult = await testCollection.insertOne({
      test: true,
      timestamp: new Date(),
      message: 'Connection test successful'
    });
    console.log('✅ Test document inserted:', insertResult.insertedId);
    
    // Read test document
    const document = await testCollection.findOne({ _id: insertResult.insertedId });
    console.log('✅ Test document retrieved:', document);
    
    // Clean up test document
    await testCollection.deleteOne({ _id: insertResult.insertedId });
    console.log('✅ Test document cleaned up');
    
    // Display connection info
    console.log('📊 Connection Info:');
    console.log('- Database Name:', mongoose.connection.db.databaseName);
    console.log('- Connection State:', mongoose.connection.readyState);
    console.log('- Host:', mongoose.connection.host);
    
    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected successfully');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();