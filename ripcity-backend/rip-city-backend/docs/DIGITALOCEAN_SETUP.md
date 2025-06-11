# 🌊 DigitalOcean App Platform Deployment

## 🚀 **Quick Setup Guide**

### **Step 1: Sign Up & Credits**
1. Go to [digitalocean.com](https://digitalocean.com)
2. Sign up with your **student email** 
3. Apply **GitHub Student Pack** credits ($200)
4. Verify student status

### **Step 2: Create App**
1. **Dashboard** → **Apps** → **Create App**
2. **Connect GitHub** → Select `J-mazz/rip-city-ticket-dispatch`
3. **Import app spec**: Upload `.do/app.yaml` 
4. **Configure domain**: `api.ripcityticketdispatch.works`

### **Step 3: Environment Variables**
Add these in the DigitalOcean dashboard:
- `TICKETMASTER_API_KEY`: Your real API key
- `NODE_ENV`: `production`
- `CORS_ORIGINS`: `https://ripcityticketdispatch.works`

### **Step 4: Deploy**
- **Auto-deploy** on git push to main
- **Build time**: ~2-3 minutes
- **Cost**: ~$5/month (covered by your $200 credit!)

## 📍 **Deployment URLs**

Once deployed:
- **API Base**: `https://api.ripcityticketdispatch.works`
- **Health Check**: `https://api.ripcityticketdispatch.works/health`
- **Deals Endpoint**: `https://api.ripcityticketdispatch.works/api/deals`
- **Blazers Endpoint**: `https://api.ripcityticketdispatch.works/api/blazers`

## 🔗 **Connect Frontend**

Update your React app to use the new API:
```javascript
// In your React app
const API_BASE = 'https://api.ripcityticketdispatch.works/api';

// Replace mock data calls with:
const deals = await fetch(`${API_BASE}/deals?category=sports`);
const blazers = await fetch(`${API_BASE}/blazers`);
```

## 📊 **Monitoring & Scaling**

DigitalOcean App Platform includes:
- ✅ **Auto-scaling** based on traffic
- ✅ **Health monitoring** 
- ✅ **Build/deploy logs**
- ✅ **Custom domains**
- ✅ **SSL certificates** (automatic)

## 💰 **Cost Breakdown**

With your $200 student credit:
- **Basic App**: $5/month = 40 months of hosting
- **Database addon**: $15/month (if needed later)
- **Domain**: Free (you already own it)

---

This setup gives you a **production-ready API** that can handle real traffic and scale as your business grows! 🚀
