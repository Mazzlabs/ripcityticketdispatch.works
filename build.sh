#!/bin/bash

# Build script for Rip City Tickets affiliate site
echo "🏀 Building Rip City Tickets - Stake.us Affiliate Site"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Navigate to frontend directory
cd affiliate-frontend || { echo "❌ Error: affiliate-frontend directory not found"; exit 1; }

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build the project
echo "🔨 Building production site..."
npm run build

# Check if build was successful
if [ -d "build" ]; then
    echo "✅ Build successful!"
    echo "📊 Build size:"
    du -sh build/
    echo ""
    echo "📁 Build contents:"
    ls -la build/
    echo ""
    echo "🚀 Ready for deployment!"
    echo "💰 Promo code: RIPCITYTICKETS"
else
    echo "❌ Build failed!"
    exit 1
fi
