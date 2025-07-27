/**
 * Event Model
 * 
 * Mongoose schema for sporting events with support for both manual events
 * and Ticketmaster API integration. Includes fields for AI-generated odds
 * and affiliate link tracking.
 */

const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  // Core event information
  name: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  league: {
    type: String,
    required: true,
    trim: true
  },
  teams: [{
    type: String,
    required: true
  }],
  location: {
    type: String,
    trim: true
  },
  
  // AI-generated odds
  odds: {
    type: Map,
    of: Number,
    default: new Map()
  },
  
  // Affiliate links
  affiliateLink: {
    type: String,
    trim: true
  },
  
  // Ticketmaster integration fields
  ticketmaster: {
    id: String,
    url: String,
    priceRange: {
      min: Number,
      max: Number,
      currency: String
    },
    venue: {
      name: String,
      city: String,
      state: String
    },
    classification: {
      genre: String,
      subGenre: String,
      type: String
    },
    sales: {
      public: {
        startDateTime: Date,
        endDateTime: Date
      }
    }
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
eventSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create indexes for efficient querying
eventSchema.index({ date: 1 });
eventSchema.index({ league: 1 });
eventSchema.index({ 'ticketmaster.id': 1 });

module.exports = mongoose.model('Event', eventSchema);