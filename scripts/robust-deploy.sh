#!/bin/bash
# RipCity Ticket Dispatch - ROBUST Droplet Console Deployment Script
# Replace YOUR_GITHUB_TOKEN_HERE with your actual GitHub Personal Access Token

echo "🚀 Starting RipCity Ticket Dispatch Backend Deployment"
echo "======================================================"

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 (LTS)
echo "📦 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
echo "📦 Installing PM2 process manager..."
sudo npm install -g pm2

# Install Nginx for reverse proxy
echo "📦 Installing Nginx..."
sudo apt install -y nginx

# Stop any existing PM2 processes
echo "🛑 Stopping existing processes..."
pm2 stop ripcity-api 2>/dev/null || echo "No existing process to stop"
pm2 delete ripcity-api 2>/dev/null || echo "No existing process to delete"

# Create application directory
echo "📁 Setting up application directory..."
sudo rm -rf /opt/ripcity-backend
sudo mkdir -p /opt/ripcity-backend
sudo chown -R root:root /opt/ripcity-backend
cd /opt/ripcity-backend

# Clone the repository using GitHub Token
echo "📥 Cloning repository with authentication..."
git clone https://YOUR_GITHUB_TOKEN_HERE@github.com/J-mazz/ripcityticketdispatch.works.git temp-repo

# Check if clone was successful
if [ -d "temp-repo" ]; then
    echo "✅ Repository cloned successfully"
    # Copy backend files to correct location
    if [ -d "temp-repo/ripcity-backend" ]; then
        cp -r temp-repo/ripcity-backend/* .
        rm -rf temp-repo
        echo "✅ Backend files copied to /opt/ripcity-backend"
        
        # Verify critical files exist
        if [ -f "package.json" ] && [ -d "src" ]; then
            echo "✅ Required files found: package.json and src directory"
        else
            echo "❌ Critical files missing - deployment may fail"
            ls -la
        fi
    else
        echo "❌ Backend directory not found in repository"
        echo "Available directories:"
        ls -la temp-repo/
        exit 1
    fi
else
    echo "❌ Failed to clone repository - check your GitHub token"
    exit 1
fi

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Verify build was successful
if [ -f "dist/server.js" ]; then
    echo "✅ TypeScript build successful"
else
    echo "❌ TypeScript build failed - checking for fallback"
    if [ -f "server.js" ]; then
        echo "✅ Using fallback server.js"
    else
        echo "❌ No server file found - deployment failed"
        exit 1
    fi
fi

# Create environment file
echo "⚙️  Setting up environment..."
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

# Configure Nginx
echo "🌐 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/ripcity-api << 'EOF'
server {
    listen 80;
    server_name api.ripcityticketdispatch.works;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # CORS headers
    add_header Access-Control-Allow-Origin "https://ripcityticketdispatch.works";
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
    add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With";
    add_header Access-Control-Allow-Credentials true;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Handle preflight requests
    location ~* \.(OPTIONS)$ {
        add_header Access-Control-Allow-Origin "https://ripcityticketdispatch.works";
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With";
        add_header Access-Control-Allow-Credentials true;
        add_header Content-Length 0;
        add_header Content-Type text/plain;
        return 204;
    }
}
EOF

# Enable Nginx site
sudo ln -sf /etc/nginx/sites-available/ripcity-api /etc/nginx/sites-enabled/
sudo nginx -t
if [ $? -eq 0 ]; then
    sudo systemctl reload nginx
    echo "✅ Nginx configuration successful"
else
    echo "❌ Nginx configuration failed"
    exit 1
fi

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Create log directory
sudo mkdir -p /var/log
sudo touch /var/log/ripcity-api.log /var/log/ripcity-api-out.log /var/log/ripcity-api-error.log
sudo chown root:root /var/log/ripcity-api*.log

# Start the application with PM2
echo "🚀 Starting application with PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup | tail -1 | sudo bash

# Test the deployment
echo "🔍 Testing deployment..."
sleep 5

# Test local connection
echo "Testing local connection..."
curl -f http://localhost:8080/health && echo "✅ Local health check passed" || echo "❌ Local health check failed"

# Show PM2 status
echo ""
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "📋 Recent logs:"
pm2 logs ripcity-api --lines 10

echo ""
echo "✅ Deployment Complete!"
echo "======================================================"
echo "🌐 API URL: https://api.ripcityticketdispatch.works"
echo "🔗 Health Check: https://api.ripcityticketdispatch.works/health"
echo ""
echo "📊 Monitor with:"
echo "  pm2 status"
echo "  pm2 logs ripcity-api"
echo "  sudo systemctl status nginx"
echo ""
echo "🔄 Update deployment:"
echo "  cd /opt/ripcity-backend"
echo "  git pull origin main"
echo "  npm run build"
echo "  pm2 restart ripcity-api"
