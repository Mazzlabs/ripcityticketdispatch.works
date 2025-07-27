const mongoose = require('mongoose');

/**
 * MongoDB schema for sporting events.
 *
 * This schema defines the structure for sporting events stored in the database.
 * Each event includes basic metadata (name, date, league, teams, location) and
 * can optionally include AI-generated odds and affiliate links.
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
    required: true,
    trim: true
  }],
  location: {
    type: String,
    trim: true
  },
  odds: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  affiliateLink: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index on date for efficient sorting
eventSchema.index({ date: 1 });

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;