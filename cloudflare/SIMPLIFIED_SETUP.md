# CloudFlare Configuration for Rip City Ticket Dispatch
# DNS + Security + CDN Setup (Not Workers)

## Current Setup
- **DNS**: CloudFlare manages ripcityticketdispatch.works domain
- **Security**: DDoS protection, WAF, SSL certificates
- **CDN**: Static asset caching (CSS, JS, images)
- **Origin**: DigitalOcean App Platform (frontend + backend)

## R2 Storage Usage

### 1. **Static Asset CDN** (ripcity-static-assets)
Store static files in R2 and serve via CloudFlare CDN:
```
/assets/venue-images/moda-center.jpg
/assets/team-logos/trail-blazers.png
/assets/css/main.css
/assets/js/bundle.js
```

### 2. **Backup Storage** (ripcity-ticket-cache)
Use R2 for backup copies of:
- Database backups
- Historical pricing data
- User data exports
- Analytics exports

### 3. **User Uploads** (ripcity-user-uploads)
Store user-generated content:
- Profile pictures
- Uploaded documents
- Custom watchlists exports

## CloudFlare Dashboard Configuration

### DNS Settings
```
A     ripcityticketdispatch.works     → Your-DigitalOcean-App-IP
CNAME www.ripcityticketdispatch.works → ripcityticketdispatch.works
CNAME api.ripcityticketdispatch.works → ripcityticketdispatch.works
```

### Security Settings
- **SSL/TLS**: Full (strict) - encrypt between CF and DigitalOcean
- **Always Use HTTPS**: On
- **HSTS**: Enable with 6-month max-age
- **DDoS Protection**: Enabled (automatic)
- **WAF**: Block common attacks
- **Rate Limiting**: 1000 requests/minute per IP

### Speed Settings
- **Caching Level**: Standard
- **Browser Cache TTL**: 8 hours
- **Auto Minify**: HTML, CSS, JS
- **Brotli Compression**: Enabled

### Page Rules
```
1. ripcityticketdispatch.works/assets/*
   - Cache Level: Cache Everything
   - Edge Cache TTL: 1 month
   - Browser Cache TTL: 1 week

2. ripcityticketdispatch.works/api/*
   - Cache Level: Bypass
   - Always Use HTTPS: On

3. ripcityticketdispatch.works/*
   - Always Use HTTPS: On
   - Auto Minify: HTML, CSS, JS
```

## Implementation Steps

### 1. Upload Static Assets to R2
```bash
# Upload your React build assets
wrangler r2 object put ripcity-static-assets/css/main.css --file ./build/static/css/main.css
wrangler r2 object put ripcity-static-assets/js/bundle.js --file ./build/static/js/bundle.js
```

### 2. Update Your DigitalOcean App
Modify your React app to use CloudFlare R2 URLs for static assets:
```javascript
// In your React app
const ASSET_BASE_URL = 'https://ripcityticketdispatch.works/assets';
// This will be served from R2 via CloudFlare CDN
```

### 3. Configure CloudFlare Page Rules
Set up caching rules in CloudFlare dashboard to:
- Cache static assets for 1 month
- Bypass cache for API endpoints
- Enable security features

## Benefits of This Setup
- **Simple**: No complex worker code to maintain
- **Fast**: Static assets served from 200+ edge locations
- **Secure**: DDoS protection and WAF
- **Reliable**: DigitalOcean handles app logic, CloudFlare handles delivery
- **Cost-effective**: Uses CloudFlare's free tier features

## Cost Breakdown
- **CloudFlare**: Free tier (DNS, security, basic CDN)
- **R2 Storage**: ~$0.15/month for 10GB
- **DigitalOcean**: Your existing app platform costs

Total additional cost: **~$0.15/month**
