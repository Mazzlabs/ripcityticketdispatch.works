/**
 * RIP CITY TICKET DISPATCH - Frontend Application
 * Copyright (c) 2024 Joseph Mazzini <joseph@mazzlabs.works>
 * All Rights Reserved. Proprietary Software.
 */

import React, { useState, useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner/LoadingSpinner';
import TicketCard from './components/TicketCard/TicketCard';
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
        const statusResponse = await fetch('/api/health');
        if (statusResponse.ok) {
          const status = await statusResponse.json();
          setApiStatus({
            ticketmaster: status.apis?.ticketmaster || false,
            eventbrite: status.apis?.eventbrite || false,
            lastCheck: new Date()
          });
        }

        // Load events from backend
        const eventsResponse = await fetch('/api/events');
        if (eventsResponse.ok) {
          const eventData = await eventsResponse.json();
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
        }
      } catch (error) {
        console.error('Failed to load events:', error);
        // For development, show placeholder data
        setEvents([]);
        setCategoryStats({ sports: 0, music: 0, entertainment: 0, total: 0 });
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
            {/* Events Overview Cards */}
            <section className="events-overview">
              <div className="overview-card sports">
                <span className="overview-icon">🏀</span>
                <h3 className="overview-title">Sports</h3>
                <div className="overview-count">{categoryStats.sports}</div>
                <p className="overview-label">Events Available</p>
              </div>
              
              <div className="overview-card music">
                <span className="overview-icon">🎵</span>
                <h3 className="overview-title">Music</h3>
                <div className="overview-count">{categoryStats.music}</div>
                <p className="overview-label">Concerts & Shows</p>
              </div>
              
              <div className="overview-card entertainment">
                <span className="overview-icon">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="weirdGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor: '#E03A3E', stopOpacity: 1}} />
                        <stop offset="100%" style={{stopColor: '#B8282D', stopOpacity: 1}} />
                      </linearGradient>
                    </defs>
                    
                    {/* Jackalope/deer body */}
                    <ellipse cx="16" cy="20" rx="6" ry="4" fill="url(#weirdGradient)" stroke="#000000" strokeWidth="0.5"/>
                    
                    {/* Head */}
                    <ellipse cx="16" cy="14" rx="4" ry="3" fill="url(#weirdGradient)" stroke="#000000" strokeWidth="0.5"/>
                    
                    {/* Antlers (more angular/weird) */}
                    <path d="M13 12L11 8L9 10" fill="none" stroke="#000000" strokeWidth="1" strokeLinecap="round"/>
                    <path d="M13 12L11 8L13 6" fill="none" stroke="#000000" strokeWidth="1" strokeLinecap="round"/>
                    <path d="M19 12L21 8L23 10" fill="none" stroke="#000000" strokeWidth="1" strokeLinecap="round"/>
                    <path d="M19 12L21 8L19 6" fill="none" stroke="#000000" strokeWidth="1" strokeLinecap="round"/>
                    
                    {/* Eyes (quirky) */}
                    <circle cx="14" cy="14" r="1" fill="#000000"/>
                    <circle cx="18" cy="14" r="1" fill="#000000"/>
                    <circle cx="14.3" cy="13.7" r="0.3" fill="#FFFFFF"/>
                    <circle cx="18.3" cy="13.7" r="0.3" fill="#FFFFFF"/>
                    
                    {/* Nose */}
                    <ellipse cx="16" cy="16" rx="0.5" ry="0.3" fill="#000000"/>
                    
                    {/* Legs (simple) */}
                    <rect x="12" y="22" width="1" height="4" fill="#000000"/>
                    <rect x="15" y="22" width="1" height="4" fill="#000000"/>
                    <rect x="17" y="22" width="1" height="4" fill="#000000"/>
                    <rect x="20" y="22" width="1" height="4" fill="#000000"/>
                    
                    {/* Tail */}
                    <circle cx="22" cy="20" r="1.5" fill="url(#weirdGradient)" stroke="#000000" strokeWidth="0.5"/>
                    
                    {/* Oregon state outline (subtle) */}
                    <path d="M2 28L4 26L6 28L8 26L10 28L8 30L6 28L4 30L2 28Z" fill="none" stroke="#E03A3E" strokeWidth="0.5" opacity="0.6"/>
                  </svg>
                </span>
                <h3 className="overview-title">Entertainment</h3>
                <div className="overview-count">{categoryStats.entertainment}</div>
                <p className="overview-label">Theatre & Comedy</p>
              </div>
            </section>

            {/* Filter Section */}
            <section className="filter-section">
              <div className="filter-controls">
                <h3>Browse Events</h3>
                <div className="filter-buttons">
                  <button 
                    className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('all')}
                  >
                    All Events
                    <span className="filter-count">{categoryStats.total}</span>
                  </button>
                  <button 
                    className={`filter-btn ${activeFilter === 'sports' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('sports')}
                    data-filter="sports"
                  >
                    🏀 Sports
                    <span className="filter-count">{categoryStats.sports}</span>
                  </button>
                  <button 
                    className={`filter-btn ${activeFilter === 'music' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('music')}
                    data-filter="music"
                  >
                    🎵 Music
                    <span className="filter-count">{categoryStats.music}</span>
                  </button>
                  <button 
                    className={`filter-btn ${activeFilter === 'entertainment' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('entertainment')}
                  >
                    <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{display: 'inline-block', marginRight: '8px', verticalAlign: 'middle'}}>
                      <defs>
                        <linearGradient id="weirdGradientFilter" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style={{stopColor: '#E03A3E', stopOpacity: 1}} />
                          <stop offset="100%" style={{stopColor: '#B8282D', stopOpacity: 1}} />
                        </linearGradient>
                      </defs>
                      
                      {/* Jackalope/deer body */}
                      <ellipse cx="16" cy="20" rx="6" ry="4" fill="url(#weirdGradientFilter)" stroke="#000000" strokeWidth="0.5"/>
                      
                      {/* Head */}
                      <ellipse cx="16" cy="14" rx="4" ry="3" fill="url(#weirdGradientFilter)" stroke="#000000" strokeWidth="0.5"/>
                      
                      {/* Antlers (more angular/weird) */}
                      <path d="M13 12L11 8L9 10" fill="none" stroke="#000000" strokeWidth="1" strokeLinecap="round"/>
                      <path d="M13 12L11 8L13 6" fill="none" stroke="#000000" strokeWidth="1" strokeLinecap="round"/>
                      <path d="M19 12L21 8L23 10" fill="none" stroke="#000000" strokeWidth="1" strokeLinecap="round"/>
                      <path d="M19 12L21 8L19 6" fill="none" stroke="#000000" strokeWidth="1" strokeLinecap="round"/>
                      
                      {/* Eyes (quirky) */}
                      <circle cx="14" cy="14" r="1" fill="#000000"/>
                      <circle cx="18" cy="14" r="1" fill="#000000"/>
                      <circle cx="14.3" cy="13.7" r="0.3" fill="#FFFFFF"/>
                      <circle cx="18.3" cy="13.7" r="0.3" fill="#FFFFFF"/>
                      
                      {/* Nose */}
                      <ellipse cx="16" cy="16" rx="0.5" ry="0.3" fill="#000000"/>
                      
                      {/* Legs (simple) */}
                      <rect x="12" y="22" width="1" height="4" fill="#000000"/>
                      <rect x="15" y="22" width="1" height="4" fill="#000000"/>
                      <rect x="17" y="22" width="1" height="4" fill="#000000"/>
                      <rect x="20" y="22" width="1" height="4" fill="#000000"/>
                      
                      {/* Tail */}
                      <circle cx="22" cy="20" r="1.5" fill="url(#weirdGradientFilter)" stroke="#000000" strokeWidth="0.5"/>
                      
                      {/* Oregon state outline (subtle) */}
                      <path d="M2 28L4 26L6 28L8 26L10 28L8 30L6 28L4 30L2 28Z" fill="none" stroke="#E03A3E" strokeWidth="0.5" opacity="0.6"/>
                    </svg>
                    Entertainment
                    <span className="filter-count">{categoryStats.entertainment}</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Events Section */}
            <section className="deals-section">
              <div className="container">
                {isLoading ? (
                  <LoadingSpinner message="Loading events..." />
                ) : filteredEvents.length > 0 ? (
                  <div className="deals-grid">
                    {filteredEvents.map((event, index) => (
                      <TicketCard
                        key={event.id}
                        index={index}
                        deal={{
                          id: event.id,
                          name: event.name,
                          venue: event.venue,
                          city: 'Portland',
                          date: event.date,
                          url: event.url,
                          minPrice: 0, // Will be parsed from priceRange
                          maxPrice: 0, // Will be parsed from priceRange
                          currency: 'USD',
                          dealScore: 0, // Remove fake scoring
                          category: event.category,
                          source: event.source,
                          savings: '', // Remove fake savings
                          originalPrice: 0,
                          isFree: event.priceRange.toLowerCase().includes('free'),
                          description: `${event.availableTickets} tickets available`
                        }}
                        onPurchase={() => window.open(event.url, '_blank')}
                        onSave={() => console.log('Save feature coming soon')}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="no-deals-message">
                    <h3>No events found</h3>
                    <p>
                      {activeFilter === 'all' 
                        ? 'No events are currently available. Check back soon!'
                        : `No ${activeFilter} events found. Try a different category.`
                      }
                    </p>
                  </div>
                )}
              </div>
            </section>
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
    </ErrorBoundary>
  );
}

export default App;
