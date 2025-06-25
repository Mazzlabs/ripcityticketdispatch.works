/**
 * Google Analytics Service - MVP Version (Disabled)
 * All functions are stubbed out to prevent FOUC and cookie issues
 */

// Google Analytics Stub - All functions disabled for MVP
export const initializeGoogleAnalytics = (trackingId?: string) => {
  // No-op for MVP - GA disabled
  console.debug('Google Analytics initialization disabled for MVP');
};

export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  // No-op for MVP
  console.debug('GA Event tracking disabled:', eventName, parameters);
};

export const trackPageView = (pagePath: string, pageTitle?: string) => {
  // No-op for MVP
  console.debug('GA Page view tracking disabled:', pagePath, pageTitle);
};

export const setUserProperties = (properties: Record<string, any>) => {
  // No-op for MVP
  console.debug('GA User properties disabled:', properties);
};

export const trackConversion = (conversionName: string, parameters?: Record<string, any>) => {
  // No-op for MVP
  console.debug('GA Conversion tracking disabled:', conversionName, parameters);
};

// Default export stub
const googleAnalytics = {
  initializeGoogleAnalytics,
  trackEvent,
  trackPageView,
  setUserProperties,
  trackConversion
};

export default googleAnalytics;
