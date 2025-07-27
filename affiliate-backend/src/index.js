/**
 * Sports Affiliate Backend
 *
 * This Express server exposes endpoints for managing sports events and retrieving
 * AI‑generated odds for each event. It connects to MongoDB using Mongoose
 * and uses the OpenAI API to estimate the probability of each team winning.
 *
 * Mongo integration: supply a `MONGODB_URI` via environment variables. The
 * actual database provisioning will be handled via the DigitalOcean dashboard,
 * but this code is ready to connect once the URI is provided.
 */

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const Event = require('./models/event');
const { getOddsForEvent } = require('./services/openaiService');

// Load environment variables from .env if present
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Mock data store for demo purposes when MongoDB is not available
let mockEvents = [
  {
    _id: '1',
    name: 'Portland Trail Blazers vs Lakers',
    date: new Date('2024-12-15T19:00:00.000Z'),
    league: 'NBA',
    teams: ['Portland Trail Blazers', 'Los Angeles Lakers'],
    location: 'Moda Center, Portland',
    odds: {}
  },
  {
    _id: '2', 
    name: 'Patriots vs Seahawks',
    date: new Date('2024-12-22T13:00:00.000Z'),
    league: 'NFL',
    teams: ['New England Patriots', 'Seattle Seahawks'],
    location: 'Gillette Stadium',
    odds: {}
  }
];

// Connect to MongoDB. The URI is expected in the MONGODB_URI environment
// variable. If absent, we'll use mock data for demo purposes.
async function connectToDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('⚠️  MONGODB_URI is not set. Using mock data for demo purposes.');
    return;
  }
  try {
    await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    console.log('🍃 Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err);
  }
}

connectToDatabase();

/**
 * GET /api/events
 *
 * Fetch all sports events from the database or mock data if MongoDB is not connected.
 * Events are sorted by date in ascending order so that upcoming events appear first.
 */
app.get('/api/events', async (req, res) => {
  try {
    if (!process.env.MONGODB_URI) {
      // Use mock data
      const sortedEvents = mockEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
      res.json(sortedEvents);
      return;
    }
    
    const events = await Event.find().sort({ date: 1 });
    res.json(events);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

/**
 * POST /api/events
 *
 * Create a new sports event. The request body should include the event
 * `name`, `date`, `league`, `teams`, `location` and optionally an
 * `affiliateLink`. This endpoint does not calculate odds – that is done on
 * demand when querying a single event.
 */
app.post('/api/events', async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(400).json({ error: 'Invalid event data' });
  }
});

/**
 * GET /api/events/:id
 *
 * Fetch a single event by its ID. If the event has no odds
 * calculated yet, the server will call the OpenAI service to generate
 * probabilities. Once generated, the odds are persisted for future requests.
 */
app.get('/api/events/:id', async (req, res) => {
  try {
    let event;
    
    if (!process.env.MONGODB_URI) {
      // Use mock data
      event = mockEvents.find(e => e._id === req.params.id);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
    } else {
      event = await Event.findById(req.params.id);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
    }
    
    // Generate odds if missing
    if (!event.odds || Object.keys(event.odds).length === 0) {
      try {
        const odds = await getOddsForEvent(event);
        event.odds = odds;
        
        if (process.env.MONGODB_URI) {
          await event.save();
        } else {
          // Update mock data
          const mockIndex = mockEvents.findIndex(e => e._id === req.params.id);
          if (mockIndex !== -1) {
            mockEvents[mockIndex].odds = odds;
          }
        }
      } catch (aiError) {
        console.error('Failed to generate odds via OpenAI:', aiError);
      }
    }
    res.json(event);
  } catch (err) {
    console.error('Error fetching event:', err);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
