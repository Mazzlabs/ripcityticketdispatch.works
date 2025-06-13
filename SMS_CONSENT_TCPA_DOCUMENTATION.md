# 📱 SMS Consent & TCPA Compliance Documentation
**Rip City Events Hub - SMS Alert System**

---

## **📋 OVERVIEW**

This document outlines our TCPA (Telephone Consumer Protection Act) compliant SMS consent system for price alert notifications. Our system ensures full compliance with FCC regulations and Twilio messaging policies.

---

## **🔒 TCPA COMPLIANCE REQUIREMENTS**

### **Express Written Consent Elements**
Our SMS opt-in process includes all required TCPA elements:

1. ✅ **Clear and Conspicuous Disclosure**: Purpose and frequency of messages
2. ✅ **Material Terms**: Message/data rates may apply
3. ✅ **Opt-out Instructions**: Reply STOP to cancel
4. ✅ **Company Information**: Rip City Events Hub identity  
5. ✅ **Consent Record Keeping**: Timestamped consent logs with IP/device info

### **Required Disclosures**
```
By providing your mobile number and checking this box, you consent to receive 
SMS text message alerts from Rip City Events Hub about ticket deals and price 
drops. Message frequency varies. Message and data rates may apply. 

You can opt-out at any time by replying STOP to any message. Reply HELP for 
customer support. For Terms of Service, visit ripcityticketdispatch.works/terms
```

---

## **📊 SUBSCRIPTION TIER SMS FEATURES**

### **Free Tier ($0/month)**
- ❌ **SMS Alerts**: Not available (email only)

### **Pro Tier ($9.99/month)**
- ✅ **SMS Alerts**: Up to 5 messages per day
- ✅ **Categories**: Sports, music, entertainment filtering
- ✅ **Price Thresholds**: Custom savings alerts

### **Premium Tier ($19.99/month)**
- ✅ **SMS Alerts**: Up to 15 messages per day  
- ✅ **Advanced Filtering**: Venue-specific alerts
- ✅ **Flash Deals**: Time-sensitive notifications

### **Enterprise Tier ($99.99/month)**
- ✅ **SMS Alerts**: Up to 50 messages per day
- ✅ **Custom Webhooks**: Alternative to SMS for high volume
- ✅ **Priority Delivery**: Guaranteed message delivery

---

## **🛡️ PRIVACY & DATA PROTECTION**

### **Phone Number Collection**
- **Purpose**: SMS price alert delivery only
- **Storage**: Encrypted in PostgreSQL database
- **Sharing**: Never shared with third parties
- **Retention**: Deleted immediately upon opt-out or account deletion

### **Consent Records**
Each SMS consent includes:
```json
{
  "userId": "uuid",
  "phoneNumber": "+1234567890",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "consentTimestamp": "2024-01-15T10:30:00Z",
  "subscriptionTier": "pro",
  "doubleOptIn": true,
  "source": "web_app"
}
```

### **Audit Trail**
- All SMS consent events logged with immutable timestamps
- IP address and device fingerprinting for verification
- Double opt-in verification via SMS confirmation
- Compliance reports available for legal review

---

## **📱 MESSAGE TYPES & FREQUENCY**

### **Alert Categories**
1. **🔥 Flash Deals**: High-value, time-sensitive (max 2/day)
2. **💰 Price Drops**: Savings above user threshold (max 3/day)  
3. **🎵 New Events**: Newly available tickets (max 2/day)
4. **⚠️ Last Chance**: Final availability warnings (max 1/day)

### **Frequency Caps**
- **Daily Limits**: Enforced per subscription tier
- **Time Windows**: No messages between 9 PM - 8 AM local time
- **User Control**: Custom frequency settings available

### **Message Format**
```
🎟️ RIP CITY ALERT: [Event Name] at [Venue]
Was $[OriginalPrice], now $[CurrentPrice]
Save $[Amount] ([Percentage]%)!
[Purchase Link]

Reply STOP to opt-out
```

---

## **🔧 TECHNICAL IMPLEMENTATION**

### **Opt-In Flow**
1. User selects SMS alerts in subscription upgrade
2. Phone number validation and formatting
3. Express consent checkbox with full disclosure
4. Double opt-in SMS confirmation sent
5. User confirms via reply to activate
6. Consent record created in database

### **Opt-Out Processing**
- **STOP Keywords**: STOP, QUIT, CANCEL, UNSUBSCRIBE, END
- **Response Time**: Immediate processing (< 5 seconds)
- **Confirmation**: "You've been unsubscribed from Rip City Events Hub SMS alerts"
- **Database Update**: Phone number immediately marked as opted-out

### **Database Schema**
```sql
CREATE TABLE sms_consent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  consent_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  opt_out_timestamp TIMESTAMP NULL,
  ip_address INET,
  user_agent TEXT,
  subscription_tier VARCHAR(20),
  double_opt_in_confirmed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## **⚖️ LEGAL COMPLIANCE**

### **TCPA Safe Harbor**
- ✅ Express written consent obtained
- ✅ Material terms clearly disclosed  
- ✅ Opt-out mechanism provided
- ✅ Consent records maintained
- ✅ Frequency limits enforced

### **CTIA Guidelines**
- ✅ Clear sender identification
- ✅ Customer care contact provided
- ✅ Message content appropriate
- ✅ Double opt-in verification
- ✅ Opt-out processed within 5 minutes

### **Twilio Compliance**
- ✅ A2P 10DLC registration required
- ✅ Message content pre-approved
- ✅ Carrier filtering compliance
- ✅ Throughput limits respected

---

## **📞 CUSTOMER SUPPORT**

### **SMS Support Keywords**
- **HELP**: "Rip City Events Hub - Ticket price alerts. Msg&data rates may apply. Text STOP to opt-out. Support: support@ripcityticketdispatch.works"
- **INFO**: Same as HELP response
- **STOP**: Immediate opt-out processing

### **Support Channels**
- **Email**: support@ripcityticketdispatch.works
- **Response Time**: Within 24 hours
- **Phone**: Available for Enterprise tier customers
- **Live Chat**: Business hours support

---

## **🔍 COMPLIANCE MONITORING**

### **Monthly Audits**
- Consent record validation
- Opt-out processing verification  
- Message frequency compliance
- Carrier delivery rate monitoring

### **Reporting**
- TCPA compliance dashboard
- Opt-in/opt-out metrics
- Message delivery statistics
- Customer complaint tracking

---

## **⚠️ RISK MITIGATION**

### **Class Action Prevention**
- Strict consent verification
- Immediate opt-out processing
- Frequency limit enforcement
- Regular compliance training

### **Carrier Relationship**
- Pre-approved message templates
- Volume monitoring and throttling
- Spam complaint rate < 0.1%
- A2P 10DLC brand registration

---

**🔒 PROPRIETARY & CONFIDENTIAL**  
**Copyright (c) 2024 Joseph Mazzini <joseph@mazzlabs.works>**  
**All Rights Reserved - For Internal Legal Review Only**
