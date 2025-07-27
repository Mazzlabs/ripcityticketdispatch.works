# Rip City Ticket Dispatch - Sports Affiliate Platform

A comprehensive sports ticket affiliate platform featuring Portland Trail Blazers events, Ticketmaster API integration, AI-powered odds predictions, and secure affiliate link tracking.

## 🏀 Features

### Core Functionality
- **Portland Trail Blazers Focus**: Dedicated section for Trail Blazers games with team branding
- **Ticketmaster Integration**: Real-time sports event data from Ticketmaster Discovery API
- **AI-Powered Odds**: OpenAI-generated win probability predictions for games
- **Multi-Sport Support**: NBA, NFL, MLB, NHL, and MLS events
- **Affiliate Tracking**: Click tracking and commission analytics for ticket sales

### User Experience
- **Responsive Design**: Mobile-optimized interface with Trail Blazers theming
- **Event Filtering**: Filter by league, team, and featured events
- **Real-time Pricing**: Display Ticketmaster price ranges and venue information
- **Smart Analytics**: View and click tracking for performance optimization

### Technical Features
- **Secure Secret Management**: GitHub Actions integration for API keys
- **Auto-sync**: Automated Ticketmaster event synchronization
- **Health Monitoring**: API health checks and service status
- **Scalable Architecture**: MongoDB + Express + React + Node.js

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- MongoDB instance
- Ticketmaster API key (optional for development)
- OpenAI API key (optional for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Mazzlabs/ripcityticketdispatch.works.git
   cd ripcityticketdispatch.works
   ```

2. **Install Backend Dependencies**
   ```bash
   cd affiliate-backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../affiliate-frontend
   npm install
   ```

4. **Environment Configuration**
   
   Create `.env` files in both backend and frontend directories:

   **Backend `.env`:**
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/ripcity-tickets
   
   # API Keys
   OPENAI_API_KEY=your-openai-api-key
   TICKETMASTER_KEY=your-ticketmaster-consumer-key
   TICKETMASTER_SECRET=your-ticketmaster-consumer-secret
   
   # Security
   JWT_SECRET=your-jwt-secret-key
   
   # Server
   PORT=8080
   NODE_ENV=development
   
   # CORS
   FRONTEND_URL=http://localhost:3000
   CORS_ORIGINS=http://localhost:3000
   ```

5. **Start Development Servers**
   
   **Backend:**
   ```bash
   cd affiliate-backend
   npm run dev  # or npm start
   ```
   
   **Frontend:**
   ```bash
   cd affiliate-frontend
   npm start
   ```

6. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - Health Check: http://localhost:8080/health

## 🔧 API Endpoints

### Core Events
- `GET /api/events` - List all events (with filtering)
- `GET /api/events/:id` - Get single event with AI odds
- `POST /api/events` - Create new event
- `POST /api/events/:id/click` - Track affiliate click

### Ticketmaster Integration
- `GET /api/ticketmaster/events` - Fetch live Ticketmaster events
- `POST /api/ticketmaster/sync` - Sync Ticketmaster events to database

### Team-Specific
- `GET /api/teams/trail-blazers` - Portland Trail Blazers events and info

### Analytics
- `GET /api/analytics` - Platform analytics and metrics
- `GET /api/health` - Service health check

## 🎯 Ticketmaster Integration

### Setup
1. Register at [Ticketmaster Developer Portal](https://developer.ticketmaster.com/)
2. Create an app and get your Consumer Key and Secret
3. Add keys to environment variables
4. Test integration with `/api/ticketmaster/events`

### Supported Event Types
- **NBA Basketball** (Portland Trail Blazers priority)
- **NFL Football**
- **MLB Baseball** 
- **NHL Hockey**
- **MLS Soccer**

### Event Sync
Events are automatically synced from Ticketmaster and enriched with:
- Venue information and seating charts
- Price ranges in real-time
- Affiliate-tracked purchase links
- AI-generated win probabilities

## 🤖 AI Features

### OpenAI Integration
- **Odds Prediction**: AI analyzes team matchups for win probabilities
- **Event Analysis**: Historical performance and contextual factors
- **Smart Recommendations**: Personalized event suggestions

### Setup
1. Get OpenAI API key from [OpenAI Platform](https://platform.openai.com/)
2. Add `OPENAI_API_KEY` to environment
3. AI odds will automatically generate for new events

## 🔐 Production Deployment

### GitHub Actions Secrets
Configure these secrets in your GitHub repository:

```
MONGODB_URI                 # Production MongoDB connection
MONGODB_URI_PROD           # Backup production database
OPENAI_API_KEY             # OpenAI API key for AI features
TICKETMASTER_KEY           # Ticketmaster Consumer Key
TICKETMASTER_SECRET        # Ticketmaster Consumer Secret  
JWT_SECRET                 # JWT signing key
DIGITALOCEAN_ACCESS_TOKEN  # DigitalOcean deployment token
```

### Deployment
1. Push to `main` branch triggers automatic deployment
2. Staging environment deploys first for testing
3. Production deployment requires staging success
4. Security scanning runs on all commits

### DigitalOcean App Platform
The app is configured for DigitalOcean App Platform deployment with:
- Automatic SSL certificates
- Environment variable injection
- Health check monitoring
- Auto-scaling capabilities

## 🎨 Frontend Components

### TrailBlazersSection
Dedicated Portland Trail Blazers section with:
- Team branding and colors
- Upcoming home/away games
- Ticketmaster integration
- Featured event highlighting

### EventCard  
Enhanced event display with:
- Ticketmaster venue information
- Price range display
- Affiliate link tracking
- AI odds visualization
- Analytics integration

### EventFilters
Smart filtering system:
- League-based filtering
- Team search
- Featured events toggle
- Active filter display

## 📊 Analytics & Tracking

### Metrics Tracked
- Event views and impressions
- Affiliate link clicks
- Conversion rates by league/team
- Revenue attribution
- User engagement patterns

### Revenue Optimization
- A/B testing for affiliate placement
- Commission tracking by event type
- Performance analytics dashboard
- ROI measurement tools

## 🏆 Portland Trail Blazers Focus

### Special Features
- Dedicated team section with Rip City branding
- Priority placement for Trail Blazers games
- Enhanced venue information for Moda Center
- Team-specific notifications and alerts
- Local Portland sports coverage

### Affiliate Strategy
- Trail Blazers games marked as featured events
- Special commission tracking for local games
- Partnership opportunities with team sponsors
- Fan engagement optimization

## 🛠️ Development

### Testing
```bash
# Backend integration tests
cd affiliate-backend
node test-integration.js

# Frontend development
cd affiliate-frontend
npm start

# Production build
npm run build
```

### Code Structure
```
affiliate-backend/
├── src/
│   ├── models/         # MongoDB schemas
│   ├── services/       # API integrations
│   └── index.js        # Express server
├── test-integration.js # Integration tests
└── package.json

affiliate-frontend/
├── src/
│   ├── components/     # React components  
│   ├── App.jsx         # Main application
│   └── index.js        # Entry point
└── package.json

.github/workflows/      # CI/CD automation
└── deploy.yml
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Run integration tests (`node test-integration.js`)
4. Commit changes (`git commit -m 'Add amazing feature'`)
5. Push to branch (`git push origin feature/amazing-feature`)
6. Open Pull Request

## 📋 Roadmap

### Phase 1 ✅ (Current)
- Ticketmaster API integration
- Portland Trail Blazers focus
- AI-powered odds
- Basic affiliate tracking

### Phase 2 🚧 (In Progress)
- User accounts and preferences
- Email notifications for featured games
- Advanced analytics dashboard
- Mobile app development

### Phase 3 📅 (Planned)
- Multi-team subscriptions
- Social sharing features
- Advanced AI recommendations
- Partnership integrations

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

For support, email support@ripcityticketdispatch.works or create an issue in this repository.

---

**Built with ❤️ for Rip City** 🏀