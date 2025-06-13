# 🚀 Production Deployment Guide

## Prerequisites

Before deploying Rip City Ticket Dispatch to production, ensure you have:

### Required API Keys
1. **Ticketmaster API Key**
   - Register at: https://developer.ticketmaster.com/
   - Required for fetching event data
   - Rate limits apply - monitor usage

2. **Eventbrite API Key**
   - Get from: https://www.eventbrite.com/platform/api-keys
   - Required for additional event sources
   - Free tier available

### Optional but Recommended
3. **Database** (Choose one):
   - PostgreSQL (recommended)
   - MongoDB
   - MySQL

4. **Payment Processing** (for subscription features):
   - Stripe Account
   - Configured webhooks

5. **External Services**:
   - SendGrid (email alerts)
   - Twilio (SMS alerts)
   - Sentry (error tracking)

## Environment Setup

### Backend Configuration
Copy `.env.example` to `.env` and fill in your API keys:

```bash
cd ripcity-backend
cp .env.example .env
# Edit .env with your actual API keys
```

**Critical Environment Variables:**
```bash
# REQUIRED
TICKETMASTER_KEY=your_actual_key
EVENTBRITE_KEY=your_actual_key
NODE_ENV=production
DATABASE_URL=your_database_connection_string

# RECOMMENDED
JWT_SECRET=secure_random_string_32_chars_minimum
STRIPE_SECRET=sk_live_your_stripe_key
CORS_ORIGINS=https://yourdomain.com
```

### Frontend Configuration
```bash
cd rip-city-tickets-react
# Create .env.production
echo "REACT_APP_API_URL=https://your-api-domain.com" > .env.production
```

## Database Setup

### PostgreSQL (Recommended)
```bash
# Install and setup PostgreSQL
sudo apt install postgresql postgresql-contrib
sudo -u postgres createuser --interactive ripcity
sudo -u postgres createdb ripcity_db

# Or use a managed service like:
# - AWS RDS
# - Google Cloud SQL
# - DigitalOcean Managed Databases
```

### Migration (when implementing proper DB)
```bash
# Future: Replace in-memory database with:
npm install prisma @prisma/client
# or
npm install mongoose
# or  
npm install typeorm pg
```

## Deployment Options

### Option 1: DigitalOcean App Platform
```yaml
# .do/app.yaml
name: rip-city-ticket-dispatch
services:
  - name: api
    source_dir: ripcity-backend
    github:
      repo: your-username/ripcityticketdispatch.works
      branch: main
    run_command: npm start
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
    envs:
      - key: NODE_ENV
        value: production
      - key: TICKETMASTER_KEY
        value: ${TICKETMASTER_KEY}
      - key: EVENTBRITE_KEY
        value: ${EVENTBRITE_KEY}
  - name: web
    source_dir: rip-city-tickets-react
    github:
      repo: your-username/ripcityticketdispatch.works
      branch: main
    build_command: npm run build
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
```

### Option 2: Vercel (Frontend) + Railway (Backend)
```bash
# Deploy Frontend to Vercel
npm install -g vercel
cd rip-city-tickets-react
vercel --prod

# Deploy Backend to Railway
# Connect your GitHub repo at railway.app
```

### Option 3: Docker Deployment
```dockerfile
# Dockerfile (Backend)
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 8080
CMD ["npm", "start"]
```

## Production Checklist

### Security
- [ ] All API keys are stored as environment variables
- [ ] CORS origins are restricted to your domain
- [ ] JWT secrets are cryptographically secure
- [ ] HTTPS is enabled with valid SSL certificates
- [ ] Rate limiting is implemented
- [ ] Input validation is in place

### Performance
- [ ] Database indexing is optimized
- [ ] Caching layer is implemented (Redis)
- [ ] CDN is configured for static assets
- [ ] Gzip compression is enabled
- [ ] API response times are monitored

### Monitoring
- [ ] Error tracking is set up (Sentry)
- [ ] API monitoring is configured
- [ ] Database performance is monitored
- [ ] Uptime monitoring is active
- [ ] Log aggregation is implemented

### Backup & Recovery
- [ ] Database backups are automated
- [ ] Environment variables are documented
- [ ] Disaster recovery plan is documented
- [ ] API keys are safely stored and recoverable

## API Rate Limits

### Ticketmaster API
- Rate limit: 5,000 requests per day
- Burst limit: 5 requests per second
- Monitor usage via developer console

### Eventbrite API
- Rate limit: 1,000 requests per hour
- Personal tokens: 50 requests per hour
- Upgrade to higher tiers if needed

## Scaling Considerations

### Horizontal Scaling
- Use load balancers for multiple API instances
- Implement session storage in Redis/database
- Use CDN for static asset delivery

### Database Scaling
- Read replicas for query performance
- Connection pooling
- Query optimization and indexing

### Caching Strategy
- Redis for API response caching
- Browser caching for static assets
- CDN edge caching

## Troubleshooting

### Common Issues
1. **API Key Errors**: Verify keys are correct and have necessary permissions
2. **Rate Limit Exceeded**: Implement exponential backoff and caching
3. **Database Connection**: Check connection strings and network access
4. **CORS Issues**: Verify CORS_ORIGINS includes your frontend domain

### Health Checks
```bash
# API Health Check
curl https://your-api-domain.com/health

# Database Connection Check
curl https://your-api-domain.com/api/health/db
```

## Cost Optimization

### Free Tier Options
- Vercel: Frontend hosting
- Railway: Backend hosting (500 hours free)
- Supabase: PostgreSQL database
- Upstash: Redis caching

### Paid Recommendations
- DigitalOcean: $5/month droplet
- AWS RDS: $13/month PostgreSQL
- Stripe: 2.9% + 30¢ per transaction

## Support

For deployment assistance:
- Create an issue in the GitHub repository
- Check the API documentation
- Review DigitalOcean App Platform docs

---

**⚡ Ready for Production!** This configuration will handle thousands of concurrent users with proper monitoring and scaling.
