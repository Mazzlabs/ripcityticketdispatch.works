#!/bin/bash

# RIP CITY TICKET DISPATCH - DROPLET DEPLOYMENT SCRIPT
# Deploy Node.js backend to api.ripcityticketdispatch.works droplet
# Author: Joseph Mazzini <joseph@mazzlabs.works>

set -e

# Configuration
DROPLET_USER="admin"
DROPLET_HOST="api.ripcityticketdispatch.works"
APP_NAME="ripcity-backend"
APP_DIR="/opt/ripcity-backend"
REPO_URL="https://github.com/J-mazz/ripcityticketdispatch.works.git"
NODE_VERSION="20"

echo "🚀 Deploying RipCity Ticket Dispatch Backend to Droplet"
echo "=================================================="
echo "Target: ${DROPLET_USER}@${DROPLET_HOST}"
echo "App Directory: ${APP_DIR}"
echo ""

# Test SSH connection
echo "� Testing SSH connection..."
ssh -o ConnectTimeout=10 -o BatchMode=yes ${DROPLET_USER}@${DROPLET_HOST} "echo 'SSH connection successful'" || {
    echo "❌ SSH connection failed. Please check:"
    echo "   - SSH key is loaded: ssh-add -l"
    echo "   - Droplet is running: doctl compute droplet list"
    echo "   - DNS is resolving: nslookup ${DROPLET_HOST}"
    exit 1
}

echo "✅ SSH connection successful"
echo ""

# Deploy application
echo "📦 Deploying application..."
ssh ${DROPLET_USER}@${DROPLET_HOST} << 'EOF'
    set -e
    
    echo "🔧 Setting up system dependencies..."
    sudo apt update
    sudo apt install -y curl git nginx ufw
    
    # Install Node.js 20
    if ! command -v node &> /dev/null || [[ $(node -v | cut -d'v' -f2 | cut -d'.' -f1) -lt 20 ]]; then
        echo "📦 Installing Node.js 20..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    
    echo "✅ Node.js version: $(node -v)"
    echo "✅ NPM version: $(npm -v)"
    
    # Install PM2 for process management
    if ! command -v pm2 &> /dev/null; then
        echo "📦 Installing PM2..."
        sudo npm install -g pm2
    fi
    
    # Create application directory
    sudo mkdir -p /opt/ripcity-backend
    sudo chown -R admin:admin /opt/ripcity-backend
    
    # Clone or update repository
    if [ -d "/opt/ripcity-backend/.git" ]; then
        echo "� Updating existing repository..."
        cd /opt/ripcity-backend
        git fetch origin
        git reset --hard origin/main
    else
        echo "📥 Cloning repository..."
        git clone https://github.com/J-mazz/ripcityticketdispatch.works.git /opt/ripcity-backend
        cd /opt/ripcity-backend
    fi
    
    # Navigate to backend directory
    cd /opt/ripcity-backend/ripcity-backend
    
    echo "📦 Installing dependencies..."
    npm install --production
    
    # Build TypeScript
    echo "🔨 Building TypeScript..."
    npm run build
    
    # Create environment file
    echo "⚙️ Setting up environment variables..."
    cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=8080
MONGODB_URI=mongodb://localhost:27017/ripcitytickets

# API Keys (replace with actual values)
TICKETMASTER_KEY=your_ticketmaster_key_here
EVENTBRITE_KEY=your_eventbrite_key_here

# CORS Origins
CORS_ORIGINS=https://ripcityticketdispatch.works,https://www.ripcityticketdispatch.works,https://api.ripcityticketdispatch.works
ENVEOF
    
    # Create PM2 ecosystem file
    echo "⚙️ Creating PM2 configuration..."
    cat > ecosystem.config.js << 'PMEOF'
module.exports = {
  apps: [{
    name: 'ripcity-api',
    script: 'dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 8080
    },
    error_file: '/var/log/ripcity-api-error.log',
    out_file: '/var/log/ripcity-api-out.log',
    log_file: '/var/log/ripcity-api.log',
    time: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
PMEOF
    
    # Setup log files
    sudo mkdir -p /var/log
    sudo touch /var/log/ripcity-api-error.log /var/log/ripcity-api-out.log /var/log/ripcity-api.log
    sudo chown admin:admin /var/log/ripcity-api*.log
    
    # Configure Nginx
    echo "🌐 Configuring Nginx..."
    sudo tee /etc/nginx/sites-available/ripcity-api << 'NGINXEOF'
server {
    listen 80;
    listen [::]:80;
    server_name api.ripcityticketdispatch.works;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy strict-origin-when-cross-origin;
    
    # CORS headers for API
    add_header Access-Control-Allow-Origin "https://ripcityticketdispatch.works" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With" always;
    add_header Access-Control-Allow-Credentials true always;
    
    # Handle preflight requests
    if ($request_method = 'OPTIONS') {
        return 204;
    }
    
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
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:8080/health;
        access_log off;
    }
}
NGINXEOF
    
    # Enable site
    sudo ln -sf /etc/nginx/sites-available/ripcity-api /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test Nginx configuration
    sudo nginx -t
    
    # Configure firewall
    echo "🔥 Configuring firewall..."
    sudo ufw --force enable
    sudo ufw allow ssh
    sudo ufw allow 'Nginx Full'
    sudo ufw allow 80
    sudo ufw allow 443
    
    # Start services
    echo "🚀 Starting services..."
    
    # Stop any existing PM2 processes
    pm2 delete all 2>/dev/null || true
    
    # Start the application
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup systemd -u admin --hp /home/admin
    
    # Restart Nginx
    sudo systemctl restart nginx
    sudo systemctl enable nginx
    
    echo ""
    echo "✅ Deployment completed successfully!"
    echo "🌐 API should be available at: https://api.ripcityticketdispatch.works"
    echo "📊 Monitor with: pm2 monit"
    echo "📋 Logs: pm2 logs ripcity-api"
    echo ""
EOF

echo ""
echo "🎉 Deployment script completed!"
echo ""
echo "📋 Next steps:"
echo "1. Update environment variables on the droplet:"
echo "   ssh ${DROPLET_USER}@${DROPLET_HOST}"
echo "   cd /opt/ripcity-backend/ripcity-backend"
echo "   nano .env"
echo ""
echo "2. Test the API:"
echo "   curl https://api.ripcityticketdispatch.works/health"
echo ""
echo "3. Monitor the application:"
echo "   ssh ${DROPLET_USER}@${DROPLET_HOST} 'pm2 monit'"
echo ""
echo "4. View logs:"
echo "   ssh ${DROPLET_USER}@${DROPLET_HOST} 'pm2 logs ripcity-api'"
echo ""
echo "🔧 Check status with: pm2 status"
echo "📊 View logs with: pm2 logs ripcity-backend"
EOF

echo "✅ Deployment script completed!"
echo ""
echo "🧪 Testing API endpoint..."
sleep 5
curl -f http://$DROPLET_IP:8080/health || echo "⚠️  API not yet responding (may need environment setup)"

echo ""
echo "📋 Next steps:"
echo "1. SSH to droplet: ssh root@$DROPLET_IP"
echo "2. Configure environment variables in /opt/ripcity-backend/ripcity-backend/.env"
echo "3. Restart PM2: pm2 restart ripcity-backend"
echo "4. Update DigitalOcean App Platform to remove backend service"
