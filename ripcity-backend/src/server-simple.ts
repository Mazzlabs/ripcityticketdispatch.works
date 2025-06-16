/**
 * RIP CITY TICKET DISPATCH - Minimal Server for Deployment Testing
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

// Basic middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: [
    'https://ripcityticketdispatch.works',
    'https://mazzlabs.works',
    'http://localhost:3000'
  ]
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Basic API endpoint
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: 'Rip City Ticket Dispatch API is running',
    timestamp: new Date().toISOString()
  });
});

// Mock deals endpoint
app.get('/api/deals', (req, res) => {
  res.json({
    success: true,
    deals: [
      {
        id: '1',
        name: 'Portland Trail Blazers vs Lakers',
        venue: 'Moda Center',
        date: '2025-01-15',
        minPrice: 45,
        maxPrice: 250,
        dealScore: 85
      }
    ],
    total: 1
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handling
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error.message);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Rip City Backend (Simple) running on port ${PORT}`);
  console.log(`🏀 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});
