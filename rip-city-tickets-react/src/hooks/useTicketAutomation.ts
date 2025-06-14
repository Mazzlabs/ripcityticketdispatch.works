import { useState, useEffect, useCallback } from 'react';
import { TicketDeal } from '../components/TicketCard/TicketCard';
import { apiService } from '../services/api';
import { useAnalytics } from './useAnalytics';

interface PriceAlert {
  id: string;
  name: string;
  event?: string;
  venue?: string;
  maxPrice: number;
  type?: 'sports' | 'music';
  isActive: boolean;
  createdAt: Date;
  timesTriggered: number;
  lastTriggered?: Date;
}

interface TicketSystemState {
  deals: TicketDeal[];
  alerts: PriceAlert[];
  isMonitoring: boolean;
  lastScanTime: Date | null;
  totalSavings: number;
  isLoading: boolean;
  error: string | null;
}

export const useTicketAutomation = () => {
  const { trackTicketEvent, trackUserAction, trackError } = useAnalytics();
  
  const [state, setState] = useState<TicketSystemState>({
    deals: [],
    alerts: [],
    isMonitoring: false,
    lastScanTime: null,
    totalSavings: 0,
    isLoading: false,
    error: null
  });

  // Load deals from API
  const loadDeals = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Get hot deals and regular deals
      const [hotDealsResponse, regularDealsResponse] = await Promise.all([
        apiService.getHotDeals(),
        apiService.getDeals({ limit: 20, sortBy: 'score' })
      ]);

      // Combine and deduplicate deals
      const allDeals = [...hotDealsResponse.deals, ...regularDealsResponse.deals];
      const uniqueDeals = allDeals.filter((deal, index, self) => 
        index === self.findIndex(d => d.id === deal.id)
      );

      // Calculate total savings
      const totalSavings = uniqueDeals.reduce((sum, deal) => {
        const savings = deal.originalPrice - deal.minPrice;
        return sum + savings;
      }, 0);

      setState(prev => ({
        ...prev,
        deals: uniqueDeals,
        totalSavings,
        isLoading: false,
        lastScanTime: new Date()
      }));

    } catch (error) {
      console.error('Error loading deals:', error);
      
      // Track the error
      if (error instanceof Error) {
        trackError(error, 'loadDeals');
      }
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load deals'
      }));
    }
  }, []);

  // Auto-monitoring effect
  useEffect(() => {
    let scanInterval: NodeJS.Timeout;
    
    if (state.isMonitoring) {
      // Initial load
      loadDeals();
      
      // Set up periodic scanning
      scanInterval = setInterval(() => {
        loadDeals();
      }, 30000); // Scan every 30 seconds
    }
    
    return () => {
      if (scanInterval) clearInterval(scanInterval);
    };
  }, [state.isMonitoring, loadDeals]);

  // Load Blazers deals specifically
  const loadBlazersDeals = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await apiService.getBlazersDeals();
      
      setState(prev => ({
        ...prev,
        deals: response.deals,
        isLoading: false,
        lastScanTime: new Date()
      }));

    } catch (error) {
      console.error('Error loading Blazers deals:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load Blazers deals'
      }));
    }
  }, []);

  // Search deals
  const searchDeals = useCallback(async (query: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await apiService.searchEvents(query);
      
      setState(prev => ({
        ...prev,
        deals: response.deals,
        isLoading: false,
        lastScanTime: new Date()
      }));

    } catch (error) {
      console.error('Error searching deals:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to search deals'
      }));
    }
  }, []);

  // Get free events
  const loadFreeEvents = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await apiService.getFreeEvents();
      
      setState(prev => ({
        ...prev,
        deals: response.deals,
        isLoading: false,
        lastScanTime: new Date()
      }));

    } catch (error) {
      console.error('Error loading free events:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load free events'
      }));
    }
  }, []);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    setState(prev => ({ ...prev, isMonitoring: true }));
    trackUserAction('Start Monitoring', 'Deal Scanner', {
      currentDeals: state.deals.length
    });
  }, [trackUserAction, state.deals.length]);

  // Stop monitoring  
  const stopMonitoring = useCallback(() => {
    setState(prev => ({ ...prev, isMonitoring: false }));
    trackUserAction('Stop Monitoring', 'Deal Scanner', {
      currentDeals: state.deals.length
    });
  }, [trackUserAction, state.deals.length]);

  // Handle purchase action
  const purchaseDeal = useCallback((dealId: string) => {
    console.log('🎫 Purchase initiated for deal:', dealId);
    
    // Find the deal and open its URL
    const deal = state.deals.find(d => d.id === dealId);
    if (deal) {
      // Track the purchase action
      trackTicketEvent('Purchase Initiated', {
        dealId: deal.id,
        dealScore: deal.dealScore,
        venue: deal.venue,
        category: deal.category,
        minPrice: deal.minPrice,
        savings: deal.originalPrice - deal.minPrice,
        source: deal.source
      });
      
      // URL opening is handled in TicketCard component
      console.log('Opening deal URL:', deal.url);
      
      // Update UI state
      setState(prev => ({
        ...prev,
        deals: prev.deals.map(d => 
          d.id === dealId 
            ? { ...d, purchased: true } as any // Add purchased flag for UI feedback
            : d
        )
      }));
    }
  }, [state.deals, trackTicketEvent]);

  // Handle save deal action
  const saveDeal = useCallback((dealId: string) => {
    console.log('💾 Deal saved:', dealId);
    
    // Add to saved deals (could be stored in localStorage or backend)
    const deal = state.deals.find(d => d.id === dealId);
    if (deal) {
      // Track the save action
      trackUserAction('Save Deal', 'Deal Management', {
        dealId: deal.id,
        dealScore: deal.dealScore,
        venue: deal.venue,
        category: deal.category
      });
      
      // For now, just show in console - could add to localStorage
      const savedDeals = JSON.parse(localStorage.getItem('savedDeals') || '[]');
      savedDeals.push(deal);
      localStorage.setItem('savedDeals', JSON.stringify(savedDeals));
      
      // Update UI to show saved state
      setState(prev => ({
        ...prev,
        deals: prev.deals.map(d => 
          d.id === dealId 
            ? { ...d, saved: true } as any // Add saved flag for UI feedback
            : d
        )
      }));
    }
  }, [state.deals, trackUserAction]);

  // Calculate stats
  const stats = {
    totalSavings: state.totalSavings,
    totalDeals: state.deals.length,
    activeAlerts: state.alerts.length,
    hotDeals: state.deals.filter(deal => deal.dealScore >= 80).length,
    blazersDeals: state.deals.filter(deal => 
      deal.name.toLowerCase().includes('trail blazers') ||
      deal.name.toLowerCase().includes('blazers')
    ).length,
    sportsDeals: state.deals.filter(deal => 
      deal.category === 'sports' || 
      deal.name.toLowerCase().includes('blazers') || 
      deal.name.toLowerCase().includes('timbers') ||
      deal.name.toLowerCase().includes('thorns')
    ).length,
    musicDeals: state.deals.filter(deal => 
      deal.category === 'music' || 
      deal.category === 'entertainment' ||
      deal.name.toLowerCase().includes('concert') ||
      deal.name.toLowerCase().includes('festival')
    ).length
  };

  return {
    deals: state.deals,
    alerts: state.alerts,
    isMonitoring: state.isMonitoring,
    lastScanTime: state.lastScanTime,
    isLoading: state.isLoading,
    error: state.error,
    startMonitoring,
    stopMonitoring,
    purchaseDeal,
    saveDeal,
    stats,
    // New API-connected methods
    loadDeals,
    loadBlazersDeals,
    loadFreeEvents,
    searchDeals
  };
};
