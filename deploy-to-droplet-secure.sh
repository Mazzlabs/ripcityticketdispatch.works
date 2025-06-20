#!/bin/bash

# 🏀 RIP CITY TICKET DISPATCH - DigitalOcean MERN Droplet Setup
# This script sets up your MERN droplet for the Rip City API with REAL credentials

set -e  # Exit on any error

echo "🏀 Setting up Rip City Ticket Dispatch on DigitalOcean MERN Droplet"
echo "=================================================================="

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should NOT be run as root. Please run as the mern user."
   exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() { echo -e "${GREEN}[INFO]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Step 1: Get MongoDB password from droplet
print_status "Getting MongoDB password from droplet..."
if [[ -f "/root/.digitalocean_password" ]]; then
    MONGO_PASSWORD=$(sudo cat /root/.digitalocean_password 2>/dev/null || echo "")
    if [[ -z "$MONGO_PASSWORD" ]]; then
        print_error "Could not read MongoDB password from /root/.digitalocean_password"
        print_warning "Please run: sudo cat /root/.digitalocean_password"
        exit 1
    fi
    print_status "MongoDB password retrieved ✓"
else
    print_error "MongoDB password file not found at /root/.digitalocean_password"
    exit 1
fi

# Step 2: Prompt for API keys (REQUIRED)
print_warning "You need to provide your API keys for the service to work:"
echo ""
echo -n "Enter your Ticketmaster API key: "
read -r TICKETMASTER_KEY
if [[ -z "$TICKETMASTER_KEY" ]]; then
    print_error "Ticketmaster API key is required!"
    exit 1
fi

echo -n "Enter your Eventbrite API key: "
read -r EVENTBRITE_KEY
if [[ -z "$EVENTBRITE_KEY" ]]; then
    print_error "Eventbrite API key is required!"
    exit 1
fi

# Step 3: Create app directory
print_status "Creating application directory..."
APP_DIR="/home/mern/ripcity-app"
mkdir -p $APP_DIR
cd $APP_DIR

# Step 4: Clone repository
print_status "Cloning Rip City repository..."
if [[ -d "ripcityticketdispatch.works" ]]; then
    print_warning "Repository already exists, pulling latest changes..."
    cd ripcityticketdispatch.works
    git pull origin main
else
    git clone https://github.com/J-mazz/ripcityticketdispatch.works.git
    cd ripcityticketdispatch.works
fi

# Step 5: Setup backend
print_status "Setting up backend..."
cd ripcity-backend
npm install

# Step 6: Create .env file with REAL secrets
print_status "Creating environment configuration with real credentials..."
cat > .env << EOF
# DigitalOcean Production Environment
NODE_ENV=production
PORT=8080

# Database Connection (Local MongoDB with REAL password)
MONGODB_URI=mongodb://admin:${MONGO_PASSWORD}@127.0.0.1:27017/ripcity_tickets

# CORS Configuration
CORS_ORIGINS=https://ripcityticketdispatch.works,https://mazzlabs.works,http://localhost:3000

# API Keys (REAL CREDENTIALS)
TICKETMASTER_KEY=${TICKETMASTER_KEY}
EVENTBRITE_KEY=${EVENTBRITE_KEY}

# Security (SECURE JWT SECRET)
JWT_SECRET=rip_city_blazers_$(openssl rand -hex 32)_super_secret
BCRYPT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_REQUESTS_PER_MINUTE=100

# Logging
LOG_LEVEL=info

# Frontend URL
FRONTEND_URL=https://ripcityticketdispatch.works

# MVP Bypassed Services (Add when approved)
# STRIPE_SECRET=
# TWILIO_ACCOUNT_SID=
# TWILIO_AUTH_TOKEN=
# SENDGRID_API_KEY=
EOF

print_status "Environment file created with real credentials ✓"

# Step 7: Build the application
print_status "Building application..."
npm run build:production

# Step 8: Test MongoDB connection
print_status "Testing MongoDB connection..."
node -e "
const mongoose = require('mongoose');
const uri = 'mongodb://admin:${MONGO_PASSWORD}@127.0.0.1:27017/ripcity_tickets';
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => { console.log('✓ MongoDB connection successful'); mongoose.disconnect(); })
  .catch(err => { console.error('✗ MongoDB connection failed:', err.message); process.exit(1); });
"

# Step 9: Setup PM2 process
print_status "Setting up PM2 process..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'ripcity-api',
    script: 'dist/server-dynamic-live.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 8080
    }
  }]
};
EOF

# Step 10: Start the application
print_status "Starting application with PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Step 11: Test the API
print_status "Testing API health endpoint..."
sleep 3
if curl -f http://localhost:8080/health > /dev/null 2>&1; then
    print_status "✓ API is responding on port 8080"
else
    print_warning "API might still be starting up... check with: pm2 logs ripcity-api"
fi

echo ""
echo "🎉 SUCCESS! Rip City Ticket Dispatch API is now running!"
echo "=================================================================="
echo "📊 Status: pm2 status"
echo "📋 Logs: pm2 logs ripcity-api"
echo "🔄 Restart: pm2 restart ripcity-api"
echo "🌐 Test API: curl http://localhost:8080/health"
echo ""
print_status "Your API is ready to serve ticket data with REAL credentials!"
echo "Next: Configure Nginx to proxy traffic to port 8080"
