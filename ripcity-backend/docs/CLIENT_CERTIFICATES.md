# Client Certificates for Rip City Ticket Dispatch API

## Current Assessment: **NOT IMMEDIATELY NECESSARY**

Your current security posture is already strong with:
- ✅ CloudFlare Origin SSL (server certificates)
- ✅ HTTPS-only with HSTS
- ✅ JWT authentication for users
- ✅ API key authentication for premium tiers
- ✅ Rate limiting and security headers

## When to Consider Client Certificates

### **Immediate Priority: LOW**
Your current use cases don't require mTLS:
- Individual users (web/mobile apps)
- Standard API integrations
- Subscription-based access

### **Future Priority: MEDIUM-HIGH**
Consider client certificates when you add:

1. **Enterprise B2B Integrations**
   ```typescript
   // Example: Large venue wanting direct integration
   app.use('/api/enterprise', requireClientCert, async (req, res) => {
     const clientCert = req.socket.getPeerCertificate();
     const orgId = clientCert.subject.organizationName;
     // Handle enterprise-specific logic
   });
   ```

2. **Mobile App Security**
   ```typescript
   // Instead of API keys in app bundles
   app.use('/api/mobile', requireClientCert, (req, res, next) => {
     const cert = req.socket.getPeerCertificate();
     if (cert.subject.commonName.startsWith('ripcity-mobile-')) {
       next();
     } else {
       res.status(403).json({ error: 'Invalid client certificate' });
     }
   });
   ```

3. **High-Security Webhooks**
   ```typescript
   // For payment processors, venue APIs
   app.post('/webhooks/secure', requireClientCert, (req, res) => {
     const cert = req.socket.getPeerCertificate();
     // Verify certificate against whitelist
     verifyWebhookSender(cert);
   });
   ```

## Implementation Strategy (Future)

### **Phase 1: Certificate Authority Setup**
```bash
# Create CA for issuing client certificates
openssl genrsa -out ca-key.pem 4096
openssl req -new -x509 -days 365 -key ca-key.pem -out ca-cert.pem
```

### **Phase 2: Client Certificate Generation**
```bash
# For each client/organization
openssl genrsa -out client-key.pem 2048
openssl req -new -key client-key.pem -out client.csr
openssl x509 -req -in client.csr -CA ca-cert.pem -CAkey ca-key.pem -out client-cert.pem
```

### **Phase 3: Express.js mTLS Middleware**
```typescript
import https from 'https';
import fs from 'fs';

const httpsOptions = {
  key: fs.readFileSync('ripcityticketdispatch.works.key'),
  cert: fs.readFileSync('ripcityticketdispatch.works.pem'),
  ca: fs.readFileSync('ca-cert.pem'), // Your CA certificate
  requestCert: true,
  rejectUnauthorized: false // Handle verification manually
};

// Middleware to require client certificates
const requireClientCert = (req: Request, res: Response, next: NextFunction) => {
  const cert = req.socket.getPeerCertificate();
  
  if (!cert || !cert.subject) {
    return res.status(403).json({ error: 'Client certificate required' });
  }
  
  // Verify certificate against your CA
  if (!verifyCertificate(cert)) {
    return res.status(403).json({ error: 'Invalid client certificate' });
  }
  
  // Add certificate info to request
  req.clientCert = cert;
  next();
};
```

## Current Recommendation: **Focus on Other Priorities**

Instead of client certificates, prioritize:

1. **✅ Current Status: HTTPS-only with origin SSL** (Already done!)
2. **🔄 Database Security**: Fix MongoDB authentication issues
3. **🔄 API Rate Limiting**: Implement per-tier limits
4. **🔄 API Key Management**: Secure key rotation
5. **🔄 Monitoring**: Add security event logging

## External API Security

For your **outbound** API calls, consider:

### **IP Whitelisting** (Using your DigitalOcean egress IPs)
```typescript
// Add to external API provider configurations:
// Ticketmaster Developer Console → Security → IP Whitelist
// Stripe Dashboard → Developers → Webhooks → Endpoint Settings
// Twilio Console → IP Access Control Lists
```

### **Webhook Signature Verification** (Already implemented)
```typescript
// Your Stripe webhook verification (already in place)
verifyWebhookSignature(payload: string, signature: string): Stripe.Event {
  return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
```

## Summary

**Skip client certificates for now** - your security is already excellent with:
- CloudFlare Origin SSL
- HTTPS-only enforcement
- JWT + API key authentication
- Rate limiting and security headers

Revisit client certificates when you have enterprise customers requiring mTLS compliance or high-security integrations.
