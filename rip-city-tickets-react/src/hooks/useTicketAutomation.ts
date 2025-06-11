import { useState, useEffect, useCallback } from 'react';
import { TicketDeal } from '../components/TicketCard/TicketCard';

interface PortlandVenue {
  id: string;
  name: string;
  type: 'sports' | 'music';
  capacity: number;
  teams?: string[];
  address: string;
  coordinates: { lat: number; lng: number };
}

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
  venues: PortlandVenue[];
}

export const useTicketAutomation = () => {
  const [state, setState] = useState<TicketSystemState>({
    deals: [],
    alerts: [],
    isMonitoring: false,
    lastScanTime: null,
    totalSavings: 0,
    venues: []
  });

  const portlandVenues: PortlandVenue[] = [
    {
      id: 'moda-center',
      name: 'Moda Center',
      type: 'sports',
      capacity: 19393,
      teams: ['Portland Trail Blazers'],
      address: '1 N Center Ct St, Portland, OR 97227',
      coordinates: { lat: 45.5316, lng: -122.6668 }
    },
    {
      id: 'providence-park',
      name: 'Providence Park',
      type: 'sports',
      capacity: 25218,
      teams: ['Portland Timbers', 'Portland Thorns FC'],
      address: '1844 SW Morrison St, Portland, OR 97205',
      coordinates: { lat: 45.5214, lng: -122.6918 }
    },
    {
      id: 'arlene-schnitzer',
      name: 'Arlene Schnitzer Concert Hall',
      type: 'music',
      capacity: 2776,
      address: '1037 SW Broadway, Portland, OR 97205',
      coordinates: { lat: 45.5152, lng: -122.6784 }
    },
    {
      id: 'crystal-ballroom',
      name: 'Crystal Ballroom',
      type: 'music',
      capacity: 1500,
      address: '1332 W Burnside St, Portland, OR 97209',
      coordinates: { lat: 45.5227, lng: -122.6847 }
    },
    {
      id: 'roseland-theater',
      name: 'Roseland Theater',
      type: 'music',
      capacity: 1400,
      address: '8 NW 6th Ave, Portland, OR 97209',
      coordinates: { lat: 45.5234, lng: -122.6758 }
    }
  ];

  // Initialize venues and load saved data
  useEffect(() => {
    setState(prev => ({ ...prev, venues: portlandVenues }));
    loadSavedAlerts();
    generateSampleDeals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-monitoring effect
  useEffect(() => {
    let scanInterval: NodeJS.Timeout;
    
    if (state.isMonitoring) {
      scanInterval = setInterval(() => {
        scanForDeals();
      }, 30000); // Scan every 30 seconds
    }
    
    return () => {
      if (scanInterval) clearInterval(scanInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isMonitoring]);

  const generateSampleDeals = useCallback(() => {
    const sampleEvents = [
      {
        title: 'Portland Trail Blazers vs Los Angeles Lakers',
        venue: 'Moda Center',
        type: 'sports' as const,
        team: 'Portland Trail Blazers'
      },
      {
        title: 'Portland Trail Blazers vs Golden State Warriors',
        venue: 'Moda Center',
        type: 'sports' as const,
        team: 'Portland Trail Blazers'
      },
      {
        title: 'Portland Timbers vs Seattle Sounders',
        venue: 'Providence Park',
        type: 'sports' as const,
        team: 'Portland Timbers'
      },
      {
        title: 'Indie Rock Festival 2025',
        venue: 'Crystal Ballroom',
        type: 'music' as const,
        genre: 'Rock'
      },
      {
        title: 'Portland Symphony Orchestra',
        venue: 'Arlene Schnitzer Concert Hall',
        type: 'music' as const,
        genre: 'Classical'
      },
      {
        title: 'Alternative Music Night',
        venue: 'Roseland Theater',
        type: 'music' as const,
        genre: 'Alternative'
      }
    ];

    const platforms = ['Ticketmaster', 'StubHub', 'SeatGeek', 'Vivid Seats'];
    const sections = ['100 Level', '200 Level', '300 Level', 'Club', 'Suite', 'Floor', 'Courtside'];

    const newDeals: TicketDeal[] = sampleEvents.map((event, index) => {
      const originalPrice = Math.floor(Math.random() * 200) + 50;
      const discount = Math.floor(Math.random() * 40) + 15; // 15-55% discount
      const currentPrice = Math.floor(originalPrice * (100 - discount) / 100);
      
      return {
        id: `deal-${Date.now()}-${index}`,
        ...event,
        date: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
        originalPrice,
        currentPrice,
        savingsPercent: discount,
        quantity: Math.floor(Math.random() * 8) + 1,
        section: sections[Math.floor(Math.random() * sections.length)],
        platform: platforms[Math.floor(Math.random() * platforms.length)],
        confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
        scrapedAt: new Date()
      };
    });

    setState(prev => ({ 
      ...prev, 
      deals: newDeals,
      totalSavings: newDeals.reduce((sum, deal) => sum + (deal.originalPrice - deal.currentPrice), 0)
    }));
  }, []);

  const scanForDeals = useCallback(async () => {
    console.log('🔍 Scanning for new deals...');
    
    // Simulate finding new deals
    const platforms = ['Ticketmaster', 'StubHub', 'SeatGeek', 'Vivid Seats'];
    const newDealsFound = Math.floor(Math.random() * 3); // 0-2 new deals per scan
    
    if (newDealsFound > 0) {
      const newDeals: TicketDeal[] = [];
      
      for (let i = 0; i < newDealsFound; i++) {
        const venue = portlandVenues[Math.floor(Math.random() * portlandVenues.length)];
        const originalPrice = Math.floor(Math.random() * 200) + 50;
        const discount = Math.floor(Math.random() * 40) + 15;
        const currentPrice = Math.floor(originalPrice * (100 - discount) / 100);
        
        const deal: TicketDeal = {
          id: `deal-${Date.now()}-${Math.random()}`,
          title: venue.type === 'sports' 
            ? `${venue.teams?.[0] || 'Portland'} vs Opponent`
            : `Live Concert at ${venue.name}`,
          venue: venue.name,
          type: venue.type,
          date: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
          originalPrice,
          currentPrice,
          savingsPercent: discount,
          quantity: Math.floor(Math.random() * 4) + 1,
          section: ['100 Level', '200 Level', 'Club'][Math.floor(Math.random() * 3)],
          platform: platforms[Math.floor(Math.random() * platforms.length)],
          confidence: Math.random() * 0.3 + 0.7,
          scrapedAt: new Date()
        };
        
        newDeals.push(deal);
      }
      
      setState(prev => ({
        ...prev,
        deals: [...newDeals, ...prev.deals].slice(0, 50), // Keep last 50 deals
        lastScanTime: new Date(),
        totalSavings: [...newDeals, ...prev.deals].slice(0, 50)
          .reduce((sum, deal) => sum + (deal.originalPrice - deal.currentPrice), 0)
      }));
      
      // Check alerts for new deals
      newDeals.forEach(deal => checkAlertsForDeal(deal));
      
      console.log(`✅ Found ${newDealsFound} new deals!`);
    } else {
      setState(prev => ({ ...prev, lastScanTime: new Date() }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.alerts]);

  const checkAlertsForDeal = useCallback((deal: TicketDeal) => {
    const matchingAlerts = state.alerts.filter(alert => {
      if (!alert.isActive) return false;
      
      const titleMatch = !alert.event || deal.title.toLowerCase().includes(alert.event.toLowerCase());
      const venueMatch = !alert.venue || deal.venue.toLowerCase().includes(alert.venue.toLowerCase());
      const priceMatch = deal.currentPrice <= alert.maxPrice;
      const typeMatch = !alert.type || deal.type === alert.type;
      
      return titleMatch && venueMatch && priceMatch && typeMatch;
    });
    
    if (matchingAlerts.length > 0) {
      matchingAlerts.forEach(alert => {
        console.log(`🚨 Alert triggered: ${alert.name} for ${deal.title}`);
        
        // Update alert statistics
        const updatedAlert = {
          ...alert,
          timesTriggered: alert.timesTriggered + 1,
          lastTriggered: new Date()
        };
        
        setState(prev => ({
          ...prev,
          alerts: prev.alerts.map(a => a.id === alert.id ? updatedAlert : a)
        }));
        
        // In real app, this would send notifications
        showNotification(`🚨 Price Alert: ${deal.title} - $${deal.currentPrice}`);
      });
    }
  }, [state.alerts]);

  const showNotification = (message: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Rip City Ticket Alert', { body: message });
    }
    console.log('📱', message);
  };

  const startMonitoring = useCallback(() => {
    setState(prev => ({ ...prev, isMonitoring: true }));
    console.log('✅ Ticket monitoring started');
  }, []);

  const stopMonitoring = useCallback(() => {
    setState(prev => ({ ...prev, isMonitoring: false }));
    console.log('⏹️ Ticket monitoring stopped');
  }, []);

  const addPriceAlert = useCallback((alertData: Omit<PriceAlert, 'id' | 'createdAt' | 'timesTriggered' | 'isActive'>) => {
    const newAlert: PriceAlert = {
      ...alertData,
      id: `alert-${Date.now()}`,
      createdAt: new Date(),
      timesTriggered: 0,
      isActive: true
    };
    
    setState(prev => ({ ...prev, alerts: [...prev.alerts, newAlert] }));
    saveAlertsToStorage([...state.alerts, newAlert]);
    
    console.log(`✅ Alert created: ${newAlert.name}`);
    return newAlert;
  }, [state.alerts]);

  const removeAlert = useCallback((alertId: string) => {
    setState(prev => ({
      ...prev,
      alerts: prev.alerts.filter(alert => alert.id !== alertId)
    }));
    
    const updatedAlerts = state.alerts.filter(alert => alert.id !== alertId);
    saveAlertsToStorage(updatedAlerts);
    
    console.log('🗑️ Alert removed');
  }, [state.alerts]);

  const toggleAlert = useCallback((alertId: string) => {
    setState(prev => ({
      ...prev,
      alerts: prev.alerts.map(alert => 
        alert.id === alertId 
          ? { ...alert, isActive: !alert.isActive }
          : alert
      )
    }));
    
    const updatedAlerts = state.alerts.map(alert => 
      alert.id === alertId 
        ? { ...alert, isActive: !alert.isActive }
        : alert
    );
    saveAlertsToStorage(updatedAlerts);
  }, [state.alerts]);

  const saveAlertsToStorage = (alerts: PriceAlert[]) => {
    localStorage.setItem('rip-city-alerts', JSON.stringify(alerts));
  };

  const loadSavedAlerts = () => {
    const saved = localStorage.getItem('rip-city-alerts');
    if (saved) {
      try {
        const alerts = JSON.parse(saved);
        setState(prev => ({ ...prev, alerts }));
      } catch (error) {
        console.error('Error loading saved alerts:', error);
      }
    } else {
      // Create sample alerts
      const sampleAlerts: PriceAlert[] = [
        {
          id: 'alert-1',
          name: 'Blazers vs Lakers Alert',
          event: 'Trail Blazers',
          venue: 'Moda Center',
          maxPrice: 150,
          type: 'sports',
          isActive: true,
          createdAt: new Date(),
          timesTriggered: 0
        },
        {
          id: 'alert-2',
          name: 'Crystal Ballroom Concerts',
          venue: 'Crystal Ballroom',
          maxPrice: 80,
          type: 'music',
          isActive: true,
          createdAt: new Date(),
          timesTriggered: 0
        }
      ];
      
      setState(prev => ({ ...prev, alerts: sampleAlerts }));
    }
  };

  const purchaseDeal = useCallback((dealId: string) => {
    const deal = state.deals.find(d => d.id === dealId);
    if (deal) {
      console.log(`🎫 Redirecting to purchase: ${deal.title}`);
      // In real app, would redirect to purchase page
      showNotification(`Redirecting to purchase ${deal.title}...`);
    }
  }, [state.deals]);

  const saveDeal = useCallback((dealId: string) => {
    const deal = state.deals.find(d => d.id === dealId);
    if (deal) {
      const savedDeals = JSON.parse(localStorage.getItem('rip-city-saved-deals') || '[]');
      if (!savedDeals.find((d: TicketDeal) => d.id === dealId)) {
        savedDeals.push(deal);
        localStorage.setItem('rip-city-saved-deals', JSON.stringify(savedDeals));
        showNotification('Deal saved! 💾');
      } else {
        showNotification('Deal already saved');
      }
    }
  }, [state.deals]);

  const getStats = useCallback(() => {
    return {
      sportsDeals: state.deals.filter(d => d.type === 'sports').length,
      musicDeals: state.deals.filter(d => d.type === 'music').length,
      totalSavings: state.totalSavings,
      activeAlerts: state.alerts.filter(a => a.isActive).length,
      totalDeals: state.deals.length,
      avgSavingsPercent: state.deals.length > 0 
        ? state.deals.reduce((sum, deal) => sum + deal.savingsPercent, 0) / state.deals.length 
        : 0
    };
  }, [state]);

  return {
    // State
    deals: state.deals,
    alerts: state.alerts,
    isMonitoring: state.isMonitoring,
    lastScanTime: state.lastScanTime,
    venues: state.venues,
    
    // Actions
    startMonitoring,
    stopMonitoring,
    addPriceAlert,
    removeAlert,
    toggleAlert,
    purchaseDeal,
    saveDeal,
    scanForDeals,
    
    // Computed
    stats: getStats()
  };
};
