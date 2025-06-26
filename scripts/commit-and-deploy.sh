#!/bin/bash
# Commit and push changes to trigger DigitalOcean deployment
# Usage: ./scripts/commit-and-deploy.sh "commit message"

set -e

echo "🚀 Committing Changes & Triggering DigitalOcean Deployment"
echo "=========================================================="

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Not in a git repository"
    exit 1
fi

# Get commit message from argument or prompt
if [ -z "$1" ]; then
    echo "📝 Enter commit message:"
    read -r COMMIT_MSG
else
    COMMIT_MSG="$1"
fi

echo "📋 Changes to commit:"
git status --porcelain

echo ""
echo "🔍 Git status:"
git status

echo ""
read -p "Proceed with commit and push? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Commit cancelled"
    exit 1
fi

# Stage all changes
echo "📦 Staging changes..."
git add .

# Commit changes
echo "💾 Committing changes..."
git commit -m "$COMMIT_MSG"

# Push to main branch (triggers DigitalOcean deployment)
echo "🚀 Pushing to main branch..."
git push origin main

echo ""
echo "✅ Changes pushed successfully!"
echo "🔄 DigitalOcean deployment will begin automatically"

# Show current app status
echo ""
echo "📊 Current DigitalOcean Apps:"
if command -v doctl &> /dev/null && doctl auth list &> /dev/null; then
    doctl apps list --format "ID,Spec.Name,LastDeploymentActiveAt,LiveURL"
    
    echo ""
    echo "🔍 Monitor deployment with:"
    echo "   doctl apps list"
    echo "   doctl apps logs <app-id> --type=deploy"
else
    echo "💡 Install doctl to monitor deployment status"
fi

echo ""
echo "🎯 Expected deployment completion: 5-10 minutes"
echo "🔗 Check health: https://api.ripcityticketdispatch.works/health"
echo "🌐 Frontend: https://ripcityticketdispatch.works"
