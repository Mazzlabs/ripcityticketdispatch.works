const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  league: { type: String, required: true },
  teams: [{ type: String, required: true }],
  location: String,
  affiliateLink: String,
  odds: { type: Map, of: Number }
}, {
  timestamps: true
});

module.exports = mongoose.model('Event', eventSchema);