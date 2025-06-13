# Rip City Events Hub - SMS Alert Feature: Proof of Consent Documentation

**Document Version**: 1.1  
**Date**: 2025-06-13  
**Service**: Rip City Events Hub  
**Company**: Rip City Ticket Dispatch LLC

## 1. Introduction

This document outlines the procedures and mechanisms Rip City Events Hub employs to obtain and manage user consent for its SMS (Short Message Service) alert feature. This documentation serves as a reference for compliance with applicable regulations and best practices regarding text message communications, reflecting the implementation within the `J-mazz/ripcityticketdispatch.works` repository.

## 2. SMS Program Description

*   **Program Name**: Rip City Events Hub SMS Alerts
*   **Purpose**: To provide users with real-time event deal alerts, information on ticket value propositions, and critical service notifications related to their Rip City Events Hub account and preferences.
*   **Message Types**:
    *   Event Deal Alerts: Notifications about sports events, music events, and entertainment based on user-configured preferences. Examples include Flash Deals, Price Drops, New Events, and Last Chance warnings.
    *   Service Notifications: Important updates regarding the user's account, subscription, or significant changes to the Service.
*   **Target Audience**: Registered users of Rip City Events Hub on eligible subscription tiers (Pro, Premium, Enterprise) who explicitly opt-in to receive SMS alerts.

## 3. User Opt-In Process

Users must provide explicit, affirmative consent (opt-in), including a double opt-in confirmation, before any SMS messages are sent.

### 3.1. Methods of Opt-In:

1.  **During Subscription Upgrade/Account Settings**:
    *   When a user upgrades to an eligible subscription tier (Pro, Premium, or Enterprise) or modifies their notification preferences, the SMS consent process is initiated.
    *   This is handled by frontend components such as `SMSConsent.tsx` and integrated within `SubscriptionSettings.tsx`.

### 3.2. User Action for Consent (Multi-Step Process):

1.  **Initial Consent & Phone Number Submission**:
    *   The user manually enters their mobile phone number in the designated field within the `SMSConsent.tsx` component.
    *   The user must actively select checkboxes indicating their agreement to receive SMS alerts and their acceptance of the Rip City Events Hub Terms of Service and Privacy Policy.
