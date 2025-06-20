#!/bin/bash

# RIP CITY TICKET DISPATCH - DigitalOcean MERN Droplet Setup
# This script sets up the production environment on your DigitalOcean droplet

set -e  # Exit on any error

echo "🏀 RIP CITY TICKET DISPATCH - DigitalOcean Setup"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root or with sudo
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}This script should not be run as root. Please run as the 'mern' user.${NC}"
   exit 1
fi

# Get MongoDB password
echo -e "${YELLOW}📋 Getting MongoDB password...${NC}"
if [ -f /root/.digitalocean_password ]; then
    MONGO_PASSWORD=$(sudo cat /root/.digitalocean_password)
    echo -e "${GREEN}✅ MongoDB password found${NC}"
else
    echo -e "${RED}❌ MongoDB password file not found at /root/.digitalocean_password${NC}"
    echo "Please enter your MongoDB admin password:"
    read -s MONGO_PASSWORD
fi

# Create application directory
APP_DIR="/home/mern/ripcity-backend"
echo -e "${YELLOW}📁 Creating application directory: $APP_DIR${NC}"
mkdir -p "$APP_DIR"
cd "$APP_DIR"

# Clone or update repository
if [ -d ".git" ]; then
    echo -e "${YELLOW}🔄 Updating existing repository...${NC}"
    git pull origin main
else
    echo -e "${YELLOW}📥 Cloning repository...${NC}"
    git clone https://github.com/J-mazz/ripcityticketdispatch.works.git .
fi

# Move to backend directory
cd ripcity-backend

# Install dependencies
echo -e "${YELLOW}📦 Installing Node.js dependencies...${NC}"
npm install

# Create production environment file
echo -e "${YELLOW}⚙️  Creating production environment file...${NC}"
cat > .env << EOF
# DigitalOcean Production Environment - Auto-generated $(date)
# Database Connection (Local MongoDB)
MONGODB_URI=mongodb://admin:${MONGO_PASSWORD}@127.0.0.1:27017/ripcity_tickets

# Server Configuration
NODE_ENV=production
PORT=8080

# API Keys (REQUIRED - Set these manually)
TICKETMASTER_KEY=\${TICKETMASTER_KEY:-}
EVENTBRITE_KEY=\${EVENTBRITE_KEY:-}

# CORS Configuration (CloudFlare Domain)
CORS_ORIGINS=https://ripcityticketdispatch.works,https://mazzlabs.works,https://api.ripcityticketdispatch.works

# MVP Bypassed Services (Add when approved)
# STRIPE_SECRET=
# TWILIO_ACCOUNT_SID=
# TWILIO_AUTH_TOKEN=
# SENDGRID_API_KEY=

# Security (Generate secure values)
JWT_SECRET=\$(openssl rand -base64 32 | tr -d '\n')
BCRYPT_ROUNDS=12

# Logging
LOG_LEVEL=info

# Frontend URL
FRONTEND_URL=https://ripcityticketdispatch.works

# Rate Limiting
RATE_LIMIT_REQUESTS_PER_MINUTE=100
EOF

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32 | tr -d '\n')
sed -i "s/\\\$(openssl rand -base64 32 | tr -d '\\\\n')/$JWT_SECRET/" .env

echo -e "${GREEN}✅ Environment file created with real MongoDB credentials${NC}"

# Build the application
echo -e "${YELLOW}🔨 Building application...${NC}"
npm run build:production

# Test MongoDB connection
echo -e "${YELLOW}🧪 Testing MongoDB connection...${NC}"
if npm run test-db; then
    echo -e "${GREEN}✅ MongoDB connection successful${NC}"
else
    echo -e "${RED}❌ MongoDB connection failed${NC}"
    echo "Please check your MongoDB setup and credentials"
fi

# Stop existing PM2 processes for this app
echo -e "${YELLOW}🔄 Managing PM2 processes...${NC}"
pm2 stop ripcity-backend 2>/dev/null || echo "No existing process to stop"
pm2 delete ripcity-backend 2>/dev/null || echo "No existing process to delete"

# Start with PM2
echo -e "${YELLOW}🚀 Starting application with PM2...${NC}"
pm2 start dist/server-dynamic-live.js --name "ripcity-backend" --env production

# Save PM2 configuration
pm2 save
pm2 startup

echo ""
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Set your API keys in the .env file:"
echo "   nano $APP_DIR/ripcity-backend/.env"
echo ""
echo "2. Add your Ticketmaster and Eventbrite API keys"
echo ""
echo "3. Restart the application:"
echo "   pm2 restart ripcity-backend"
echo ""
echo "4. Check application status:"
echo "   pm2 list"
echo "   pm2 logs ripcity-backend"
echo ""
echo "5. Test the API:"
echo "   curl http://localhost:8080/health"
echo ""
echo -e "${GREEN}🌐 Your API will be available at: https://ripcityticketdispatch.works/api${NC}"
echo ""
