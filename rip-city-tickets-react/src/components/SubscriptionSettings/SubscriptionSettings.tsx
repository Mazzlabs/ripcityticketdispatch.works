/**
 * Subscription Settings Component
 * Integrates SMS Consent with Subscription Management
 * Rip City Events Hub
 */

import React, { useState, useEffect } from 'react';
import SMSConsent from '../SMSConsent/SMSConsent';
import { useAnalytics } from '../../hooks/useAnalytics';
import './SubscriptionSettings.css';

interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  features: string[];
  maxAlerts: string;
  apiAccess: boolean;
  prioritySupport: boolean;
}

interface SubscriptionStatus {
  currentTier: string;
  alertsUsed: number;
  alertsLimit: number;
  subscriptionStatus?: string;
  billingPeriodEnd?: string;
}

const SubscriptionSettings: React.FC = () => {
  const { trackPageView, trackSubscriptionEvent, trackUserAction, trackError } = useAnalytics();
  
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<SubscriptionStatus | null>(null);
  const [showSMSConsent, setShowSMSConsent] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    trackPageView('Subscription Settings', {
      timestamp: new Date().toISOString()
    });
    loadSubscriptionData();
  }, [trackPageView]);

  const loadSubscriptionData = async () => {
    setLoading(true);
    try {
      // Load subscription tiers
      const tiersResponse = await fetch('/api/subscriptions/tiers');
      const tiersData = await tiersResponse.json();
      
      if (tiersData.success) {
        setTiers(tiersData.tiers);
      }

      // Load current subscription status
      const token = localStorage.getItem('token');
      if (token) {
        const statusResponse = await fetch('/api/subscriptions/status', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          setCurrentSubscription(statusData.subscription);
        }
      }
    } catch (error) {
      trackError(error instanceof Error ? error : new Error('Subscription data loading failed'), 'Subscription Settings');
      setError('Failed to load subscription data');
      console.error('Subscription data loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (tierId: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to upgrade your subscription');
      return;
    }

    // Track upgrade attempt
    const selectedTierName = tiers.find(t => t.id === tierId)?.name || tierId;
    trackSubscriptionEvent('Upgrade Attempt', selectedTierName, {
      fromTier: currentSubscription?.currentTier,
      toTier: selectedTierName,
      currentAlertsUsed: currentSubscription?.alertsUsed
    });

    setLoading(true);
    try {
      const response = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tierId })
      });

      const data = await response.json();

      if (data.success && data.url) {
        // For SMS-enabled tiers, show SMS consent first
        const tier = tiers.find(t => t.id === tierId);
        if (tier && ['pro', 'premium', 'enterprise'].includes(tier.id)) {
          setSelectedTier(tierId);
          setShowSMSConsent(true);
        } else {
          // Redirect to Stripe checkout
          window.location.href = data.url;
        }
      } else {
        setError(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      setError('An error occurred during upgrade');
      console.error('Upgrade error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSMSConsentComplete = (success: boolean) => {
    setShowSMSConsent(false);
    
    if (success && selectedTier) {
      // Continue with subscription checkout
      handleCheckoutRedirect(selectedTier);
    }
    setSelectedTier('');
  };

  const handleCheckoutRedirect = async (tierId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tierId })
      });

      const data = await response.json();

      if (data.success && data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout redirect error:', error);
    }
  };

  const handleManageBilling = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('/api/subscriptions/portal', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success && data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Billing portal error:', error);
    }
  };

  if (loading) {
    return <div className="subscription-loading">Loading subscription data...</div>;
  }

  return (
    <div className="subscription-settings">
      <div className="subscription-header">
        <h2>🌹 Subscription & SMS Alerts</h2>
        <p>Manage your plan and notification preferences</p>
      </div>

      {currentSubscription && (
        <div className="current-subscription">
          <h3>Current Plan</h3>
          <div className="subscription-info">
            <div className="plan-details">
              <span className="plan-name">{currentSubscription.currentTier.toUpperCase()}</span>
              <span className="plan-status">{currentSubscription.subscriptionStatus || 'Active'}</span>
            </div>
            <div className="usage-stats">
              <div className="usage-item">
                <span>Alerts Used</span>
                <span>{currentSubscription.alertsUsed} / {currentSubscription.alertsLimit}</span>
              </div>
            </div>
            {currentSubscription.currentTier !== 'free' && (
              <button onClick={handleManageBilling} className="manage-billing-btn">
                Manage Billing
              </button>
            )}
          </div>
        </div>
      )}

      <div className="subscription-tiers">
        <h3>Available Plans</h3>
        <div className="tiers-grid">
          {tiers.map((tier) => (
            <div 
              key={tier.id} 
              className={`tier-card ${currentSubscription?.currentTier === tier.id ? 'current' : ''}`}
            >
              <div className="tier-header">
                <h4>{tier.name}</h4>
                <div className="tier-price">
                  {tier.price === 0 ? 'Free' : `$${tier.price}/month`}
                </div>
              </div>

              <div className="tier-features">
                {tier.features.map((feature, index) => (
                  <div key={index} className="feature-item">
                    <span className="feature-icon">✓</span>
                    {feature}
                  </div>
                ))}
                
                <div className="feature-item">
                  <span className="feature-icon">📱</span>
                  SMS Alerts: {['pro', 'premium', 'enterprise'].includes(tier.id) ? 'Included' : 'Not Available'}
                </div>
                
                <div className="feature-item">
                  <span className="feature-icon">📊</span>
                  Alert Limit: {tier.maxAlerts}
                </div>

                {tier.apiAccess && (
                  <div className="feature-item">
                    <span className="feature-icon">🔌</span>
                    API Access
                  </div>
                )}

                {tier.prioritySupport && (
                  <div className="feature-item">
                    <span className="feature-icon">🎧</span>
                    Priority Support
                  </div>
                )}
              </div>

              <div className="tier-actions">
                {currentSubscription?.currentTier === tier.id ? (
                  <button className="current-plan-btn" disabled>
                    Current Plan
                  </button>
                ) : tier.id === 'free' ? (
                  <button className="free-plan-btn" disabled>
                    Free Plan
                  </button>
                ) : (
                  <button 
                    onClick={() => handleUpgrade(tier.id)}
                    className="upgrade-btn"
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : `Upgrade to ${tier.name}`}
                  </button>
                )}
              </div>

              {['pro', 'premium', 'enterprise'].includes(tier.id) && (
                <div className="sms-info">
                  <h5>📱 SMS Alert Benefits:</h5>
                  <ul>
                    <li>Instant deal notifications</li>
                    <li>Price drop alerts</li>
                    <li>Time-sensitive opportunities</li>
                    <li>TCPA compliant opt-in/opt-out</li>
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError('')} className="error-close">×</button>
        </div>
      )}

      {showSMSConsent && (
        <SMSConsent
          subscriptionTier={selectedTier as 'pro' | 'premium' | 'enterprise'}
          onConsentComplete={handleSMSConsentComplete}
          showAsModal={true}
        />
      )}
    </div>
  );
};

export default SubscriptionSettings;
