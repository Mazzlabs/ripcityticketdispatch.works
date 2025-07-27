# Rip City Ticket Dispatch

A production-ready sports affiliate event tracking platform that displays upcoming sporting events with AI-generated odds and integrated affiliate marketing for Stake.us. Built with React frontend and Express.js backend, featuring real-time Ticketmaster API integration and OpenAI-powered predictions.

## Architecture

### Backend (`affiliate-backend`)
- **Express.js** server with RESTful API
- **MongoDB** for event data persistence 
- **Ticketmaster Discovery API** for real-time event data
- **OpenAI GPT-4** for intelligent odds generation
- **Rate limiting** and caching for API optimization
- **Health checks** for monitoring and load balancing

### Frontend (`affiliate-frontend`)
- **React 19** with modern hooks and JSX
- **Responsive design** with mobile-first approach
- **Stake.us affiliate integration** with tracking codes
- **Real-time event display** with AI-generated probabilities

## Quick Start

### Prerequisites
- Node.js 18.x or higher
- MongoDB database (local or cloud)
- API keys for Ticketmaster and OpenAI (optional)

### Environment Variables

Create `.env` files in both `affiliate-backend` and `affiliate-frontend` directories:

**Backend (`affiliate-backend/.env`):**
```bash
NODE_ENV=development
PORT=8080
MONGODB_URI=mongodb://localhost:27017/ripcity
TICKETMASTER_API_KEY=your_ticketmaster_api_key  # Optional
OPENAI_API_KEY=your_openai_api_key              # Optional
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000
```

**Frontend (`affiliate-frontend/.env`):**
```bash
REACT_APP_API_URL=http://localhost:8080
```

### Development Setup

1. **Clone and install dependencies:**
   ```bash
   git clone https://github.com/Mazzlabs/ripcityticketdispatch.works.git
   cd ripcityticketdispatch.works
   
   # Install backend dependencies
   cd affiliate-backend && npm install
   
   # Install frontend dependencies  
   cd ../affiliate-frontend && npm install
   ```

2. **Start development servers:**
   ```bash
   # Terminal 1 - Backend
   cd affiliate-backend && npm run dev
   
   # Terminal 2 - Frontend
   cd affiliate-frontend && npm start
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - Health Check: http://localhost:8080/health

## API Endpoints

### Events Management
- `GET /api/events` - Retrieve all events
- `POST /api/events` - Create new event
- `GET /api/events/:id` - Get event with AI-generated odds
- `GET /api/events/search` - Search events via Ticketmaster API
- `POST /api/events/import` - Import events from Ticketmaster

### Monitoring
- `GET /health` - System health and service status
- `GET /api/ticketmaster/status` - API rate limit status

## Production Deployment

### GitHub Actions CI/CD
The repository includes automated deployment via GitHub Actions:

1. **Required Secrets** (configure in GitHub repository settings):
   - `DIGITALOCEAN_ACCESS_TOKEN` - DigitalOcean API token
   - `DIGITALOCEAN_APP_ID` - DigitalOcean App Platform ID

2. **Environment Variables** (configure in DigitalOcean App Platform):
   - `MONGODB_URI` - Production MongoDB connection string
   - `TICKETMASTER_API_KEY` - Ticketmaster API key
   - `OPENAI_API_KEY` - OpenAI API key

### Manual Deployment
```bash
# Build frontend for production
cd affiliate-frontend && npm run build

# Start backend in production mode
cd affiliate-backend && NODE_ENV=production npm start
```

## Security Features

- **Environment variable validation** on startup
- **CORS protection** with configurable origins
- **Rate limiting** for external API calls
- **Input sanitization** and validation
- **Health monitoring** with degraded service detection
- **Secure secret management** via GitHub Actions and DigitalOcean

## Development Tools

### Linting
```bash
# Backend linting
cd affiliate-backend && npm run lint

# Frontend linting  
cd affiliate-frontend && npm run lint
```

### Testing
```bash
# Frontend tests
cd affiliate-frontend && npm test
```

### Security Audits
```bash
# Check for vulnerabilities
npm audit
```

## Affiliate Integration

The platform includes Stake.us affiliate integration with tracking code `RIPCITYTICKETS`:
- Horizontal banner in header
- Vertical sidebar banner
- Footer branding with affiliate links
- Automatic referral tracking on all Stake.us links

## API Rate Limits

- **Ticketmaster API**: 1,000 requests per 24-hour period
- **OpenAI API**: Based on your OpenAI plan
- **Built-in caching**: 1-hour TTL for Ticketmaster responses

## Monitoring and Health Checks

The `/health` endpoint provides:
- Server uptime and status
- Database connectivity
- External service availability
- Environment configuration

Example response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "services": {
    "database": "connected",
    "ticketmaster": true,
    "openai": true
  }
}
```

## License

Private repository - All rights reserved.

## Support

For technical support or deployment assistance, contact the development team through GitHub issues.