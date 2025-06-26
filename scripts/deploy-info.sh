#!/bin/bash
# DigitalOcean Deployment Scripts using doctl
# Make executable: chmod +x scripts/deploy-*.sh

echo "🚀 DigitalOcean Deployment Scripts - RipCity Ticket Dispatch"
echo "============================================================="

# Check if doctl is installed
if ! command -v doctl &> /dev/null; then
    echo "❌ doctl is not installed. Install with:"
    echo "   wget https://github.com/digitalocean/doctl/releases/download/v1.94.0/doctl-1.94.0-linux-amd64.tar.gz"
    echo "   tar xf doctl-1.94.0-linux-amd64.tar.gz"
    echo "   sudo mv doctl /usr/local/bin"
    exit 1
fi

# Check if authenticated
if ! doctl auth list &> /dev/null; then
    echo "❌ doctl is not authenticated. Run:"
    echo "   doctl auth init"
    exit 1
fi

echo "✅ doctl is installed and authenticated"

# Current deployment info
echo ""
echo "📊 Current App Status:"
doctl apps list --format "ID,Spec.Name,LastDeploymentActiveAt,LiveURL"

echo ""
echo "🔧 Available Deployment Commands:"
echo "1. Deploy current monolith:     ./scripts/deploy-monolith.sh"
echo "2. Deploy microservices:       ./scripts/deploy-microservices.sh" 
echo "3. Check deployment status:    ./scripts/check-deployment.sh"
echo "4. View app logs:              ./scripts/view-logs.sh"
echo "5. Force rebuild:              ./scripts/force-rebuild.sh"

echo ""
echo "📋 Quick Commands:"
echo "   doctl apps list"
echo "   doctl apps get <app-id>"
echo "   doctl apps create-deployment <app-id> --force-rebuild"
echo "   doctl apps logs <app-id> --type=deploy"
