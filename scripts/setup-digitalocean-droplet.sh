#!/bin/bash

# DigitalOcean MERN Droplet Setup for Rip City Ticket Dispatch
# Run this script on your droplet after SSH'ing in

echo "🏀 Setting up Rip City Ticket Dispatch on DigitalOcean MERN Droplet"
echo "=================================================================="

# Get MongoDB password
echo "📋 Your MongoDB password:"
sudo cat /root/.digitalocean_password
echo ""

# Stop existing PM2 processes
echo "🛑 Stopping existing PM2 processes..."
su - mern -c "pm2 stop all"
su - mern -c "pm2 delete all"

# Remove sample app and clone your repo
echo "📁 Setting up application..."
cd /home/mern
rm -rf client
git clone https://github.com/J-mazz/ripcityticketdispatch.works.git app
cd app/ripcity-backend

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create production build
echo "🔨 Building application..."
npx tsc

# Prompt for environment variables
echo "⚙️ Setting up environment variables..."
echo "Please create your .env file with the MongoDB password shown above:"
echo "nano .env"
echo ""
echo "Use this template:"
cat .env.production

echo ""
echo "🚀 Ready to start! After creating your .env file, run:"
echo "su - mern -c \"cd /home/mern/app/ripcity-backend && pm2 start dist/server-dynamic-live.js --name 'ripcity-api'\""
echo ""
echo "📊 To check status: su - mern -c \"pm2 status\""
echo "📝 To view logs: su - mern -c \"pm2 logs ripcity-api\""
