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
const { 
  searchSportsEvents, 
  convertTicketmasterEvent, 
  getRateLimitStatus 
} = require('./services/ticketmasterService');

// Load environment variables from .env if present
dotenv.config();

// Environment validation - only require MONGODB_URI in production
const requiredEnvVars = process.env.NODE_ENV === 'production' ? ['MONGODB_URI'] : [];
const optionalEnvVars = ['MONGODB_URI', 'TICKETMASTER_API_KEY', 'OPENAI_API_KEY'];

// Check required environment variables
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Required environment variable ${envVar} is not set`);
    process.exit(1);
  }
}

// Warn about missing optional environment variables
for (const envVar of optionalEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`⚠️  Optional environment variable ${envVar} is not set. Some features may be disabled.`);
  }
}

const app = express();

// Security and performance middleware
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Request logging middleware for production debugging
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Error handling middleware
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
});

// Connect to MongoDB. The URI is expected in the MONGODB_URI environment
// variable. Connection is non-blocking to allow health checks even if DB is down.
async function connectToDatabase() {
  const uri = process.env.MONGODB_URI;
  try {
    await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    console.log('🍃 Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.log('⚠️  Server will continue running with limited functionality');
  }
}

connectToDatabase();

/**
 * GET /health
 * 
 * Health check endpoint for monitoring and load balancer health checks.
 * Returns server status and database connectivity information.
 */
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: 'unknown',
      ticketmaster: !!process.env.TICKETMASTER_API_KEY,
      openai: !!process.env.OPENAI_API_KEY
    }
  };

  try {
    // Check database connection
    const dbState = mongoose.connection.readyState;
    health.services.database = dbState === 1 ? 'connected' : 'disconnected';
    
    if (dbState !== 1) {
      health.status = 'degraded';
    }
    
    res.status(health.status === 'healthy' ? 200 : 503).json(health);
  } catch (err) {
    health.status = 'unhealthy';
    health.error = err.message;
    res.status(503).json(health);
  }
});

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
 * Create a new sports event with input validation. The request body should 
 * include required fields: `name`, `date`, `league`, `teams`, and optionally 
 * `location` and `affiliateLink`. This endpoint validates input data before 
 * saving to prevent invalid records.
 */
app.post('/api/events', async (req, res) => {
  try {
    // Basic input validation
    const { name, date, league, teams } = req.body;
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Event name is required' });
    }
    
    if (!date || isNaN(Date.parse(date))) {
      return res.status(400).json({ error: 'Valid date is required' });
    }
    
    if (!league || typeof league !== 'string' || league.trim().length === 0) {
      return res.status(400).json({ error: 'League is required' });
    }
    
    if (!teams || !Array.isArray(teams) || teams.length === 0) {
      return res.status(400).json({ error: 'At least one team is required' });
    }
    
    const event = new Event({
      ...req.body,
      name: name.trim(),
      league: league.trim(),
      teams: teams.map(team => team.trim()).filter(team => team.length > 0)
    });
    
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    console.error('Error creating event:', err);
    if (err.name === 'ValidationError') {
      res.status(400).json({ error: 'Invalid event data', details: err.message });
    } else {
      res.status(500).json({ error: 'Failed to create event' });
    }
  }
});

/**
 * GET /api/events/search
 * 
 * Search for events using Ticketmaster API with optional local database fallback.
 * Query parameters:
 * - sport: Sport name (Basketball, Football, etc.)
 * - city: City name
 * - days: Number of days ahead to search (default: 30)
 */
app.get('/api/events/search', async (req, res) => {
  try {
    const { sport, city, days } = req.query;
    
    // Search Ticketmaster for events
    const tmResponse = await searchSportsEvents({
      sport,
      city,
      daysAhead: parseInt(days) || 30
    });
    
    if (tmResponse._embedded?.events) {
      // Convert Ticketmaster events to our format
      const events = tmResponse._embedded.events.map(convertTicketmasterEvent);
      res.json({
        events,
        total: tmResponse.page?.totalElements || events.length,
        source: 'ticketmaster'
      });
    } else {
      // No Ticketmaster results, fall back to local database
      const filter = {};
      if (sport) filter.league = new RegExp(sport, 'i');
      if (city) filter.location = new RegExp(city, 'i');
      
      const events = await Event.find(filter)
        .sort({ date: 1 })
        .limit(50);
      
      res.json({
        events,
        total: events.length,
        source: 'database'
      });
    }
  } catch (err) {
    console.error('Error searching events:', err);
    
    // If Ticketmaster fails, try database fallback
    try {
      const events = await Event.find().sort({ date: 1 }).limit(20);
      res.json({
        events,
        total: events.length,
        source: 'database_fallback',
        warning: 'Ticketmaster API unavailable'
      });
    } catch (dbErr) {
      console.error('Database fallback also failed:', dbErr);
      res.status(500).json({ error: 'Unable to fetch events from any source' });
    }
  }
});

/**
 * GET /api/ticketmaster/status
 * 
 * Get current Ticketmaster API rate limit status
 */
app.get('/api/ticketmaster/status', (req, res) => {
  try {
    const status = getRateLimitStatus();
    res.json(status);
  } catch (err) {
    console.error('Error getting Ticketmaster status:', err);
    res.status(500).json({ error: 'Failed to get API status' });
  }
});

/**
 * POST /api/events/import
 * 
 * Import events from Ticketmaster and save to local database.
 * Useful for pre-populating the database with upcoming events.
 */
app.post('/api/events/import', async (req, res) => {
  try {
    const { sport = 'Basketball', city, days = 30 } = req.body;
    
    const tmResponse = await searchSportsEvents({ sport, city, daysAhead: days });
    
    if (!tmResponse._embedded?.events) {
      return res.json({ imported: 0, message: 'No events found to import' });
    }
    
    const events = tmResponse._embedded.events.map(convertTicketmasterEvent);
    let importedCount = 0;
    
    // Save events to database, avoiding duplicates
    for (const eventData of events) {
      try {
        // Check if event already exists by Ticketmaster ID
        if (eventData.ticketmaster?.id) {
          const existing = await Event.findOne({ 'ticketmaster.id': eventData.ticketmaster.id });
          if (existing) {
            continue; // Skip duplicates
          }
        }
        
        const event = new Event(eventData);
        await event.save();
        importedCount++;
      } catch (saveErr) {
        console.warn('Failed to save event:', saveErr.message);
      }
    }
    
    res.json({
      imported: importedCount,
      total: events.length,
      message: `Successfully imported ${importedCount} events`
    });
  } catch (err) {
    console.error('Error importing events:', err);
    res.status(500).json({ error: 'Failed to import events' });
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

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
