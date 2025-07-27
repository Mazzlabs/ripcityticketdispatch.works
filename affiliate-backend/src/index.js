/**
 * Stake.us Affiliate Backend
 *
 * This Express server provides a simple health check endpoint for the 
 * Stake.us affiliate site. The frontend is static and doesn't require
 * complex backend functionality.
 */

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

/**
 * GET /health
 *
 * Simple health check endpoint to verify the server is running.
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * GET /api/affiliate
 *
 * Returns the Stake.us affiliate information.
 */
app.get('/api/affiliate', (req, res) => {
  res.json({
    site: 'Stake.us',
    referralCode: 'RIPCITYTICKETS',
    url: 'https://stake.us/?c=RIPCITYTICKETS',
    type: 'Social Casino',
    description: 'America\'s premier social casino with slots, table games, and live dealers'
  });
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Affiliate server listening on port ${PORT}`);
});
