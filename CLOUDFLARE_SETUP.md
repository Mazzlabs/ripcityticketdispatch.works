# Cloudflare API Schema Validation Setup

## 🛡️ API Security & Validation Configuration

This guide helps you set up Cloudflare API Gateway validation for your Rip City Ticket Dispatch API.

## 📋 Prerequisites

1. **Cloudflare Account** with your domain `ripcityticketdispatch.works`
2. **API Gateway Access** (requires Cloudflare Pro plan or higher)
3. **API Schema Files** (provided in this repo)

## 🔧 Setup Steps

### 1. Upload API Schema to Cloudflare

1. **Login to Cloudflare Dashboard**
   - Go to https://dash.cloudflare.com
   - Select your domain: `ripcityticketdispatch.works`

2. **Navigate to API Gateway**
   - Go to **Security** → **API Gateway**
   - Click **"Create Schema"**

3. **Upload Schema**
   - **Name**: `rip-city-api-v1`
   - **Format**: Upload `cloudflare-schema.json`
   - **Base Path**: `/api`

### 2. Configure API Protection Rules

#### A. Rate Limiting Rules
```yaml
# Add these rules in Security → Rate Limiting
- Path: /api/sms-consent
  Method: POST
  Rate: 10 requests per hour per IP
  
- Path: /api/users/register  
  Method: POST
  Rate: 5 requests per hour per IP
  
- Path: /api/subscriptions
  Method: POST
  Rate: 3 requests per hour per user
  
- Path: /api/*
  Method: GET
  Rate: 1000 requests per hour per IP
```

#### B. Firewall Rules
```javascript
// Block malformed JSON requests
(http.request.uri.path matches "/api/*" and http.request.method eq "POST" and not http.request.body.form.parsed)

// Block requests without proper content-type for API endpoints
(http.request.uri.path matches "/api/*" and http.request.method in {"POST" "PUT" "PATCH"} and http.request.headers["content-type"][0] != "application/json")

// Block requests with invalid phone numbers to SMS consent
(http.request.uri.path eq "/api/sms-consent" and http.request.method eq "POST" and not http.request.body.form["phone"][0] matches "^(\\+1)?[2-9]\\d{2}[2-9]\\d{2}\\d{4}$")
```

### 3. Enable API Validation

1. **Go to API Gateway → Schemas**
2. **Select your schema** (`rip-city-api-v1`)
3. **Click "Enable Validation"**
4. **Configure Settings**:
   - ✅ **Block malformed requests**
   - ✅ **Log validation errors**
   - ✅ **Validate request bodies**
   - ✅ **Validate query parameters**

### 4. Configure Cache Rules

```yaml
# Cache API responses for performance
- Path: /api/deals
  TTL: 300 seconds (5 minutes)
  
- Path: /health
  TTL: 60 seconds (1 minute)
  
- Path: /api/deals/*
  TTL: 180 seconds (3 minutes)
```

### 5. Set Up Origin Rules

```yaml
# Route API traffic to your backend
- Matching: hostname eq "api.ripcityticketdispatch.works"
  Origin: ripcityticketdispatch-works.ondigitalocean.app
  
- Matching: hostname eq "ripcityticketdispatch.works" and starts_with(http.request.uri.path, "/api/")
  Origin: ripcityticketdispatch-works.ondigitalocean.app
```

## 🔍 Monitoring & Alerting

### 1. Set Up Analytics
- **Go to Analytics → Security**
- Monitor blocked requests
- Track validation errors
- Review rate limit hits

### 2. Configure Alerts
```yaml
# Email alerts for security events
- Trigger: API validation failures > 100/hour
- Trigger: Rate limit exceeded > 50/hour
- Trigger: Malformed JSON requests > 25/hour
```

## 🚀 Testing Your Setup

### 1. Valid Request Test
```bash
curl -X POST https://api.ripcityticketdispatch.works/api/sms-consent \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+15031234567",
    "consent": true,
    "source": "website"
  }'
```

### 2. Invalid Request Test (Should be blocked)
```bash
# Invalid phone format
curl -X POST https://api.ripcityticketdispatch.works/api/sms-consent \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "invalid-phone",
    "consent": true
  }'
```

### 3. Rate Limit Test
```bash
# Send 15 requests quickly to test rate limiting
for i in {1..15}; do
  curl -X POST https://api.ripcityticketdispatch.works/api/sms-consent \
    -H "Content-Type: application/json" \
    -d '{"phone": "+15031234567", "consent": true}'
done
```

## 🛠️ Advanced Configuration

### 1. Custom Error Responses
```json
{
  "validation_error": {
    "status": 400,
    "body": {
      "error": "Invalid request format",
      "message": "Request does not match API schema",
      "support": "https://ripcityticketdispatch.works/legal/api-docs"
    }
  }
}
```

### 2. Geographic Restrictions
```javascript
// Block traffic from high-risk countries for SMS endpoints
(http.request.uri.path matches "/api/sms-*" and ip.geoip.country in {"CN" "RU" "IR" "KP"})
```

### 3. Bot Detection
```javascript
// Block obvious bot traffic
(cf.bot_management.score < 30 and http.request.uri.path matches "/api/*")
```

## 📊 Expected Benefits

1. **Security**: Block 90%+ of malicious API requests
2. **Performance**: Cache reduces backend load by 60%
3. **Compliance**: TCPA-compliant SMS validation
4. **Monitoring**: Real-time attack visibility
5. **Cost Savings**: Reduced backend processing

## 🔧 Troubleshooting

### Common Issues:

1. **Schema Upload Fails**
   - Ensure JSON is valid
   - Check file size < 1MB
   - Verify OpenAPI 3.0 format

2. **Validation Too Strict**
   - Review blocked requests in Analytics
   - Adjust schema patterns
   - Whitelist legitimate traffic

3. **Rate Limiting Issues**
   - Monitor false positives
   - Adjust thresholds
   - Use different rate limiting keys

## 📞 Support

For issues with this setup:
- **Technical**: joseph@mazzlabs.works
- **API Docs**: https://ripcityticketdispatch.works/legal/api-docs
- **Status**: https://status.ripcityticketdispatch.works
