#!/bin/bash
# Deploy current monolith configuration to DigitalOcean
# Usage: ./scripts/deploy-monolith.sh

set -e

echo "🚀 Deploying RipCity Monolith to DigitalOcean..."
echo "================================================="

# Get current app ID (assuming it exists)
APP_ID=$(doctl apps list --format "ID,Spec.Name" --no-header | grep "ripcity-ticket-dispatch" | awk '{print $1}')

if [ -z "$APP_ID" ]; then
    echo "❌ No existing app found. Creating new app..."
    
    # Create new app with current configuration
    doctl apps create --spec .do/app.yaml
    
    echo "✅ New app created successfully!"
    echo "🔗 Check status with: doctl apps list"
    
else
    echo "📱 Found existing app: $APP_ID"
    
    # Update existing app
    echo "🔄 Updating app specification..."
    doctl apps update $APP_ID --spec .do/app.yaml
    
    # Force rebuild to pick up server.ts changes
    echo "🔨 Triggering force rebuild..."
    doctl apps create-deployment $APP_ID --force-rebuild
    
    echo "✅ Deployment triggered successfully!"
    echo "📊 Monitor deployment with: doctl apps get $APP_ID"
    echo "📋 View logs with: doctl apps logs $APP_ID --type=deploy"
fi

echo ""
echo "🎯 Expected URLs:"
echo "   Frontend: https://ripcityticketdispatch.works"
echo "   Backend:  https://api.ripcityticketdispatch.works"
echo "   Health:   https://api.ripcityticketdispatch.works/health"
echo "   Legal:    https://legal.ripcityticketdispatch.works"

echo ""
echo "⏱️ Deployment typically takes 5-10 minutes"
echo "🔍 Monitor status: doctl apps get $APP_ID"
