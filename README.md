# 🌹 Rip City Events Hub

**Your comprehensive source for Portland sports, music & entertainment deals year-round**

[![Deploy API Documentation](https://github.com/Mazzlabs/Mazzlabs.github.io/workflows/Check%20&%20deploy%20API%20documentation/badge.svg)](https://github.com/Mazzlabs/Mazzlabs.github.io/actions)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-ripcityticketdispatch.works-red)](https://ripcityticketdispatch.works)
[![API Docs](https://img.shields.io/badge/API%20Docs-Bump.sh-blue)](https://bump.sh/ripcitybitch)
[![TCPA Compliant](https://img.shields.io/badge/SMS-TCPA%20Compliant-green)](./SMS_CONSENT_TCPA_DOCUMENTATION.md)

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

## 🎯 **Key Features**

### **📱 TCPA-Compliant SMS Alerts** ✅ COMPLETE
- **Double Opt-in Verification**: Secure SMS consent with confirmation codes
- **Tier-based Frequency Limits**: Pro (5/day), Premium (15/day), Enterprise (50/day)
- **Instant Opt-out Processing**: STOP keyword handling in <5 seconds
- **Legal Compliance**: Full TCPA documentation and audit trails
- **Twilio Integration**: Carrier-compliant message delivery

### **💰 Subscription Management**
- **Four Tiers**: Free, Pro ($9.99), Premium ($19.99), Enterprise ($99.99)
- **Stripe Integration**: Secure payment processing and billing
- **Feature Gates**: API access, alert limits, and SMS based on tier
- **Billing Portal**: Self-service subscription management

### **🎟️ Deal Discovery & Scoring**
- **Multi-source Aggregation**: Ticketmaster + Eventbrite integration
- **AI Deal Scoring**: 0-100 scale based on savings and demand
- **Real-time Alerts**: Email and SMS notifications for hot deals
- **Advanced Filtering**: By category, venue, price range, and savings threshold

### **🌹 Portland-First Design**
- **Trail Blazers Integration**: Moda Center event tracking and team colors
- **Rose Design Elements**: Subtle Portland-themed branding throughout
- **Year-round Coverage**: Sports, music, entertainment, and trending events
- **Mobile-Optimized**: Responsive PWA with offline capabilities

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
