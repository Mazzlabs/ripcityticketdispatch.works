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

// Connect to MongoDB. The URI is expected in the MONGODB_URI environment
// variable. If absent, Mongoose will throw an error. Connection options
// provide reasonable timeouts and auto‑reconnect behaviour.
async function connectToDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('⚠️  MONGODB_URI is not set. Please configure your database connection.');
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
 * Fetch all sports events from the database. Events are sorted by date in
 * ascending order so that upcoming events appear first.
 */
app.get('/api/events', async (req, res) => {
  try {
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
 * Fetch a single event by its MongoDB ID. If the event has no odds
 * calculated yet, the server will call the OpenAI service to generate
 * probabilities. Once generated, the odds are persisted on the event
 * document for future requests.
 */
app.get('/api/events/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    // Generate odds if missing
    if (!event.odds || Object.keys(event.odds).length === 0) {
      try {
        const odds = await getOddsForEvent(event);
        event.odds = odds;
        await event.save();
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

/**
 * POST /api/events/sample
 *
 * Create sample events for demonstration purposes.
 */
app.post('/api/events/sample', async (req, res) => {
  try {
    // Clear existing events first
    await Event.deleteMany({});
    
    const sampleEvents = [
      {
        name: "Lakers vs Warriors",
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        league: "NBA",
        teams: ["Los Angeles Lakers", "Golden State Warriors"],
        location: "Crypto.com Arena",
        odds: {
          "Los Angeles Lakers": 65,
          "Golden State Warriors": 35
        }
      },
      {
        name: "Cowboys vs Giants",
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        league: "NFL",
        teams: ["Dallas Cowboys", "New York Giants"],
        location: "AT&T Stadium",
        odds: {
          "Dallas Cowboys": 58,
          "New York Giants": 42
        }
      },
      {
        name: "Red Sox vs Yankees",
        date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        league: "MLB",
        teams: ["Boston Red Sox", "New York Yankees"],
        location: "Fenway Park",
        odds: {
          "Boston Red Sox": 52,
          "New York Yankees": 48
        }
      }
    ];
    
    const events = await Event.insertMany(sampleEvents);
    res.status(201).json({ message: 'Sample events created', events });
  } catch (err) {
    console.error('Error creating sample events:', err);
    res.status(500).json({ error: 'Failed to create sample events' });
  }
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
