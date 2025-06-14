import mixpanel from 'mixpanel-browser';

// Initialize Mixpanel
mixpanel.init(process.env.REACT_APP_MIXPANEL_TOKEN || '83fcad6d2ac6bbf0fb85f831ed4ecf81', {
  debug: true,
  track_pageview: true,
  persistence: 'localStorage'
});

// Mixpanel service
export const Mixpanel = {
  // User identification
  identify: (userId: string) => {
    mixpanel.identify(userId);
  },

  // Set user properties
  setUserProperties: (properties: Record<string, any>) => {
    mixpanel.people.set(properties);
  },

  // Track events
  track: (eventName: string, properties?: Record<string, any>) => {
    mixpanel.track(eventName, properties);
  },

  // Track page views
  trackPageview: (pageName: string, properties?: Record<string, any>) => {
    mixpanel.track('Page View', {
      page: pageName,
      ...properties
    });
  },

  // Track user actions
  trackUserAction: (action: string, category: string, properties?: Record<string, any>) => {
    mixpanel.track('User Action', {
      action,
      category,
      ...properties
    });
  },

  // Track subscription events
  trackSubscription: (event: string, tier: string, properties?: Record<string, any>) => {
    mixpanel.track(`Subscription ${event}`, {
      tier,
      ...properties
    });
  },

  // Track ticket events
  trackTicketEvent: (event: string, properties?: Record<string, any>) => {
    mixpanel.track(`Ticket ${event}`, {
      ...properties
    });
  },

  // Reset user (for logout)
  reset: () => {
    mixpanel.reset();
  }
};

export default Mixpanel;
