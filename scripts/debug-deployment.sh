#!/bin/bash
# Debug deployment script
echo "🔍 Debugging RipCity Backend Deployment"
echo "========================================"

echo "📊 PM2 Status:"
pm2 status

echo ""
echo "📋 PM2 Logs (last 20 lines):"
pm2 logs ripcity-api --lines 20

echo ""
echo "🔍 Check if dist/server.js exists:"
ls -la /opt/ripcity-backend/dist/

echo ""
echo "🔍 Check environment file:"
cat /opt/ripcity-backend/.env | head -5

echo ""
echo "🔍 Check PM2 config:"
cat /opt/ripcity-backend/ecosystem.config.js

echo ""
echo "🔍 Check what's listening on port 8080:"
netstat -tulpn | grep 8080 || echo "Nothing listening on port 8080"

echo ""
echo "🔍 Try to manually start the server:"
cd /opt/ripcity-backend && node dist/server.js &
sleep 3
curl http://localhost:8080/health || echo "Manual start failed"
pkill -f "node dist/server.js"
