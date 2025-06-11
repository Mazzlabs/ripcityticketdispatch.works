# Deployment Environment Setup

## Required Environment Variables

### Backend (.env)
```bash
# Ticketmaster API
TICKETMASTER_API_KEY=your_ticketmaster_api_key

# Stripe Payments
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Database
DATABASE_URL=your_database_connection_string

# JWT
JWT_SECRET=your_jwt_secret_key

# Email Service
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_email_password

# Twilio SMS
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_phone

# Redis (Optional)
REDIS_URL=your_redis_connection_string

# App Configuration
NODE_ENV=production
PORT=8080
```

### Frontend (.env)
```bash
REACT_APP_API_URL=https://your-backend-url.com
REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

## Production Deployment Checklist

- [ ] Set up environment variables
- [ ] Configure domain and SSL
- [ ] Set up monitoring and logging
- [ ] Configure rate limiting
- [ ] Set up backup procedures
- [ ] Test payment integration
- [ ] Verify API endpoints