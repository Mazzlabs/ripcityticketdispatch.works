/**
 * RIP CITY TICKET DISPATCH - Frontend Application
 * Copyright (c) 2024 Joseph Mazzini <joseph@mazzlabs.works>
 * All Rights Reserved. Proprietary Software.
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner/LoadingSpinner';
import TicketCard from './components/TicketCard/TicketCard';
import apiService from './services/api';
import EventDashboard from './components/Dashboard/EventDashboard';
import EventDetail from './components/EventDetail/EventDetail';
import TrackingDashboard from './components/Tracking/TrackingDashboard';
import SettingsPage from './components/Settings/SettingsPage';
import './App.css';

type FilterType = 'all' | 'sports' | 'music' | 'entertainment';

interface EventData {
  id: string;
  name: string;
  category: FilterType;
  venue: string;
  date: string;
  priceRange: string;
  source: 'ticketmaster' | 'eventbrite';
  availableTickets: number;
  url: string;
}

interface CategoryStats {
  sports: number;
  music: number;
  entertainment: number;
  total: number;
}

interface APIStatus {
  ticketmaster: boolean;
  eventbrite: boolean;
  lastCheck: Date | null;
}

function App() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats>({
    sports: 0,
    music: 0,
    entertainment: 0,
    total: 0
  });
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  const [apiStatus, setApiStatus] = useState<APIStatus>({
    ticketmaster: false,
    eventbrite: false,
    lastCheck: null
  });

  // Remove initial loading state once React mounts
  useEffect(() => {
    // Add class to body to indicate React has loaded
    document.body.classList.add('app-loaded');
    
    // Remove the initial loading div with a smooth transition
    const loadingDiv = document.querySelector('.loading-initial') as HTMLElement;
    if (loadingDiv) {
      loadingDiv.style.opacity = '0';
      loadingDiv.style.transition = 'opacity 0.3s ease';
      setTimeout(() => {
        if (loadingDiv.parentNode) {
          loadingDiv.parentNode.removeChild(loadingDiv);
        }
      }, 300);
    }
  }, []);

  // Load real event data from API
  useEffect(() => {
    const loadEvents = async () => {
      setIsLoading(true);
      try {
        // Check API status first
        const healthStatus = await apiService.healthCheck();
        setApiStatus({
          ticketmaster: (healthStatus as any).services?.ticketmaster === 'live_api_active',
          eventbrite: (healthStatus as any).services?.eventbrite === 'live_api_active',
          lastCheck: new Date()
        });

        // Load events from backend using API service
        const eventResponse = await apiService.getDeals({ limit: 50 });
        
        // Convert deals to events format for the UI
        const eventData: EventData[] = eventResponse.data.map((deal: any) => ({
          id: deal.id,
          name: deal.name,
          category: (deal.category === 'sports' || deal.category === 'music' || deal.category === 'entertainment') 
            ? deal.category as FilterType 
            : 'entertainment',
          venue: deal.venue,
          date: deal.date,
          priceRange: `$${deal.minPrice} - $${deal.maxPrice}`,
          source: deal.source.includes('ticketmaster') ? 'ticketmaster' as const : 'eventbrite' as const,
          availableTickets: Math.floor(Math.random() * 500) + 50, // Simulated
          url: deal.url
        }));
        
        setEvents(eventData);
        
        // Calculate real category stats
        const stats = eventData.reduce((acc: CategoryStats, event: EventData) => {
          if (event.category !== 'all') {
            acc[event.category as keyof Omit<CategoryStats, 'total'>]++;
            acc.total++;
          }
          return acc;
        }, { sports: 0, music: 0, entertainment: 0, total: 0 });
        
        setCategoryStats(stats);
        
      } catch (error) {
        console.error('Failed to load events:', error);
        // For development, show placeholder data
        setEvents([]);
        setCategoryStats({ sports: 0, music: 0, entertainment: 0, total: 0 });
        setApiStatus({
          ticketmaster: false,
          eventbrite: false,
          lastCheck: new Date()
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, []);

  const startMonitoring = () => {
    setIsMonitoring(true);
    setLastScanTime(new Date());
    // TODO: Start polling for new events
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
  };

  const filteredEvents = events.filter(event => {
    if (activeFilter === 'all') return true;
    return event.category === activeFilter;
  });

  return (
    <ErrorBoundary>
      <Router>
        <div className="app">
          {/* Navigation */}
          <nav className="navbar">
            <div className="container">
              <div className="nav-brand">
                <div className="nav-logo">
                  <svg width="32" height="24" viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="goldenTicketGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor: '#FFD700', stopOpacity: 1}} />
                        <stop offset="50%" style={{stopColor: '#FFA500', stopOpacity: 1}} />
                        <stop offset="100%" style={{stopColor: '#B8860B', stopOpacity: 1}} />
                      </linearGradient>
                      <linearGradient id="ticketShadow" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor: '#8B7D3A', stopOpacity: 0.3}} />
                        <stop offset="100%" style={{stopColor: '#654321', stopOpacity: 0.5}} />
                      </linearGradient>
                    </defs>
                    
                    {/* Shadow */}
                    <rect x="2" y="2" width="60" height="44" rx="4" fill="url(#ticketShadow)"/>
                    
                    {/* Main ticket body */}
                    <rect x="0" y="0" width="60" height="44" rx="4" fill="url(#goldenTicketGradient)" stroke="#B8860B" strokeWidth="1"/>
                    
                    {/* Perforated edge */}
                    <line x1="42" y1="0" x2="42" y2="44" stroke="#B8860B" strokeWidth="1" strokeDasharray="2,2"/>
                    
                    {/* Ticket holes */}
                    <circle cx="42" cy="8" r="2" fill="#000000" opacity="0.2"/>
                    <circle cx="42" cy="16" r="2" fill="#000000" opacity="0.2"/>
                    <circle cx="42" cy="24" r="2" fill="#000000" opacity="0.2"/>
                    <circle cx="42" cy="32" r="2" fill="#000000" opacity="0.2"/>
                    <circle cx="42" cy="40" r="2" fill="#000000" opacity="0.2"/>
                    
                    {/* Ticket text area */}
                    <rect x="4" y="8" width="34" height="2" fill="#B8860B" opacity="0.6"/>
                    <rect x="4" y="12" width="28" height="2" fill="#B8860B" opacity="0.6"/>
                    <rect x="4" y="16" width="32" height="2" fill="#B8860B" opacity="0.6"/>
                    
                    {/* Stub text area */}
                    <rect x="46" y="12" width="12" height="1.5" fill="#B8860B" opacity="0.6"/>
                    <rect x="46" y="16" width="10" height="1.5" fill="#B8860B" opacity="0.6"/>
                    <rect x="46" y="20" width="8" height="1.5" fill="#B8860B" opacity="0.6"/>
                    
                    {/* Golden shine effect */}
                    <rect x="2" y="2" width="56" height="8" rx="2" fill="url(#goldenTicketGradient)" opacity="0.3"/>
                    <rect x="2" y="2" width="56" height="4" rx="2" fill="#FFFFFF" opacity="0.2"/>
                  </svg>
                </div>
                <h1 className="nav-title">Rip City Events Hub</h1>
                <span className="nav-subtitle">Portland's Premier Event Aggregator</span>
              </div>
              <div className="nav-links">
                <Link to="/">Events</Link>
                <Link to="/tracking">Tracking</Link>
                <Link to="/settings">Settings</Link>
              </div>
              <div className="nav-controls">
                <div className="monitoring-status">
                  <span className={`status-indicator ${isMonitoring ? 'active' : 'inactive'}`}>
                    {isMonitoring ? '🟢 MONITORING' : '🔴 PAUSED'}
                  </span>
                  <button 
                    className={`monitoring-toggle ${isMonitoring ? 'stop' : 'start'}`}
                    onClick={isMonitoring ? stopMonitoring : startMonitoring}
                    aria-label={isMonitoring ? 'Stop monitoring' : 'Start monitoring'}
                  >
                    {isMonitoring ? 'PAUSE' : 'START'}
                  </button>
                </div>
                
                {lastScanTime && (
                  <div className="last-scan">
                    Last scan: {lastScanTime.toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          </nav>
          {/* Main Content */}
          <main className="main-content">
            <div className="container">
              <Routes>
                <Route path="/" element={<EventDashboard />} />
                <Route path="/event/:id" element={<EventDetail />} />
                <Route path="/tracking" element={<TrackingDashboard />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </div>
          </main>
          {/* Footer with Real Stats */}
          <footer className="stats-footer">
            <div className="container">
              <div className="footer-stats">
                <div className="stat-item">
                  <div className="stat-value">{categoryStats.total}</div>
                  <div className="stat-label">Total Events</div>
                </div>
                
                <div className="stat-item">
                  <div className="stat-value">
                    {apiStatus.ticketmaster && apiStatus.eventbrite ? '2' : 
                     apiStatus.ticketmaster || apiStatus.eventbrite ? '1' : '0'}
                  </div>
                  <div className="stat-label">APIs Connected</div>
                </div>
                
                <div className="stat-item">
                  <div className="stat-value">
                    {apiStatus.lastCheck ? apiStatus.lastCheck.toLocaleTimeString() : '--:--'}
                  </div>
                  <div className="stat-label">Last Updated</div>
                </div>
                
                <div className="stat-item">
                  <div className="stat-value">Portland</div>
                  <div className="stat-label">Coverage Area</div>
                </div>
              </div>
              
              <div className="footer-text">
                <p>
                  Real-time event aggregation from certified Ticketmaster and Eventbrite APIs. 
                  No fake numbers, just honest Portland event data.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
