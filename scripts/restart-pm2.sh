#!/bin/bash
# Quick PM2 restart script for RipCity Backend

echo "🔧 Restarting RipCity Backend after MongoDB fix"
echo "=============================================="

cd /opt/ripcity-backend

echo "📊 Current PM2 status:"
pm2 status

echo ""
echo "🚀 Starting ripcity-api with PM2..."
pm2 start ecosystem.config.js

echo ""
echo "💾 Saving PM2 configuration..."
pm2 save

echo ""
echo "⏱️  Waiting 5 seconds for startup..."
sleep 5

echo ""
echo "🔍 Testing local connection..."
curl -s http://localhost:8080/health | head -3

echo ""
echo "📊 Final PM2 status:"
pm2 status

echo ""
echo "📋 Recent logs:"
pm2 logs ripcity-api --lines 5

echo ""
echo "✅ Restart complete!"
echo "🌐 Test external: curl https://api.ripcityticketdispatch.works/health"
