// Type declarations for mixpanel-browser
declare module 'mixpanel-browser' {
  interface MixpanelInstance {
    init(token: string, config?: any): void;
    track(event_name: string, properties?: any): void;
    identify(unique_id: string): void;
    people: {
      set(properties: any): void;
      set_once(properties: any): void;
      increment(property: string, by?: number): void;
    };
    register(properties: any): void;
    register_once(properties: any): void;
    unregister(property: string): void;
    alias(alias: string, original?: string): void;
    set_group(group_key: string, group_ids: string | string[]): void;
    add_group(group_key: string, group_id: string): void;
    remove_group(group_key: string, group_id: string): void;
    track_with_groups(event_name: string, properties?: any, groups?: any): void;
    get_distinct_id(): string;
    reset(): void;
    opt_in_tracking(): void;
    opt_out_tracking(): void;
    has_opted_in_tracking(): boolean;
    has_opted_out_tracking(): boolean;
    clear_opt_in_out_tracking(): void;
  }

  const mixpanel: MixpanelInstance;
  export default mixpanel;
}
