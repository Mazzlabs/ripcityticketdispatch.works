// Google Analytics service
declare global {
  interface Window {
    gtag: (command: string, ...args: any[]) => void;
    dataLayer: any[];
  }
}

export const GoogleAnalytics = {
  // Track page views
  trackPageview: (pagePath: string, pageTitle?: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', 'G-8CZCX7V6YQ', {
        page_path: pagePath,
        page_title: pageTitle
      });
    }
  },

  // Track custom events
  trackEvent: (eventName: string, parameters?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, parameters);
    }
  },

  // Track user interactions
  trackUserAction: (action: string, category: string, label?: string, value?: number) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value
      });
    }
  },

  // Track subscription events
  trackSubscription: (action: string, tier: string, value?: number) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'subscription', {
        event_category: 'Subscription',
        event_label: tier,
        subscription_action: action,
        value: value
      });
    }
  },

  // Track deal interactions
  trackDealInteraction: (action: string, dealId: string, dealScore: number) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'deal_interaction', {
        event_category: 'Deals',
        event_label: dealId,
        deal_action: action,
        deal_score: dealScore
      });
    }
  },

  // Track conversions
  trackConversion: (conversionType: string, value: number) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'conversion', {
        event_category: 'Conversions',
        conversion_type: conversionType,
        value: value
      });
    }
  }
};

// Export gtag for direct usage
export const gtag = (command: string, ...args: any[]) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag(command, ...args);
  }
};

export default GoogleAnalytics;
