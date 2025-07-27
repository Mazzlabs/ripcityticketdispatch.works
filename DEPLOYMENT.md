# Digital Ocean Deployment - Secret Variables Configuration

This application is configured for Digital Ocean App Platform deployment. The following secret variables must be configured in the Digital Ocean dashboard for the application to function properly.

## Required Secret Variables

### Database Configuration
- **MONGODB_URI**: MongoDB connection string for the database
  - Format: `mongodb+srv://username:password@cluster.mongodb.net/database_name`
  - Required for storing sports events and odds data

### API Keys
- **OPENAI_API_KEY**: OpenAI API key for generating AI-powered odds predictions
  - Format: `sk-...` (OpenAI API key format)
  - Optional: Application will work without this but won't generate AI odds

- **TICKETMASTER_API_KEY**: Ticketmaster API key for fetching event data
  - Format: Ticketmaster API key format
  - Optional: For future Ticketmaster integration features

### Stripe Payment Integration
- **STRIPE_SECRET_KEY**: Stripe secret key for payment processing
  - Format: `sk_live_...` for production or `sk_test_...` for testing
  
- **STRIPE_PUBLISHABLE_KEY**: Stripe publishable key
  - Format: `pk_live_...` for production or `pk_test_...` for testing
  
- **STRIPE_WEBHOOK_SECRET**: Stripe webhook endpoint secret
  - Format: `whsec_...`
  
- **STRIPE_PRO_PRICE_ID**: Stripe price ID for Pro subscription tier
- **STRIPE_PREMIUM_PRICE_ID**: Stripe price ID for Premium subscription tier  
- **STRIPE_ENTERPRISE_PRICE_ID**: Stripe price ID for Enterprise subscription tier

### Authentication
- **JWT_SECRET**: Secret key for JSON Web Token signing
  - Should be a strong, random string (at least 32 characters)
  - Example: `your-super-secret-jwt-key-here-make-it-long-and-random`

## How to Configure in Digital Ocean

1. Go to your Digital Ocean App Platform dashboard
2. Select your `rip-city-api` application
3. Go to Settings → Environment Variables
4. Add each variable with type "SECRET" for sensitive values
5. Redeploy the application after adding all required variables

## Environment Variables (Non-Secret)

These are already configured in the app.yaml file:
- **NODE_ENV**: Set to "production"
- **PORT**: Set to "8080"
- **FRONTEND_URL**: Set to "https://ripcityticketdispatch.works"
- **CORS_ORIGINS**: Allowed origins for CORS

## Testing Without All Variables

The application is designed to start gracefully even if some variables are missing:
- Without **MONGODB_URI**: Database operations will fail but the server will start
- Without **OPENAI_API_KEY**: AI odds generation will be disabled but events can still be managed
- Without Stripe keys: Payment features will be disabled

## Local Development

For local development, create a `.env` file in the `affiliate-backend` directory with your development values:

```env
NODE_ENV=development
PORT=8080
MONGODB_URI=mongodb://localhost:27017/ripcity_dev
OPENAI_API_KEY=sk-your-openai-key-here
STRIPE_SECRET_KEY=sk_test_your-test-key-here
# ... add other variables as needed
```

**Important**: Never commit the `.env` file to version control. It's already included in `.gitignore`.