2.  **Double Opt-In SMS Verification**:
    *   Upon submission, the backend (`smsConsentService.ts` via `POST /api/sms-consent/opt-in`) validates the phone number (including checking if it's a mobile number via Twilio Lookup) and sends an SMS containing a 6-digit verification code to the provided number.
    *   The SMS message template used is: `🌹 Rip City Events Hub: Confirm SMS alerts by replying with code: {CODE}\n\nMsg&data rates may apply. Reply STOP to opt-out.\nTerms: ripcityticketdispatch.works/terms` (or similar, as defined in `PRODUCTION_DEPLOYMENT_SMS_READY.md`).
3.  **Confirmation Code Entry**:
    *   The user enters the received 6-digit code into the confirmation interface provided by `SMSConsent.tsx`.
    *   This code is submitted to the `POST /api/sms-consent/confirm` endpoint.
4.  **Consent Activation**:
    *   If the code is valid, the `double_opt_in_confirmed` status is updated in the `sms_consent` database table, and SMS alerts are activated for the user.

### 3.3. Consent Language Example (Displayed in `SMSConsent.tsx`):

The following (or substantially similar) language is displayed to the user at the point of initial consent:

```
By providing your mobile phone number and checking this box, you agree to receive text message alerts from Rip City Events Hub regarding event deals, price drops, and important service notifications.

Message frequency varies. Message and data rates may apply. You can opt out at any time by replying STOP to any message. For help, reply HELP.

By clicking "Enable SMS Alerts," you consent to receive automated text messages at the phone number provided. Consent is not a condition of purchase.

You also agree to our Terms of Service and Privacy Policy, which describe how we collect, use, and protect your information.
```

## 4. Data Collection and Storage

### 4.1. Information Collected:

*   **Phone Number**: The mobile phone number provided by the user.
*   **Consent Timestamp**: The date and time when consent was initially provided.
*   **IP Address**: The IP address from which the consent was submitted.
*   **User Agent**: Browser and device information at the time of consent.
*   **Double Opt-In Confirmation**: Timestamp of when the SMS verification code was successfully confirmed.
*   **Subscription Tier**: The user's subscription level at the time of consent.
*   **Source**: The method/interface through which consent was obtained (e.g., "web_app").

### 4.2. Database Storage:

All consent data is stored in the `sms_consent` table within the Rip City Events Hub database, as defined in `ripcity-backend/src/database/connection.ts`:

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
  double_opt_in_code VARCHAR(10),
  double_opt_in_sent_at TIMESTAMP,
  double_opt_in_confirmed_at TIMESTAMP,
  source VARCHAR(50) DEFAULT 'web_app',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, phone_number)
);
```

## 5. Opt-Out Mechanisms

Users can opt out of SMS alerts through multiple methods:

### 5.1. Reply STOP:

*   Users can reply with "STOP," "UNSUBSCRIBE," "CANCEL," "END," or "QUIT" to any SMS message.
*   The opt-out is processed immediately via the Twilio webhook handler (`POST /api/sms-consent/webhook`).
*   An opt-out confirmation message is sent: "You've been unsubscribed from Rip City Events Hub SMS alerts. No more messages will be sent to this number."

### 5.2. Web Interface:

*   Users can manually opt out through their account settings via the `SMSConsent.tsx` component.
*   This uses the `POST /api/sms-consent/opt-out` endpoint.

### 5.3. Processing Time:

*   All opt-out requests are processed within 5 seconds of receipt.
*   The `opt_out_timestamp` is immediately updated in the database.

## 6. Message Frequency and Content

### 6.1. Frequency Limits by Subscription Tier:

*   **Pro Tier ($9.99/month)**: Up to 5 SMS messages per day
*   **Premium Tier ($19.99/month)**: Up to 15 SMS messages per day
*   **Enterprise Tier ($99.99/month)**: Up to 50 SMS messages per day

### 6.2. Message Content Types:

*   **Event Deal Alerts**: Price drops, flash deals, new events, last chance notifications
*   **Service Notifications**: Critical account or service updates

### 6.3. Message Templates:

All SMS messages include:
*   Clear identification of Rip City Events Hub as the sender
*   Relevant deal or service information
*   Opt-out instructions ("Reply STOP to opt-out")
*   Company branding (🌹 emoji for Rip City Events Hub)

## 7. Compliance and Record Keeping

### 7.1. TCPA Compliance:

*   **Express Written Consent**: Required before any messages are sent
*   **Clear Disclosure**: All material terms are disclosed at the point of consent
*   **Double Opt-In**: SMS verification code confirmation required
*   **Immediate Opt-Out**: STOP keywords processed within 5 seconds
*   **Record Retention**: Consent records maintained for 12 months minimum

### 7.2. Audit Trail:

*   All consent events are logged with timestamps, IP addresses, and user agents
*   Opt-out events are immediately recorded
*   Failed confirmation attempts are tracked
*   Database constraints prevent duplicate consent records

### 7.3. Carrier Compliance:

*   A2P 10DLC registration required for production (via Twilio)
*   Message templates subject to carrier approval
*   Spam complaint monitoring and response procedures

## 8. Data Protection and Privacy

### 8.1. Data Security:

*   Phone numbers and consent data are encrypted in transit and at rest
*   Access to consent data is restricted to authorized personnel only
*   Regular security audits of SMS consent systems

### 8.2. Data Retention:

*   Consent records are retained for a minimum of 12 months after opt-out
*   Data may be retained longer as required by law or for legitimate business purposes
*   Users may request deletion of their data subject to legal retention requirements

### 8.3. Third-Party Sharing:

*   Phone numbers are shared only with Twilio (SMS service provider) for message delivery
*   Consent data is not sold, rented, or shared with other third parties
*   Service providers are bound by data protection agreements

## 9. Contact Information

For questions about SMS consent, opt-out requests, or privacy concerns:

*   **Email**: support@ripcityticketdispatch.works
*   **Website**: https://ripcityticketdispatch.works
*   **Terms of Service**: https://ripcityticketdispatch.works/terms
*   **Privacy Policy**: https://ripcityticketdispatch.works/privacy

## 10. Document Updates

This document may be updated as our SMS program evolves or as regulations change. Users will be notified of material changes through appropriate channels.

**Last Updated**: June 13, 2025  
**Next Review Date**: December 13, 2025

---

**🔒 PROPRIETARY & CONFIDENTIAL**  
**Copyright (c) 2025 Joseph Mazzini <joseph@mazzlabs.works>**  
**All Rights Reserved - Rip City Events Hub SMS Proof of Consent Documentation**
