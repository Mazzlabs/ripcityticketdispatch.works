# 🏀 Rip City Ticket Dispatch

**The Ultimate Portland Trail Blazers Ticket Deal Monitoring System**

[![Deploy API Documentation](https://github.com/J-mazz/Mazzlabs.work/workflows/Check%20&%20deploy%20API%20documentation/badge.svg)](https://github.com/J-mazz/Mazzlabs.work/actions)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-ripcityticketdispatch.works-red)](https://ripcityticketdispatch.works)
[![API Docs](https://img.shields.io/badge/API%20Docs-Bump.sh-blue)](https://bump.sh/ripcitybitch)

## 🚀 **Live Deployment**

- **Frontend**: [ripcityticketdispatch.works](https://ripcityticketdispatch.works)
- **API**: [api.ripcityticketdispatch.works](https://api.ripcityticketdispatch.works)
- **Documentation**: [bump.sh/ripcitybitch](https://bump.sh/ripcitybitch)

## 📁 **Repository Structure**

```
Mazzlabs.work/
├── rip-city-backend/          # Express.js API Server
│   ├── src/                   # TypeScript source code
│   ├── docs/                  # API documentation
│   ├── .do/                   # DigitalOcean deployment config
│   └── package.json
├── rip-city-tickets-react/    # React Frontend Source
│   ├── src/                   # React components
│   ├── public/                # Static assets
│   └── build/                 # Production build
├── ripcityticketdispatch.works/ # Deployed Frontend
│   ├── static/                # Optimized assets
│   └── index.html             # Entry point
├── .github/workflows/         # CI/CD automation
│   └── bump.yml              # API docs deployment
└── .do/app.yaml              # DigitalOcean App Platform config
```

## 🛠 **Technology Stack**

### **Frontend**
- **React 18** with TypeScript
- **Progressive Web App** (PWA) capabilities
- **Optimized Performance** with React.memo, useMemo, useCallback
- **Material Design** inspired UI

### **Backend**
- **Express.js** with TypeScript
- **Ticketmaster API** integration
- **Real-time deal scoring** algorithms
- **Comprehensive error handling**
- **Security** with Helmet, CORS, rate limiting

### **Infrastructure**
- **DigitalOcean App Platform** for backend hosting
- **GitHub Pages** for frontend deployment
- **GitHub Actions** for automated API documentation
- **Bump.sh** for API documentation hub

## 🚀 **Quick Deployment**

### **1. Backend (DigitalOcean)**
```bash
# Deploy using App Platform
# Import app spec: .do/app.yaml
# Set environment variables:
# - TICKETMASTER_API_KEY: your-real-api-key
# - NODE_ENV: production
```

### **2. Frontend (Already Deployed)**
- ✅ Live at `ripcityticketdispatch.works`
- ✅ PWA enabled with offline capabilities
- ✅ Optimized React build

### **3. API Documentation**
- ✅ Auto-deploys via GitHub Actions
- ✅ Available at `bump.sh/ripcitybitch`

## 🏀 **Portland Trail Blazers Features**

- **Real-time ticket deal monitoring**
- **Moda Center event tracking**
- **Deal scoring algorithms** (0-100 scale)
- **Price drop alerts** (Hot, Warm, Good, Normal)
- **Portland venue integration**
- **Historical pricing analysis**

## 🔧 **Development Setup**

### **Backend Development**
```bash
cd rip-city-backend
npm install
npm run dev    # Development server with hot reload
npm run build  # Production build
npm start      # Production server
```

### **Frontend Development**
```bash
cd rip-city-tickets-react
npm install
npm start      # Development server
npm run build  # Production build
```

## 🔐 **Environment Variables**

### **Backend (.env)**
```bash
TICKETMASTER_API_KEY=your-ticketmaster-api-key
NODE_ENV=production
PORT=8080
CORS_ORIGINS=https://ripcityticketdispatch.works
```

### **DigitalOcean Secrets**
- `TICKETMASTER_API_KEY`: Your Ticketmaster API key
- `BUMP_TOKEN`: Bump.sh API token for documentation

## 📊 **API Endpoints**

- `GET /health` - Health check
- `GET /api/deals` - All Portland ticket deals
- `GET /api/blazers` - Trail Blazers specific deals
- `GET /api/venues` - Portland venue information

## 🎯 **Business Value**

1. **Real API Integration** - Uses actual Ticketmaster data
2. **Production Infrastructure** - Scalable DigitalOcean deployment
3. **Professional Documentation** - Automated API docs with Bump.sh
4. **PWA Capabilities** - Native app-like experience
5. **Portland Focus** - Specifically targets local market

## 🏆 **Student Benefits Used**

- **GitHub Student Pack** - Free DigitalOcean credits
- **DigitalOcean App Platform** - Automatic scaling and SSL
- **Bump.sh** - Professional API documentation
- **GitHub Actions** - Free CI/CD automation

---

**Built for Portland Trail Blazers fans by Joseph Mazzini**  
*Leveraging student benefits to create professional-grade applications* 🎓
