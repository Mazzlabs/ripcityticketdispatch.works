const mongoose = require('mongoose');

/**
 * MongoDB schema for sports events.
 *
 * Each event represents a sporting match or game with teams, date, location
 * and optionally calculated odds and affiliate links.
 */
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
    trim: true
  }],
  location: {
    type: String,
    trim: true
  },
  odds: {
    type: Object,
    default: {}
  },
  affiliateLink: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;