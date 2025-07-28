#!/bin/bash
# Deployment script for Stake.us affiliate site
# Usage: ./deploy.sh

echo "🏀 Deploying Rip City Tickets - Stake.us Affiliate Site"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if doctl is installed
if ! command -v doctl &> /dev/null; then
    echo "❌ doctl CLI not found. Please install DigitalOcean CLI first."
    exit 1
fi

# Check if logged in to DigitalOcean
if ! doctl auth list &> /dev/null; then
    echo "❌ Not authenticated with DigitalOcean. Run 'doctl auth init' first."
    exit 1
fi

echo "📋 Using app spec: app-spec.yaml"
echo "🔗 Domain: ripcityticketdispatch.works"
echo "💰 Referral Code: RIPCITYTICKETS"
echo ""

# Deploy or update app
if doctl apps list --format Name --no-header | grep -q "ripcitytickets-affiliate"; then
    echo "🔄 Updating existing app..."
    APP_ID=$(doctl apps list --format ID,Name --no-header | grep "ripcitytickets-affiliate" | awk '{print $1}')
    doctl apps update $APP_ID --spec app-spec.yaml
else
    echo "🆕 Creating new app..."
    doctl apps create --spec app-spec.yaml
fi

echo ""
echo "✅ Deployment initiated!"
echo "🌐 Your site will be available at: https://ripcityticketdispatch.works"
echo "🎯 Make sure to update DJANGO_SECRET_KEY in the app settings for production!"
