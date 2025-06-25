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
              <span className="nav-logo">🎫</span>
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
                <span className="overview-icon">🎭</span>
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
                    🎭 Entertainment
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
