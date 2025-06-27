#!/bin/bash
# One-liner deployment script for RipCity Backend - FIXED FILE STRUCTURE
pm2 stop ripcity-api 2>/dev/null; pm2 delete ripcity-api 2>/dev/null; cd /opt && sudo rm -rf ripcity-backend && sudo mkdir ripcity-backend && cd ripcity-backend && git clone https://YOUR_GITHUB_TOKEN_HERE@github.com/J-mazz/ripcityticketdispatch.works.git temp && ls -la temp/ && cp -r temp/ripcity-backend/* . && rm -rf temp && ls -la && npm install && npm run build && cat > .env << 'EOF'
NODE_ENV=production
PORT=8080
TICKETMASTER_KEY=KrJ30dNjFgddGx1vUTMB7fa5GDKU0TnT
TICKETMASTER_SECRET=I4dV25eQiAyoBwUh
EVENTBRITE_KEY=EBBNVDS75EGKXDX2KUB3
EVENTBRITE_SECRET=RQS25BXDXPUHQY7CCE
MONGODB_URI=mongodb+srv://j-mazz:3Cu8N6Pp5R2y0q79@private-db-mongo-nyc-888-157f5de1.mongo.ondigitalocean.com/ripcity-tickets?tls=true&authSource=admin&replicaSet=db-mongo-nyc-888
JWT_SECRET=74c5b447e137ff928cfa9072baf3dd60d08d59dced5609d9f59bd255343e361a3be901e7098adc378bb134b364b1b0703962bb355b346779f974d0f1292b0530
OPENAI_API_KEY=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
CORS_ORIGINS=https://ripcityticketdispatch.works,https://api.ripcityticketdispatch.works
EOF
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'ripcity-api',
    script: 'dist/server.js',
    instances: 1,
    env: {
      NODE_ENV: 'production',
      PORT: 8080
    }
  }]
};
EOF
pm2 start ecosystem.config.js && pm2 save && sleep 3 && curl http://localhost:8080/health && pm2 status
