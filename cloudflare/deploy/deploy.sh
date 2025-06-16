#!/bin/bash

# CloudFlare Deployment Script for Rip City Ticket Dispatch
# This script deploys the caching layer to enhance your existing backend

echo "🏀 Deploying Rip City CloudFlare Enhancement Layer..."

# Check if wrangler is installed locally
if ! command -v wrangler &> /dev/null && ! [ -f "node_modules/.bin/wrangler" ]; then
    echo "❌ Wrangler CLI not found. Installing locally..."
    npm install wrangler
fi

# Use local wrangler if available, otherwise global
if [ -f "node_modules/.bin/wrangler" ]; then
    WRANGLER="./node_modules/.bin/wrangler"
else
    WRANGLER="wrangler"
fi

# Check if user is logged in to CloudFlare
echo "🔐 Checking CloudFlare authentication..."
if ! $WRANGLER whoami &> /dev/null; then
    echo "❌ Not logged in to CloudFlare. Please login:"
    $WRANGLER login
fi

# Create R2 buckets
echo "🪣 Creating R2 storage buckets..."

# Static assets bucket
$WRANGLER r2 bucket create ripcity-static-assets || echo "Bucket may already exist"

# Ticket cache bucket  
$WRANGLER r2 bucket create ripcity-ticket-cache || echo "Bucket may already exist"

# Create KV namespaces (already created above, but showing for reference)
echo "🗃️ KV namespaces already created:"
echo "  - API_CACHE: dad7675f68124728a2f3c3579f6b6ad7"
echo "  - RATE_LIMIT: 54c6e429fe274732ab805a72b12e261d"

echo "⚠️  IMPORTANT: Copy the namespace IDs above into your wrangler.toml file!"
echo ""

# Deploy the worker
echo "🚀 Deploying cache worker..."
$WRANGLER deploy --config config/wrangler.toml

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update your wrangler.toml with the KV namespace IDs shown above"
echo "2. Set your BACKEND_URL environment variable to your DigitalOcean backend"
echo "3. Test the worker: curl https://ripcityticketdispatch.works/api/cache/health"
echo "4. Update your frontend to use /api/cache/ endpoints for cached data"
echo ""
echo "🔧 Configuration needed in CloudFlare dashboard:"
echo "- Set BACKEND_URL = https://your-digitalocean-app.ondigitalocean.app"
echo "- Set CACHE_TTL = 300 (5 minutes)"
echo "- Set ENVIRONMENT = production"
