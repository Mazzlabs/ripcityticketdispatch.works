#!/bin/bash

# Frontend Deployment Script for DigitalOcean
# Deploys the React static build to the same droplet as the backend

set -e

echo "🎯 Starting Frontend Deployment..."

# Configuration
DROPLET_IP="your-droplet-ip"
FRONTEND_DIR="/opt/ripcity-frontend"
REPO_URL="https://github.com/josephmazzini/ripcityticketdispatch.works.git"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Install Nginx if not present
install_nginx() {
    print_status "Installing Nginx..."
    sudo apt update
    sudo apt install -y nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx
}

# Setup frontend directory
setup_frontend() {
    print_status "Setting up frontend directory..."
    
    if [ -d "$FRONTEND_DIR" ]; then
        print_warning "Frontend directory exists, cleaning up..."
        sudo rm -rf "$FRONTEND_DIR"
    fi
    
    sudo mkdir -p "$FRONTEND_DIR"
    cd /tmp
    
    # Clone repo and build frontend
    if [ -d "ripcityticketdispatch.works" ]; then
        rm -rf ripcityticketdispatch.works
    fi
    
    git clone "$REPO_URL"
    cd ripcityticketdispatch.works/rip-city-tickets-react
    
    # Install dependencies and build
    npm install
    npm run build
    
    # Copy build to frontend directory
    sudo cp -r build/* "$FRONTEND_DIR/"
    sudo chown -R www-data:www-data "$FRONTEND_DIR"
    
    print_status "Frontend files deployed to $FRONTEND_DIR"
}

# Configure Nginx for frontend
configure_nginx() {
    print_status "Configuring Nginx for frontend..."
    
    # Create Nginx configuration for frontend
    sudo tee /etc/nginx/sites-available/ripcity-frontend > /dev/null << 'EOF'
server {
    listen 80;
    server_name ripcityticketdispatch.works www.ripcityticketdispatch.works;
    
    root /opt/ripcity-frontend;
    index index.html;
    
    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    
    # Static file caching
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # HTML files - no cache
    location ~* \.html$ {
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
    }
    
    # React Router - catch all
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy to backend
    location /api/ {
        proxy_pass https://api.ripcityticketdispatch.works;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
    
    # Enable the site
    sudo ln -sf /etc/nginx/sites-available/ripcity-frontend /etc/nginx/sites-enabled/
    
    # Remove default site
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test and reload Nginx
    sudo nginx -t
    sudo systemctl reload nginx
    
    print_status "Nginx configured for frontend"
}

# Setup SSL with Certbot
setup_ssl() {
    print_status "Setting up SSL certificate..."
    
    # Install Certbot
    sudo apt install -y certbot python3-certbot-nginx
    
    # Get SSL certificate
    sudo certbot --nginx -d ripcityticketdispatch.works -d www.ripcityticketdispatch.works --non-interactive --agree-tos --email you@example.com
    
    print_status "SSL certificate configured"
}

# Main deployment flow
main() {
    print_status "Starting frontend deployment to DigitalOcean..."
    
    # Check if we're on the droplet or local machine
    if [ "$1" = "local" ]; then
        print_error "This script should be run on the DigitalOcean droplet"
        print_status "To deploy from local machine, use: scp this-script.sh root@$DROPLET_IP:~/ && ssh root@$DROPLET_IP 'chmod +x deploy-frontend.sh && ./deploy-frontend.sh'"
        exit 1
    fi
    
    install_nginx
    setup_frontend
    configure_nginx
    
    if [ "$1" = "ssl" ]; then
        setup_ssl
    else
        print_warning "Skipping SSL setup. Run with 'ssl' argument to configure SSL"
    fi
    
    print_status "✅ Frontend deployment complete!"
    print_status "Frontend should be accessible at: http://ripcityticketdispatch.works"
    
    if [ "$1" = "ssl" ]; then
        print_status "With SSL: https://ripcityticketdispatch.works"
    fi
}

# Run main function
main "$@"
