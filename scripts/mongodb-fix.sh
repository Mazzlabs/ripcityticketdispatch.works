#!/bin/bash
# Quick MongoDB Connection Fix Script

echo "🔧 MongoDB Connection Fix for RipCity Backend"
echo "============================================="

# Test current server status
echo "📊 Current PM2 Status:"
pm2 status

echo ""
echo "🌐 Test API without MongoDB (should work for non-DB endpoints):"
curl -s http://localhost:8080/health | head -5

echo ""
echo "🔍 MongoDB Connection Troubleshooting:"
echo "1. Testing DNS resolution..."
nslookup private-db-mongo-nyc-888-157f5de1.mongo.ondigitalocean.com

echo ""
echo "2. Testing network connectivity..."
ping -c 2 private-db-mongo-nyc-888-157f5de1.mongo.ondigitalocean.com || echo "Ping failed - likely firewall"

echo ""
echo "3. Checking droplet's outbound connectivity..."
curl -s https://httpbin.org/ip || echo "No outbound internet - check firewall"

echo ""
echo "🔧 Possible fixes:"
echo "Option 1: Allow MongoDB in firewall:"
echo "  sudo ufw allow out 27017/tcp"
echo ""
echo "Option 2: Disable strict database requirement for testing:"
echo "  # Modify server to continue without DB"
echo ""
echo "Option 3: Test with simpler health endpoint:"
echo "  curl http://localhost:8080/api/venues"

echo ""
echo "🚀 Meanwhile, test what's working:"
echo "Direct API test (bypass MongoDB):"
curl -s "http://localhost:8080/api/venues?city=Portland" | head -10 || echo "API not responding"

echo ""
echo "External access test:"
curl -s "https://api.ripcityticketdispatch.works/health" | head -5 || echo "External access blocked"
