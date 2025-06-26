#!/bin/bash
# Deploy microservices configuration to DigitalOcean (Future use)
# Usage: ./scripts/deploy-microservices.sh

set -e

echo "🚀 Deploying RipCity Microservices to DigitalOcean..."
echo "====================================================="

echo "⚠️  WARNING: This will deploy multiple services and increase costs"
echo "💰 Estimated cost: ~$60/month (5 services × $12/month)"
echo ""
read -p "Do you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

# Check if microservices app already exists
MICRO_APP_ID=$(doctl apps list --format "ID,Spec.Name" --no-header | grep "ripcity-microservices" | awk '{print $1}' || true)

if [ -z "$MICRO_APP_ID" ]; then
    echo "🆕 Creating new microservices app..."
    
    # Create new microservices app
    doctl apps create --spec .do/microservices-app.yaml
    
    echo "✅ Microservices app created successfully!"
    echo "🔗 Check status with: doctl apps list"
    
else
    echo "📱 Found existing microservices app: $MICRO_APP_ID"
    
    # Update existing app
    echo "🔄 Updating microservices specification..."
    doctl apps update $MICRO_APP_ID --spec .do/microservices-app.yaml
    
    # Force rebuild
    echo "🔨 Triggering force rebuild..."
    doctl apps create-deployment $MICRO_APP_ID --force-rebuild
    
    echo "✅ Microservices deployment triggered!"
    echo "📊 Monitor deployment with: doctl apps get $MICRO_APP_ID"
fi

echo ""
echo "🎯 Expected Microservice URLs:"
echo "   Frontend:     https://ripcityticketdispatch.works"
echo "   Main API:     https://api.ripcityticketdispatch.works" 
echo "   Ticketmaster: https://ticketmaster.ripcityticketdispatch.works"
echo "   Eventbrite:   https://eventbrite.ripcityticketdispatch.works"
echo "   Legal:        https://legal.ripcityticketdispatch.works"

echo ""
echo "📊 Service Architecture:"
echo "   • Main API (Port 8080): Aggregation & primary endpoints"
echo "   • Ticketmaster API (Port 8081): Dedicated Ticketmaster service"
echo "   • Eventbrite API (Port 8082): Dedicated Eventbrite service"
echo "   • Frontend (Port 3000): React application"
echo "   • Legal Site: Static legal pages"

echo ""
echo "⏱️ Microservices deployment typically takes 10-15 minutes"
echo "💡 Monitor individual services with: doctl apps get $MICRO_APP_ID"
