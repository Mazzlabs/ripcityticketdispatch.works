/**
 * SMS Consent Component - TCPA Compliant Opt-in
 * Rip City Events Hub
 * Copyright (c) 2024 Joseph Mazzini <joseph@mazzlabs.works>
 */

import React, { useState, useEffect } from 'react';
import './SMSConsent.css';

interface SMSConsentProps {
  subscriptionTier: 'pro' | 'premium' | 'enterprise';
  onConsentComplete?: (success: boolean) => void;
  showAsModal?: boolean;
}

interface SMSConsentStatus {
  smsEnabled: boolean;
  phoneNumber?: string;
  subscriptionTier?: string;
  confirmedAt?: string;
  requiresConfirmation?: boolean;
}

interface ComplianceInfo {
  disclosureText: string;
  termsUrl: string;
  privacyUrl: string;
  supportInfo: {
    email: string;
    hours: string;
  };
  optOutKeywords: string[];
  helpKeywords: string[];
  carrierNotice: string;
  frequencyByTier: {
    [key: string]: string;
  };
}

const SMSConsent: React.FC<SMSConsentProps> = ({ 
  subscriptionTier, 
  onConsentComplete,
  showAsModal = false 
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToSMS, setAgreedToSMS] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [step, setStep] = useState<'consent' | 'confirmation' | 'complete'>('consent');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [smsStatus, setSmsStatus] = useState<SMSConsentStatus | null>(null);
  const [complianceInfo, setComplianceInfo] = useState<ComplianceInfo | null>(null);

  useEffect(() => {
    loadSMSStatus();
    loadComplianceInfo();
  }, []);

  const loadSMSStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/sms-consent/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSmsStatus(data);
        
        if (data.smsEnabled) {
          setStep('complete');
        } else if (data.requiresConfirmation) {
          setStep('confirmation');
          setPhoneNumber(data.phoneNumber);
        }
      }
    } catch (error) {
      console.error('Failed to load SMS status:', error);
    }
  };

  const loadComplianceInfo = async () => {
    try {
      const response = await fetch('/api/sms-consent/compliance-info');
      if (response.ok) {
        const data = await response.json();
        setComplianceInfo(data.tcpaCompliance);
      }
    } catch (error) {
      console.error('Failed to load compliance info:', error);
    }
  };

  const formatPhoneNumber = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return value;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      setPhoneNumber(formatPhoneNumber(cleaned));
    }
  };

  const handleOptIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const cleanedPhone = phoneNumber.replace(/\D/g, '');
      
      const response = await fetch('/api/sms-consent/opt-in', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: cleanedPhone,
          subscriptionTier,
          agreedToTerms,
          agreedToSMS
        })
      });

      const data = await response.json();

      if (data.success) {
        setStep('confirmation');
      } else {
        setError(data.error || 'Failed to process SMS consent');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const cleanedPhone = phoneNumber.replace(/\D/g, '');

      const response = await fetch('/api/sms-consent/confirm', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: cleanedPhone,
          confirmationCode: confirmationCode.toUpperCase()
        })
      });

      const data = await response.json();

      if (data.success) {
        setStep('complete');
        onConsentComplete?.(true);
      } else {
        setError(data.error || 'Invalid confirmation code');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleOptOut = async () => {
    if (!confirm('Are you sure you want to opt out of SMS alerts?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/sms-consent/opt-out', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setSmsStatus(null);
        setStep('consent');
        setPhoneNumber('');
        setConfirmationCode('');
        setAgreedToTerms(false);
        setAgreedToSMS(false);
        onConsentComplete?.(false);
      } else {
        setError(data.error || 'Failed to opt out');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!complianceInfo) {
    return <div className="sms-consent-loading">Loading...</div>;
  }

  const renderConsentStep = () => (
    <div className="sms-consent-step">
      <div className="sms-consent-header">
        <h3>🌹 Enable SMS Alerts</h3>
        <p>Get instant notifications for the best ticket deals</p>
      </div>

      <form onSubmit={handleOptIn} className="sms-consent-form">
        <div className="form-group">
          <label htmlFor="phoneNumber">Mobile Phone Number</label>
          <input
            type="tel"
            id="phoneNumber"
            value={phoneNumber}
            onChange={handlePhoneChange}
            placeholder="(555) 123-4567"
            required
            className="phone-input"
          />
          <small className="input-help">
            Message frequency: {complianceInfo.frequencyByTier[subscriptionTier]}
          </small>
        </div>

        <div className="tcpa-disclosure">
          <p className="disclosure-text">
            {complianceInfo.disclosureText}
          </p>
          
          <div className="consent-checkboxes">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                required
              />
              <span className="checkmark"></span>
              I agree to the{' '}
              <a href={complianceInfo.termsUrl} target="_blank" rel="noopener noreferrer">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href={complianceInfo.privacyUrl} target="_blank" rel="noopener noreferrer">
                Privacy Policy
              </a>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={agreedToSMS}
                onChange={(e) => setAgreedToSMS(e.target.checked)}
                required
              />
              <span className="checkmark"></span>
              I consent to receive SMS text messages from Rip City Events Hub
            </label>
          </div>
        </div>

        <div className="opt-out-info">
          <p><strong>To opt out:</strong> Reply {complianceInfo.optOutKeywords.join(', ')} to any message</p>
          <p><strong>For help:</strong> Reply {complianceInfo.helpKeywords.join(', ')} or contact {complianceInfo.supportInfo.email}</p>
          <p className="carrier-notice">{complianceInfo.carrierNotice}</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button
          type="submit"
          disabled={loading || !agreedToTerms || !agreedToSMS || !phoneNumber}
          className="consent-button"
        >
          {loading ? 'Processing...' : 'Enable SMS Alerts'}
        </button>
      </form>
    </div>
  );

  const renderConfirmationStep = () => (
    <div className="sms-consent-step">
      <div className="sms-consent-header">
        <h3>📱 Confirm Your Phone Number</h3>
        <p>We sent a 6-digit code to {phoneNumber}</p>
      </div>

      <form onSubmit={handleConfirmation} className="sms-consent-form">
        <div className="form-group">
          <label htmlFor="confirmationCode">Confirmation Code</label>
          <input
            type="text"
            id="confirmationCode"
            value={confirmationCode}
            onChange={(e) => setConfirmationCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={6}
            required
            className="confirmation-input"
          />
          <small className="input-help">
            Enter the 6-digit code from your SMS message
          </small>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="button-group">
          <button
            type="submit"
            disabled={loading || confirmationCode.length !== 6}
            className="consent-button"
          >
            {loading ? 'Confirming...' : 'Confirm SMS Alerts'}
          </button>
          
          <button
            type="button"
            onClick={() => setStep('consent')}
            className="secondary-button"
          >
            Change Phone Number
          </button>
        </div>
      </form>

      <div className="help-text">
        <p>Didn't receive the code? Check your messages or try again.</p>
        <p>Support: {complianceInfo.supportInfo.email}</p>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="sms-consent-step">
      <div className="sms-consent-header success">
        <h3>✅ SMS Alerts Enabled</h3>
        <p>You'll receive deal notifications at {smsStatus?.phoneNumber}</p>
      </div>

      <div className="sms-status">
        <div className="status-info">
          <p><strong>Status:</strong> Active</p>
          <p><strong>Tier:</strong> {smsStatus?.subscriptionTier}</p>
          <p><strong>Frequency:</strong> {complianceInfo.frequencyByTier[smsStatus?.subscriptionTier || subscriptionTier]}</p>
          {smsStatus?.confirmedAt && (
            <p><strong>Activated:</strong> {new Date(smsStatus.confirmedAt).toLocaleDateString()}</p>
          )}
        </div>

        <div className="opt-out-section">
          <h4>🛑 Want to opt out?</h4>
          <p>Reply STOP to any SMS message or click below:</p>
          <button onClick={handleOptOut} className="opt-out-button" disabled={loading}>
            {loading ? 'Processing...' : 'Disable SMS Alerts'}
          </button>
        </div>
      </div>
    </div>
  );

  const content = (
    <div className={`sms-consent ${showAsModal ? 'modal' : ''}`}>
      {step === 'consent' && renderConsentStep()}
      {step === 'confirmation' && renderConfirmationStep()}
      {step === 'complete' && renderCompleteStep()}
    </div>
  );

  if (showAsModal) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          {content}
          <button 
            className="modal-close" 
            onClick={() => onConsentComplete?.(false)}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  return content;
};

export default SMSConsent;
