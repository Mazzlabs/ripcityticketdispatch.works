// API service for connecting to the Rip City backend
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.ripcityticketdispatch.works'
  : 'http://localhost:8080/api';

export interface Deal {
  id: string;
  name: string;
  venue: string;
  city: string;
  date: string;
  time?: string;
  url: string;
  image?: string;
  minPrice: number;
  maxPrice: number;
  currency: string;
  dealScore: number;
  category: string;
  source: string;
  savings: string;
  originalPrice: number;
  isFree: boolean;
  description?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T[];
  metadata: {
    total: number;
    available?: number;
    timestamp: string;
    filters?: any;
    averageScore?: number;
  };
  sources?: string[];
  message?: string;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async fetchWithErrorHandling<T>(url: string): Promise<T> {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API fetch error:', error);
      throw error;
    }
  }

  /**
   * Get all deals with optional filters
   */
  async getDeals(params?: {
    category?: string;
    maxPrice?: number;
    minPrice?: number;
    venue?: string;
    sortBy?: 'score' | 'price' | 'date' | 'savings';
    limit?: number;
    sources?: string;
  }): Promise<ApiResponse<Deal>> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const url = `${this.baseUrl}/deals?${searchParams.toString()}`;
    return this.fetchWithErrorHandling<ApiResponse<Deal>>(url);
  }

  /**
   * Get Portland Trail Blazers specific deals
   */
  async getBlazersDeals(): Promise<ApiResponse<Deal>> {
    const url = `${this.baseUrl}/deals/blazers`;
    return this.fetchWithErrorHandling<ApiResponse<Deal>>(url);
  }

  /**
   * Get hot deals (highest deal scores)
   */
  async getHotDeals(): Promise<ApiResponse<Deal>> {
    const url = `${this.baseUrl}/deals/hot`;
    return this.fetchWithErrorHandling<ApiResponse<Deal>>(url);
  }

  /**
   * Get free events
   */
  async getFreeEvents(limit: number = 20): Promise<ApiResponse<Deal>> {
    const url = `${this.baseUrl}/deals/free?limit=${limit}`;
    return this.fetchWithErrorHandling<ApiResponse<Deal>>(url);
  }

  /**
   * Search events by name
   */
  async searchEvents(query: string): Promise<ApiResponse<Deal>> {
    const url = `${this.baseUrl}/deals/search?q=${encodeURIComponent(query)}`;
    return this.fetchWithErrorHandling<ApiResponse<Deal>>(url);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; timestamp: string; environment: string }> {
    // Remove /api from baseUrl for health check
    const healthUrl = this.baseUrl.replace('/api', '/health');
    return this.fetchWithErrorHandling(healthUrl);
  }

  /**
   * User registration
   */
  async registerUser(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    preferences?: any;
  }): Promise<any> {
    const url = `${this.baseUrl}/users/register`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!response.ok) throw new Error('Registration failed');
    return response.json();
  }

  /**
   * User login
   */
  async loginUser(credentials: { email: string; password: string }): Promise<any> {
    const url = `${this.baseUrl}/users/login`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    if (!response.ok) throw new Error('Login failed');
    return response.json();
  }

  /**
   * Get user profile
   */
  async getUserProfile(token: string): Promise<any> {
    const url = `${this.baseUrl}/users/profile`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch user profile');
    return response.json();
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(token: string, preferences: any): Promise<any> {
    const url = `${this.baseUrl}/users/preferences`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(preferences)
    });
    if (!response.ok) throw new Error('Failed to update preferences');
    return response.json();
  }

  /**
   * Get subscription plans
   */
  async getSubscriptionPlans(): Promise<any> {
    const url = `${this.baseUrl}/payments/plans`;
    return this.fetchWithErrorHandling(url);
  }

  /**
   * Create checkout session
   */
  async createCheckoutSession(token: string, planId: string): Promise<any> {
    const url = `${this.baseUrl}/payments/create-checkout`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ planId })
    });
    if (!response.ok) throw new Error('Failed to create checkout session');
    return response.json();
  }

  /**
   * Create billing portal session
   */
  async createBillingPortalSession(token: string): Promise<any> {
    const url = `${this.baseUrl}/payments/billing-portal`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to create billing portal session');
    return response.json();
  }

  /**
   * Get subscription status
   */
  async getSubscriptionStatus(token: string): Promise<any> {
    const url = `${this.baseUrl}/payments/subscription-status`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to get subscription status');
    return response.json();
  }
}

export const apiService = new ApiService();
export default apiService;
