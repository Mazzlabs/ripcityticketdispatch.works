declare module 'mixpanel-browser' {
  interface Mixpanel {
    init(token: string, config?: any): void;
    track(event: string, properties?: any): void;
    identify(id: string | number): void;
    people: {
      set(properties: any): void;
    };
    register(properties: any): void;
    reset(): void;
  }
  
  const mixpanel: Mixpanel;
  export default mixpanel;
}