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
const ticketmasterService = require('./services/ticketmasterService');

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
 * GET /health
 * 
 * Health check endpoint for monitoring and load balancers
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    services: {
      mongodb: mongoose.connection.readyState === 1,
      openai: !!process.env.OPENAI_API_KEY,
      ticketmaster: ticketmasterService.isAvailable()
    }
  });
});

/**
 * GET /api/events
 *
 * Fetch all sports events from the database. Events are sorted by date in
 * ascending order so that upcoming events appear first. Supports filtering
 * by league, featured status, and team.
 */
app.get('/api/events', async (req, res) => {
  try {
    const { league, featured, team, limit = 50 } = req.query;
    
    // Build query filter
    const filter = {};
    if (league) filter.league = new RegExp(league, 'i');
    if (featured === 'true') filter.featured = true;
    if (team) filter.teams = new RegExp(team, 'i');
    
    const events = await Event.find(filter)
      .sort({ featured: -1, date: 1 })
      .limit(parseInt(limit));
      
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
 * document for future requests. Also increments view count.
 */
app.get('/api/events/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Increment view count
    await event.incrementViews();
    
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
 * POST /api/events/:id/click
 * 
 * Track affiliate link clicks for analytics
 */
app.post('/api/events/:id/click', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    await event.incrementClicks();
    res.json({ success: true, clicks: event.clicks });
  } catch (err) {
    console.error('Error tracking click:', err);
    res.status(500).json({ error: 'Failed to track click' });
  }
});

/**
 * GET /api/ticketmaster/events
 * 
 * Fetch events directly from Ticketmaster API
 */
app.get('/api/ticketmaster/events', async (req, res) => {
  try {
    const { league, team, city, size = 20 } = req.query;
    
    let events;
    if (team?.toLowerCase().includes('trail blazers')) {
      events = await ticketmasterService.getTrailBlazersEvents({ size });
    } else if (league === 'NBA') {
      events = await ticketmasterService.getNBAEvents({ size });
    } else if (league === 'NFL') {
      events = await ticketmasterService.getNFLEvents({ size });
    } else if (league === 'MLB') {
      events = await ticketmasterService.getMLBEvents({ size });
    } else if (league === 'NHL') {
      events = await ticketmasterService.getNHLEvents({ size });
    } else {
      events = await ticketmasterService.getSportsEvents({ 
        city, 
        size,
        keyword: team 
      });
    }
    
    res.json(events);
  } catch (err) {
    console.error('Error fetching Ticketmaster events:', err);
    res.status(500).json({ error: 'Failed to fetch Ticketmaster events' });
  }
});

/**
 * POST /api/ticketmaster/sync
 * 
 * Sync events from Ticketmaster to local database
 */
app.post('/api/ticketmaster/sync', async (req, res) => {
  try {
    const syncedEvents = await ticketmasterService.syncEvents(Event);
    res.json({ 
      success: true, 
      synced: syncedEvents.length,
      events: syncedEvents 
    });
  } catch (err) {
    console.error('Error syncing Ticketmaster events:', err);
    res.status(500).json({ error: 'Failed to sync Ticketmaster events' });
  }
});

/**
 * GET /api/teams/trail-blazers
 * 
 * Get Portland Trail Blazers specific events and information
 */
app.get('/api/teams/trail-blazers', async (req, res) => {
  try {
    // Get local events
    const localEvents = await Event.find({
      $or: [
        { teams: /trail blazers/i },
        { teams: /portland/i },
        { name: /trail blazers/i }
      ]
    }).sort({ date: 1 }).limit(10);
    
    // Get Ticketmaster events if available
    let tmEvents = [];
    if (ticketmasterService.isAvailable()) {
      try {
        const tmData = await ticketmasterService.getTrailBlazersEvents({ size: 10 });
        tmEvents = tmData._embedded?.events || [];
      } catch (tmError) {
        console.warn('Failed to fetch Trail Blazers events from Ticketmaster:', tmError.message);
      }
    }
    
    res.json({
      team: 'Portland Trail Blazers',
      league: 'NBA',
      localEvents,
      ticketmasterEvents: tmEvents,
      totalEvents: localEvents.length + tmEvents.length
    });
  } catch (err) {
    console.error('Error fetching Trail Blazers events:', err);
    res.status(500).json({ error: 'Failed to fetch Trail Blazers events' });
  }
});

/**
 * GET /api/analytics
 * 
 * Get analytics data for admin dashboard
 */
app.get('/api/analytics', async (req, res) => {
  try {
    const totalEvents = await Event.countDocuments();
    const featuredEvents = await Event.countDocuments({ featured: true });
    const upcomingEvents = await Event.countDocuments({ date: { $gte: new Date() } });
    
    const topEvents = await Event.find()
      .sort({ views: -1, clicks: -1 })
      .limit(10)
      .select('name views clicks date league');
      
    const leagueStats = await Event.aggregate([
      { $group: { _id: '$league', count: { $sum: 1 }, totalViews: { $sum: '$views' }, totalClicks: { $sum: '$clicks' } } },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      summary: {
        totalEvents,
        featuredEvents,
        upcomingEvents
      },
      topEvents,
      leagueStats
    });
  } catch (err) {
    console.error('Error fetching analytics:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
