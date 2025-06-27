#!/bin/bash
# Clean deployment script for RipCity Backend
# This will completely clean the deployment directory and redeploy from scratch

echo "🧹 Starting clean deployment of RipCity Backend"
echo "=============================================="

# Stop PM2 process first
echo "⏹️  Stopping PM2 process..."
pm2 stop ripcity-api || echo "PM2 process not running"
pm2 delete ripcity-api || echo "PM2 process not found"

# Clean deployment directory completely
echo "🗑️  Cleaning deployment directory..."
cd /opt
sudo rm -rf ripcity-backend
sudo mkdir -p ripcity-backend
sudo chown -R root:root ripcity-backend
cd ripcity-backend

# Clone repository fresh
echo "📥 Cloning repository..."
git clone https://github.com/J-mazz/ripcityticketdispatch.works.git temp-repo
if [ $? -eq 0 ]; then
    echo "✅ Repository cloned successfully"
    # Move backend files to correct location
    if [ -d "temp-repo/ripcity-backend" ]; then
        cp -r temp-repo/ripcity-backend/* .
        rm -rf temp-repo
        echo "✅ Backend files copied to /opt/ripcity-backend"
    else
        echo "❌ Backend directory not found in repository"
        exit 1
    fi
else
    echo "❌ Failed to clone repository"
    exit 1
fi

# Verify we have the correct files
echo "🔍 Verifying deployment files..."
if [ -f "package.json" ]; then
    echo "✅ package.json found"
else
    echo "❌ package.json not found - deployment failed"
    exit 1
fi

if [ -d "src" ]; then
    echo "✅ src directory found"
else
    echo "❌ src directory not found - deployment failed"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

# Create environment file
echo "⚙️  Creating environment file..."
cat > .env << 'EOF'
NODE_ENV=production
PORT=8080

# Ticketmaster API 
TICKETMASTER_KEY=KrJ30dNjFgddGx1vUTMB7fa5GDKU0TnT
TICKETMASTER_SECRET=I4dV25eQiAyoBwUh

# Eventbrite API
EVENTBRITE_KEY=EBBNVDS75EGKXDX2KUB3
EVENTBRITE_SECRET=RQS25BXDXPUHQY7CCE

# MongoDB
MONGODB_URI=mongodb+srv://j-mazz:3Cu8N6Pp5R2y0q79@private-db-mongo-nyc-888-157f5de1.mongo.ondigitalocean.com/ripcity-tickets?tls=true&authSource=admin&replicaSet=db-mongo-nyc-888
DATABASE_NAME=ripcitytickets
DATABASE_MAX_CONNECTIONS=20
DATABASE_IDLE_TIMEOUT=30000

# Authentication & Security
JWT_SECRET=74c5b447e137ff928cfa9072baf3dd60d08d59dced5609d9f59bd255343e361a3be901e7098adc378bb134b364b1b0703962bb355b346779f974d0f1292b0530
BCRYPT_ROUNDS=12

# External Services
OPENAI_API_KEY=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

# CORS & Security
CORS_ORIGINS=https://ripcityticketdispatch.works,https://api.ripcityticketdispatch.works
API_BASE_URL=https://app.ticketmaster.com/discovery/v2

# Monitoring & Analytics
SENTRY_DSN=https://935eba91453db0600b3a630c52db0b6b@o4509494273703936.ingest.us.sentry.io/4509494284582912
MIXPANEL_TOKEN=83fcad6d2ac6bbf0fb85f831ed4ecf81
MIXPANEL_SECRET=49174782e1d661ee7b03a26804f4e60e
GOOGLE_ANALYTICS_ID=G-8CZCX7V6YQ
GOOGLE_ANALYTICS_ID_2=GT-WV8XKJHS

# Business Configuration
COMPANY_EMAIL=support@ripcityticketdispatch.works
ADMIN_EMAIL=admin@ripcityticketdispatch.works

# Rate Limiting
RATE_LIMIT_REQUESTS_PER_MINUTE=100
RATE_LIMIT_REQUESTS_PER_HOUR=1000
EOF

# Create PM2 ecosystem file
echo "⚙️  Creating PM2 configuration..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'ripcity-api',
    script: 'dist/server.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 8080
    },
    log_file: '/var/log/ripcity-api.log',
    out_file: '/var/log/ripcity-api-out.log',
    error_file: '/var/log/ripcity-api-error.log',
    time: true,
    restart_delay: 5000,
    max_restarts: 10
  }]
};
EOF

# Verify dist directory exists
if [ -d "dist" ] && [ -f "dist/server.js" ]; then
    echo "✅ Built server found at dist/server.js"
else
    echo "❌ Built server not found - checking build output..."
    ls -la dist/ || echo "dist directory not found"
    exit 1
fi

# Start with PM2
echo "🚀 Starting application with PM2..."
pm2 start ecosystem.config.js
pm2 save

# Test the deployment
echo "🔍 Testing deployment..."
sleep 5
curl -f http://localhost:8080/health || echo "⚠️  Health check failed - checking logs..."

# Show status
echo "📊 Current status:"
pm2 status
echo ""
echo "📋 Recent logs:"
pm2 logs ripcity-api --lines 10

echo ""
echo "✅ Clean deployment complete!"
echo "=============================="
echo "🌐 API URL: https://api.ripcityticketdispatch.works"
echo "🔗 Health Check: https://api.ripcityticketdispatch.works/health"
echo ""
echo "📊 Monitor with:"
echo "  pm2 status"
echo "  pm2 logs ripcity-api"
echo "  curl http://localhost:8080/health"
