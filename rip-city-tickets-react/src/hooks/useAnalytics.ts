/**
 * Analytics Hook - MVP Version (GA Disabled)
 * Simple stub for analytics functions to prevent FOUC issues
 */

import { useCallback } from 'react';

// Define interfaces for type safety
interface TrackEventParams {
  name: string;
  category: string;
  properties?: Record<string, any>;
}

interface UserProperties {
  userId?: string;
  tier?: string;
  subscriptionStatus?: string;
  [key: string]: any;
}

// MVP Analytics Hook - All functions are no-ops for now
export const useAnalytics = () => {
  // All tracking functions are disabled for MVP
  const track = useCallback((params: TrackEventParams) => {
    // No-op for MVP - analytics disabled
    console.debug('Analytics disabled for MVP:', params);
  }, []);

  const trackPageView = useCallback((page: string, properties?: Record<string, any>) => {
    // No-op for MVP
    console.debug('Page view (disabled):', page, properties);
  }, []);

  const trackUserAction = useCallback((action: string, element: string, properties?: Record<string, any>) => {
    // No-op for MVP
    console.debug('User action (disabled):', action, element, properties);
  }, []);

  const trackTicketEvent = useCallback((event: string, properties?: Record<string, any>) => {
    // No-op for MVP
    console.debug('Ticket event (disabled):', event, properties);
  }, []);

  const trackSubscriptionEvent = useCallback((event: string, tier?: string, properties?: Record<string, any>) => {
    // No-op for MVP
    console.debug('Subscription event (disabled):', event, tier, properties);
  }, []);

  const trackSMSEvent = useCallback((event: string, properties?: Record<string, any>) => {
    // No-op for MVP
    console.debug('SMS event (disabled):', event, properties);
  }, []);

  const trackError = useCallback((error: Error, context?: string) => {
    // Still log errors to console for debugging
    console.error('Error tracked:', error, context);
  }, []);

  const trackBusinessMetric = useCallback((metric: string, value: number, properties?: Record<string, any>) => {
    // No-op for MVP
    console.debug('Business metric (disabled):', metric, value, properties);
  }, []);

  const identifyUser = useCallback((userProperties: UserProperties) => {
    // No-op for MVP
    console.debug('User identified (disabled):', userProperties);
  }, []);

  const resetUser = useCallback(() => {
    // No-op for MVP
    console.debug('User reset (disabled)');
  }, []);

  return {
    track,
    trackPageView,
    trackUserAction,
    trackTicketEvent,
    trackSubscriptionEvent,
    trackSMSEvent,
    trackError,
    trackBusinessMetric,
    identifyUser,
    resetUser
  };
};

export default useAnalytics;
