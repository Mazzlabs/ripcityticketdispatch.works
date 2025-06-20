# Rip City Ticket Dispatch - MVP Deployment Analysis Session

## Project Overview
- **Service**: Event ticket aggregation platform for Portland area
- **MVP Goal**: Production-ready deployment WITHOUT Twilio, Stripe, SendGrid
- **Active APIs**: Ticketmaster (certified), Eventbrite (certified) 
- **Hosting**: DigitalOcean + MongoDB + Cloudflare CDN
- **Frontend Issue**: React app not loading - suspected Tailwind/PostCSS issue

## Architecture Analysis

### Backend Structure (Clean - Good)
- Multiple server variants for different deployment scenarios
- Proper separation of concerns
- MVP bypass services for restricted APIs
- Clean environment variable management

### Frontend Issues Identified
1. **Tailwind v4 Configuration Issue**: 
   - Using `@tailwindcss/postcss` but missing `tailwind.config.js`
   - Tailwind v4 requires different setup than v3
   - Package.json shows v4.1.8 but setup is incomplete

2. **Duplicate Server Files**:
   - `server-demo.ts` - Demo with mock data
   - `server-deploy.ts` - Minimal deployment server
   - `server-deployment.ts` - Full deployment server  
   - `server-dynamic-live.ts` - Live API server (RECOMMENDED)
   - `server-production.ts` - Production server
   - `server-live-apis.ts` - Live API focused
   - `server.ts` - Base server

### Recommended Server File: `server-dynamic-live.ts`
- Certified API integration
- MVP bypass for Stripe/Twilio/SendGrid
- Proper error handling
- Cloudflare-ready CORS config

## ⚠️ **IMPORTANT ARCHITECTURE CLARIFICATION**

This is **NOT a monoserver application**! It's a **microservices architecture**:

### 🏗️ **Separate Services:**
1. **API Server** (`ripcity-backend/`): 
   - Express.js API only
   - Port 8080
   - Serves `/api/*` endpoints only

2. **Frontend App** (`rip-city-tickets-react/`):
   - React SPA 
   - Should be served separately (DigitalOcean Apps/CloudFlare Pages)
   - Calls API server via CORS

3. **CloudFlare CDN** (`cloudflare/`):
   - Edge caching
   - Static asset serving

### 🚀 **Correct Deployment Strategy:**
- **Backend**: Deploy to DigitalOcean Droplet (API server only)
- **Frontend**: Deploy to DigitalOcean Apps Platform or CloudFlare Pages
- **Database**: MongoDB (DigitalOcean Managed Database)

### ❌ **Previous Issue:**
Server was incorrectly trying to serve React frontend - now fixed to API-only.

---

## Action Plan

### Phase 1: Fix Frontend Build
1. Fix Tailwind v4 configuration
2. Update PostCSS config
3. Test React build process

### Phase 2: Clean Backend
1. Remove duplicate server files
2. Standardize on `server-dynamic-live.ts`
3. Clean up unused routes/services

### Phase 3: Environment Config
1. Verify all environment variables
2. Test API connections
3. Validate legal document serving

## Files to Remove (Duplicates/Workarounds)
- `server-demo.ts` (replace with dynamic-live)
- `server-deploy.ts` (minimal version not needed)
- `server-deployment.ts` (redundant with dynamic-live)
- `server-production.ts` (too complex for MVP)
- `server-live-apis.ts` (integrated into dynamic-live)
- `server.ts` (base version superseded)

## Environment Variables Required
```
MONGODB_URI=
TICKETMASTER_KEY=
EVENTBRITE_KEY=
NODE_ENV=production
PORT=8080
CORS_ORIGINS=https://ripcityticketdispatch.works,https://mazzlabs.works
```

## Next Steps
1. Fix Tailwind config
2. Clean duplicate files
3. Test complete build pipeline
4. Deploy MVP version

---
*Session Date: June 19, 2025*
*Focus: MVP Deployment Preparation*
