#!/bin/bash

# RIP CITY TICKET DISPATCH - Live API Test Script
# Tests connections to certified Ticketmaster and Eventbrite APIs

echo "🏀 RIP CITY TICKET DISPATCH - API CONNECTION TEST"
echo "================================================"

# Check if we're in the right directory
if [ ! -f "ripcity-backend/.env" ]; then
    echo "❌ .env file not found in ripcity-backend/"
    echo "Please run this script from the root project directory"
    exit 1
fi

# Load environment variables
source ripcity-backend/.env

echo "🔍 Checking API credentials..."

# Check Ticketmaster API key
if [ -z "$TICKETMASTER_KEY" ]; then
    echo "❌ TICKETMASTER_KEY not found in .env"
    TICKETMASTER_STATUS="MISSING"
else
    echo "✅ Ticketmaster API key configured"
    TICKETMASTER_STATUS="CONFIGURED"
fi

# Check Eventbrite API key
if [ -z "$EVENTBRITE_KEY" ]; then
    echo "❌ EVENTBRITE_KEY not found in .env"
    EVENTBRITE_STATUS="MISSING"
else
    echo "✅ Eventbrite API key configured"
    EVENTBRITE_STATUS="CONFIGURED"
fi

# Check MongoDB URI
if [ -z "$MONGODB_URI" ]; then
    echo "❌ MONGODB_URI not found in .env"
    MONGODB_STATUS="MISSING"
else
    echo "✅ MongoDB URI configured"
    MONGODB_STATUS="CONFIGURED"
fi

echo ""
echo "🚀 Starting live API server..."
echo "This will use your REAL certified API keys"

# Build and start the server
cd ripcity-backend

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building TypeScript..."
npm run build

echo "🌐 Starting server with live APIs..."
echo "Server will be available at: http://localhost:8080"
echo ""
echo "Test endpoints:"
echo "  - Health check: http://localhost:8080/health"
echo "  - Live API test: http://localhost:8080/api/test-live-data"
echo "  - Live deals: http://localhost:8080/api/deals"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
npm run start:production
