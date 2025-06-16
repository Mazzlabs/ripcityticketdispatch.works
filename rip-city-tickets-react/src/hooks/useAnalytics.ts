import { useCallback } from 'react';
import mixpanel from 'mixpanel-browser';
import { gtag } from '../services/googleAnalytics';

export interface AnalyticsEvent {
  name: string;
  category: string;
  properties?: Record<string, any>;
}

export interface UserProperties {
  userId?: string;
  email?: string;
  tier?: string;
  subscriptionStatus?: string;
  [key: string]: any;
}

export const useAnalytics = () => {
  // Track events to both Mixpanel and Google Analytics
  const track = useCallback((event: AnalyticsEvent) => {
    const { name, category, properties = {} } = event;
    
    // Mixpanel tracking
    mixpanel.track(name, {
      category,
      timestamp: new Date().toISOString(),
      ...properties
    });

    // Google Analytics tracking
    gtag('event', name, {
      event_category: category,
      event_label: properties.label || '',
      value: properties.value || 0,
      ...properties
    });
  }, []);

  // Track page views
  const trackPageView = useCallback((page: string, properties?: Record<string, any>) => {
    mixpanel.track('Page View', {
      page,
      timestamp: new Date().toISOString(),
      ...properties
    });

    gtag('config', 'G-8CZCX7V6YQ', {
      page_title: page,
      page_location: window.location.href,
      ...properties
    });
  }, []);

  // Track user interactions
  const trackUserAction = useCallback((action: string, element: string, properties?: Record<string, any>) => {
    track({
      name: 'User Action',
      category: 'Interaction',
      properties: {
        action,
        element,
        ...properties
      }
    });
  }, [track]);

  // Track ticket-related events
  const trackTicketEvent = useCallback((action: string, dealData?: any) => {
    track({
      name: `Ticket ${action}`,
      category: 'Tickets',
      properties: {
        dealScore: dealData?.dealScore,
        venue: dealData?.venue,
        category: dealData?.category,
        priceRange: dealData?.priceRange,
        ...dealData
      }
    });
  }, [track]);

  // Track subscription events
  const trackSubscriptionEvent = useCallback((action: string, tier?: string, properties?: Record<string, any>) => {
    track({
      name: `Subscription ${action}`,
      category: 'Subscription',
      properties: {
        tier,
        ...properties
      }
    });
  }, [track]);

  // Track SMS consent events
  const trackSMSEvent = useCallback((action: string, properties?: Record<string, any>) => {
    track({
      name: `SMS ${action}`,
      category: 'SMS',
      properties: {
        ...properties
      }
    });
  }, [track]);

  // Track errors
  const trackError = useCallback((error: Error, context?: string) => {
    track({
      name: 'Error',
      category: 'Error',
      properties: {
        error: error.message,
        stack: error.stack,
        context,
        url: window.location.href
      }
    });
  }, [track]);

  // Track business metrics
  const trackBusinessMetric = useCallback((metric: string, value: number, properties?: Record<string, any>) => {
    track({
      name: 'Business Metric',
      category: 'Business',
      properties: {
        metric,
        value,
        ...properties
      }
    });
  }, [track]);

  // Identify user
  const identifyUser = useCallback((userProperties: UserProperties) => {
    if (userProperties.userId) {
      mixpanel.identify(userProperties.userId);
    }
    
    mixpanel.people.set(userProperties);
    
    gtag('config', 'G-8CZCX7V6YQ', {
      user_id: userProperties.userId,
      custom_map: {
        tier: userProperties.tier,
        subscription_status: userProperties.subscriptionStatus
      }
    });
  }, []);

  // Reset user (logout)
  const resetUser = useCallback(() => {
    mixpanel.reset();
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
