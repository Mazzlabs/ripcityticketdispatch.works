const mongoose = require('mongoose');

/**
 * Event Schema for Sports Events
 * 
 * Supports both manually created events and Ticketmaster API events.
 * Includes fields for affiliate links, AI-generated odds, and Ticketmaster metadata.
 */
const eventSchema = new mongoose.Schema({
  // Basic event information
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
    required: true,
    trim: true
  }],
  location: {
    type: String,
    trim: true
  },
  
  // AI-generated odds
  odds: {
    type: Map,
    of: Number,
    default: {}
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
    priceRanges: [{
      type: {
        type: String
      },
      currency: String,
      min: Number,
      max: Number
    }],
    venue: {
      name: String,
      address: String,
      city: String,
      state: String,
      country: String,
      postalCode: String
    },
    sales: {
      public: {
        startDateTime: Date,
        endDateTime: Date
      }
    },
    seatmap: {
      staticUrl: String
    }
  },
  
  // Metadata
  status: {
    type: String,
    enum: ['upcoming', 'live', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  featured: {
    type: Boolean,
    default: false
  },
  
  // Analytics
  views: {
    type: Number,
    default: 0
  },
  clicks: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient querying
eventSchema.index({ date: 1 });
eventSchema.index({ league: 1 });
eventSchema.index({ 'ticketmaster.id': 1 });
eventSchema.index({ featured: -1, date: 1 });

// Virtual for formatted date
eventSchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleString();
});

// Virtual to check if event is upcoming
eventSchema.virtual('isUpcoming').get(function() {
  return this.date > new Date();
});

// Method to increment views
eventSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Method to increment clicks
eventSchema.methods.incrementClicks = function() {
  this.clicks += 1;
  return this.save();
};

module.exports = mongoose.model('Event', eventSchema);