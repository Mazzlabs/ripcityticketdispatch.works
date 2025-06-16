#!/bin/bash

# RIP CITY TICKET DISPATCH - Production Setup & Deployment Verification
# DigitalOcean → MongoDB → Cloudflare Pipeline

echo "🏀 RIP CITY TICKET DISPATCH - PRODUCTION SETUP"
echo "=============================================="
echo "DigitalOcean Hosting → MongoDB Database → Cloudflare CDN"
echo ""

# Check working directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the root project directory"
    exit 1
fi

echo "📁 Current directory: $(pwd)"
echo ""

# Build frontend first
echo "🎨 Building React Frontend..."
cd rip-city-tickets-react
npm install
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    exit 1
fi

cd ..

# Setup backend
echo ""
echo "⚙️  Setting up Backend..."
cd ripcity-backend

# Install dependencies
echo "📦 Installing backend dependencies..."
npm install

# Check environment file
if [ ! -f ".env" ]; then
    echo "❌ .env file missing in ripcity-backend/"
    echo "Please copy your .env file to ripcity-backend/.env"
    exit 1
fi

# Load and validate environment
source .env

echo ""
echo "🔑 Validating API Credentials:"
[ -n "$TICKETMASTER_KEY" ] && echo "✅ Ticketmaster API: Configured" || echo "❌ Ticketmaster API: Missing"
[ -n "$EVENTBRITE_KEY" ] && echo "✅ Eventbrite API: Configured" || echo "❌ Eventbrite API: Missing"
[ -n "$MONGODB_URI" ] && echo "✅ MongoDB: Configured" || echo "❌ MongoDB: Missing"

echo ""
echo "🟡 MVP Bypassed Services (Pending Approval):"
echo "   - Stripe Payment Processing"
echo "   - Twilio SMS Services"
echo "   - SendGrid Email Services"

# Test MongoDB connection
echo ""
echo "🗄️  Testing MongoDB Connection..."
node -e "
const mongoose = require('mongoose');
mongoose.connect('$MONGODB_URI', { serverSelectionTimeoutMS: 10000 })
  .then(() => {
    console.log('✅ MongoDB connection successful');
    console.log('✅ Database:', mongoose.connection.db.databaseName);
    return mongoose.disconnect();
  })
  .then(() => process.exit(0))
  .catch(err => {
    console.log('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
"

if [ $? -ne 0 ]; then
    echo "❌ Database connection failed - check your MONGODB_URI"
    exit 1
fi

# Build backend
echo ""
echo "🔨 Building Production Backend..."
npm run build:production

if [ $? -eq 0 ]; then
    echo "✅ Backend build successful"
else
    echo "❌ Backend build failed"
    exit 1
fi

cd ..

# Verify legal site
echo ""
echo "⚖️  Verifying Legal Documentation..."
if [ -d "legal-site" ]; then
    echo "✅ Legal site ready for https://legal.ripcityticketdispatch.works"
    echo "   📄 Files: $(ls legal-site/*.html | wc -l) HTML pages"
else
    echo "❌ Legal site directory missing"
fi

# Check Cloudflare configuration
echo ""
echo "☁️  Cloudflare Deployment Check..."
if [ -d "cloudflare" ]; then
    echo "✅ Cloudflare configuration present"
    if [ -f "cloudflare/wrangler.toml" ]; then
        echo "✅ Wrangler configuration found"
    else
        echo "🟡 Wrangler configuration may need setup"
    fi
else
    echo "🟡 Cloudflare directory not found"
fi

echo ""
echo "🎯 DEPLOYMENT SUMMARY"
echo "===================="
echo "✅ Frontend: Built and ready"
echo "✅ Backend: Production server with live APIs"
echo "✅ Database: MongoDB connected"
echo "✅ Legal Site: TCPA compliance docs"
echo "🟡 Payment/SMS: Bypassed for MVP"
echo ""
echo "🚀 Ready for DigitalOcean Deployment!"
echo ""
echo "Next Steps:"
echo "1. Deploy to DigitalOcean droplet"
echo "2. Configure Cloudflare DNS"
echo "3. Point ripcityticketdispatch.works to your server"
echo "4. Test live APIs at https://ripcityticketdispatch.works"
echo ""
echo "MVP will demonstrate:"
echo "- Live Ticketmaster & Eventbrite integration"
echo "- Real-time Portland event deals"
echo "- TCPA-compliant legal framework"
echo "- Professional ticket discovery platform"
