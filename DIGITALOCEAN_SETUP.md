# DigitalOcean MERN Droplet Setup for Rip City Ticket Dispatch

## MongoDB Connection Setup

### 1. Get MongoDB Password
```bash
# SSH into your droplet first, then:
sudo cat /root/.digitalocean_password
```

### 2. Test MongoDB Connection
```bash
mongosh 127.0.0.1:27017 -u "admin" -p "<Your MongoDB password>" --authenticationDatabase "admin"
```

### 3. Environment Variables for Backend
Your backend `.env` file should have:
```
MONGODB_URI=mongodb://admin:<Your MongoDB password>@127.0.0.1:27017/ripcity_tickets
NODE_ENV=production
PORT=8080
TICKETMASTER_KEY=<your_key>
EVENTBRITE_KEY=<your_key>
CORS_ORIGINS=https://ripcityticketdispatch.works,https://mazzlabs.works
```

## Deployment Steps

### 1. Replace Sample App with Your App
```bash
# SSH into droplet
ssh root@<your_droplet_ip>

# Stop current PM2 processes
su - mern -c "pm2 stop all"
su - mern -c "pm2 delete all"

# Clone your repo
cd /home/mern
rm -rf client  # Remove sample app
git clone https://github.com/J-mazz/ripcityticketdispatch.works.git app
cd app/ripcity-backend

# Install dependencies
npm install

# Create production .env file
nano .env
```

### 2. Start Your API Server
```bash
# Start with PM2
su - mern -c "cd /home/mern/app/ripcity-backend && pm2 start src/server-dynamic-live.ts --name 'ripcity-api' --interpreter='npx' --interpreter-args='ts-node'"

# Or compile and run
npm run build
su - mern -c "cd /home/mern/app/ripcity-backend && pm2 start dist/server-dynamic-live.js --name 'ripcity-api'"
```

### 3. Configure Nginx for API
```bash
# Create nginx config for your domain
sudo nano /etc/nginx/sites-available/ripcityticketdispatch.works
```

### 4. Frontend Deployment
Since you have a microservices architecture, deploy your React frontend to:
- **CloudFlare Pages** (recommended for your CloudFlare setup)
- **DigitalOcean Apps Platform** 
- **Or serve via nginx** on the same droplet

## Next Steps
1. Get your MongoDB password from the droplet
2. Update your backend .env file
3. Deploy your code to the droplet
4. Configure nginx for your domain
5. Set up SSL with certbot

Would you like me to help with any specific step?
