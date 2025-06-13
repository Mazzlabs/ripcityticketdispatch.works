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

### 3.4. Information Provided to User at Opt-In:

At the point of consent and during the opt-in flow, users are informed of:
*   The purpose of the SMS messages.
*   That they are consenting to receive messages at the number provided.
*   "Message frequency varies" (with tier-specific caps detailed in `SMS_CONSENT_TCPA_DOCUMENTATION.md` and potentially displayed to the user).
*   "Message and data rates may apply."
*   Clear instructions on how to opt-out (e.g., "Reply STOP to unsubscribe").
*   Clear instructions on how to get help (e.g., "Reply HELP for assistance").
*   Direct links to the Rip City Events Hub Terms of Service and Privacy Policy (e.g., `ripcityticketdispatch.works/terms`).
*   A statement regarding carrier non-liability for delayed or undelivered messages.

## 4. Record Keeping of Consent

Rip City Events Hub maintains a detailed record of each user's SMS consent in the `sms_consent` database table. This record includes, but is not limited to:
*   `id` (UUID): Unique identifier for the consent record.
*   `user_id` (UUID): Foreign key referencing the users table.
*   `phone_number` (VARCHAR): The user's mobile phone number (formatted, e.g., +1XXXXXXXXXX).
*   `consent_timestamp` (TIMESTAMP): Timestamp of initial consent.
*   `opt_out_timestamp` (TIMESTAMP NULL): Timestamp of opt-out, if applicable.
*   `ip_address` (INET): IP address from which consent was given.
*   `user_agent` (TEXT): User agent string of the device used for consent.
*   `subscription_tier` (VARCHAR): User's subscription tier at the time of consent.
*   `double_opt_in_confirmed` (BOOLEAN): Status of double opt-in confirmation.
*   `double_opt_in_code` (VARCHAR): The 6-digit code sent to the user.
*   `double_opt_in_sent_at` (TIMESTAMP): Timestamp when the double opt-in code was sent.
*   `double_opt_in_confirmed_at` (TIMESTAMP): Timestamp when the user confirmed with the code.
*   `source` (VARCHAR): Source of opt-in (e.g., 'web_app').
*   `created_at` (TIMESTAMP): Timestamp of record creation.
*   `updated_at` (TIMESTAMP): Timestamp of last record update.

These records are stored securely and are accessible for audit and compliance purposes. Logs of SMS send/receive events are also maintained.

## 5. User Opt-Out Process

Users can revoke their consent and opt-out of receiving SMS alerts at any time through the following methods, processed by `smsConsentService.ts` and Twilio webhooks (`POST /api/sms-consent/webhook`):

1.  **Keyword Opt-Out**:
    *   Users can reply "STOP", "QUIT", "CANCEL", "UNSUBSCRIBE", or "END" to any SMS message received from Rip City Events Hub. This will immediately update their `opt_out_timestamp` in the `sms_consent` table.
2.  **Manual Opt-Out via Account Settings**:
    *   Users can log in to their Rip City Events Hub account and use the interface provided by `SMSConsent.tsx` (likely interacting with `POST /api/sms-consent/opt-out`) to disable SMS alerts.

### 5.1. Opt-Out Confirmation Message:

Upon successful opt-out, the user receives an SMS confirmation:
*   **Message Template**: `You've been unsubscribed from Rip City Events Hub SMS alerts. No more messages will be sent to this number.\n\nFor support: support@ripcityticketdispatch.works` (as defined in `SMS_CONSENT_IMPLEMENTATION_COMPLETE.md`).

## 6. Help and Support

Users can obtain help regarding the SMS alert feature through:
1.  **Keyword "HELP"**:
    *   Users can reply "HELP" to any SMS message. They will receive a message with support information.
    *   **Example HELP Response Template (from documentation)**: `Rip City Events Hub Alerts: For help, visit [Link to FAQ/Support Page] or email support@ripcityticketdispatch.works. Msg freq varies. Msg&Data rates may apply. Reply STOP to cancel.` (Ensure the link is accurate).
2.  **Customer Support Channels**:
    *   **Email**: support@ripcityticketdispatch.works
    *   **Phone**: (888) 379-9632
    *   **Website**: Via FAQ or Help Center on ripcityticketdispatch.works.
    *   The `GET /api/sms-consent/compliance-info` endpoint may also provide relevant support information.

## 7. Privacy and Data Use

*   Phone numbers collected for SMS alerts are used exclusively for providing the Rip City Events Hub SMS alert service and related service communications.
*   User phone numbers and consent information are handled in accordance with the Rip City Events Hub Privacy Policy.
*   Phone numbers are not sold. They are shared with Twilio (our SMS service provider) solely for message delivery.
*   Data Retention: Consent records (especially opt-out records for suppression lists) are maintained as per TCPA requirements and internal policy (e.g., opt-out records retained permanently, compliance logs for 3+ years as suggested in `TERMS_OF_SERVICE_SMS_FOUNDATION.md`).

## 8. API Endpoints for Consent Management

The following API endpoints are key to the SMS consent lifecycle:
*   `POST /api/sms-consent/opt-in`: Initiates opt-in and sends double opt-in code.
*   `POST /api/sms-consent/confirm`: Confirms opt-in using the SMS code.
*   `GET /api/sms-consent/status`: Checks a user's current SMS consent status.
*   `POST /api/sms-consent/opt-out`: Allows users to opt-out via the web interface.
*   `POST /api/sms-consent/webhook`: Handles incoming SMS from users (e.g., STOP, HELP) via Twilio.
*   `GET /api/sms-consent/compliance-info`: Provides TCPA compliance-related information.

## 9. Compliance and Training

Rip City Events Hub is committed to complying with applicable laws and regulations governing SMS communications, including the Telephone Consumer Protection Act (TCPA) and CTIA guidelines. The implemented system reflects these requirements. Internal staff involved in managing SMS communications will be made aware of these consent procedures and compliance requirements. Regular audits of consent records and delivery logs are planned.

---
**End of Document**
