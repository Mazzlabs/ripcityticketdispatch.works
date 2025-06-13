#!/bin/bash

# Deployment environment setup script
# This script sets up environment variables for deployment

echo "Setting up environment variables for Rip City Ticket Dispatch..."

# Export API keys from GitHub secrets
export TICKETMASTER_KEY="${TICKETMASTER_KEY}"
export TICKETMASTER_SECRET="${TICKETMASTER_SECRET}"
export EVENTBRITE_KEY="${EVENTBRITE_KEY}"
export EVENTBRITE_SECRET="${EVENTBRITE_SECRET}"
export OPENAI="${OPENAI}"
export STRIPE="${STRIPE}"
export BUMP="${BUMP}"

# Generate a secure JWT secret if not provided
if [ -z "$JWT_SECRET" ]; then
  export JWT_SECRET=$(openssl rand -hex 64)
  echo "Generated JWT_SECRET"
fi

# Set production environment
export NODE_ENV=production
export PORT=8080
export API_BASE_URL=https://app.ticketmaster.com/discovery/v2
export CORS_ORIGINS=https://ripcityticketdispatch.works,https://mazzlabs.works,http://localhost:3000

echo "Environment variables configured successfully!"
echo "Starting application..."

# Build and start the application
npm run build && npm start
