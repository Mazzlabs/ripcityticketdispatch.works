/**
 * Event Model
 * 
 * Mongoose model for sports events in the affiliate tracking system.
 * Each event contains basic metadata about sporting events and can
 * store AI-generated odds for each team.
 */

const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
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
  affiliateLink: {
    type: String,
    trim: true
  },
  odds: {
    type: Map,
    of: Number,
    default: new Map()
  }
}, {
  timestamps: true
});

// Index by date for efficient querying of upcoming events
eventSchema.index({ date: 1 });

module.exports = mongoose.model('Event', eventSchema);