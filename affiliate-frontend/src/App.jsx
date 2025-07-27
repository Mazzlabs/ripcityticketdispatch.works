import React, { useEffect, useState } from 'react';
import EventCard from './components/EventCard';
import TrailBlazersSection from './components/TrailBlazersSection';
import EventFilters from './components/EventFilters';

/**
 * Main application component for the sports affiliate tracker.
 *
 * Enhanced with Ticketmaster integration, Trail Blazers focus,
 * event filtering, and improved analytics tracking.
 */
function App() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});
  const [syncStatus, setSyncStatus] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  // Fetch events from backend with current filters
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        limit: '50',
        ...filters
      });
      
      const res = await fetch(`/api/events?${queryParams}`);
      if (!res.ok) throw new Error('Failed to fetch events');
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      console.error(err);
      setError('Unable to load events');
    } finally {
      setLoading(false);
    }
  };

  // Handle Ticketmaster sync
  const handleTicketmasterSync = async () => {
    try {
      setSyncStatus('syncing');
      const res = await fetch('/api/ticketmaster/sync', { method: 'POST' });
      
      if (!res.ok) {
        throw new Error('Sync failed');
      }
      
      const data = await res.json();
      setSyncStatus(`synced-${data.synced}`);
      
      // Refresh events after sync
      setTimeout(() => {
        fetchEvents();
        setSyncStatus(null);
      }, 1000);
      
    } catch (err) {
      console.error('Sync error:', err);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus(null), 3000);
    }
  };

  // Handle affiliate click tracking
  const handleAffiliateClick = (event) => {
    console.log('Affiliate click tracked:', event.name);
    // Additional tracking logic can be added here
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', minHeight: '100vh', backgroundColor: '#f5f6fa' }}>
      {/* Enhanced Site Banner */}
      <header style={{ backgroundColor: '#001F3F', padding: '0', textAlign: 'center', position: 'relative' }}>
        <a
          href="https://stake.us/?c=RIPCITYTICKETS"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="/stake-banner-horizontal.gif"
            alt="Stake.us banner"
            style={{ width: '100%', height: 'auto', display: 'block', margin: 0 }}
          />
        </a>
        
        {/* Sync Button */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 10
        }}>
          <button
            onClick={handleTicketmasterSync}
            disabled={syncStatus === 'syncing'}
            style={{
              background: syncStatus === 'syncing' ? '#6c757d' : 
                         syncStatus?.startsWith('synced') ? '#28a745' :
                         syncStatus === 'error' ? '#dc3545' : '#007bff',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: '0.8rem',
              cursor: syncStatus === 'syncing' ? 'not-allowed' : 'pointer',
              fontWeight: '600'
            }}
          >
            {syncStatus === 'syncing' ? '🔄 Syncing...' :
             syncStatus?.startsWith('synced') ? `✅ Synced ${syncStatus.split('-')[1]} events` :
             syncStatus === 'error' ? '❌ Sync Failed' :
             '🎫 Sync Ticketmaster'}
          </button>
        </div>
      </header>

      {/* Main content area */}
      <main style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '1rem',
        gap: '1rem'
      }}>
        
        {/* Left column: events list */}
        <div style={{ flex: '1 1 auto', minWidth: 0 }}>
          
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '2rem',
            padding: '1rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: '8px'
          }}>
            <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem' }}>
              🏟️ Rip City Sports Tickets
            </h1>
            <p style={{ margin: 0, fontSize: '1.1rem', opacity: 0.9 }}>
              Your ultimate destination for Portland Trail Blazers & sports events
            </p>
          </div>

          {/* Trail Blazers Featured Section */}
          <TrailBlazersSection />

          {/* Event Filters */}
          <EventFilters 
            onFiltersChange={setFilters}
            currentFilters={filters}
          />

          {/* Events List */}
          <div>
            <h2 style={{ 
              color: '#333',
              borderBottom: '3px solid #007bff',
              paddingBottom: '0.5rem',
              marginBottom: '1rem'
            }}>
              🎯 All Sporting Events
              {Object.keys(filters).length > 0 && (
                <span style={{ 
                  fontSize: '0.8rem', 
                  color: '#666',
                  fontWeight: 'normal',
                  marginLeft: '0.5rem'
                }}>
                  (filtered)
                </span>
              )}
            </h2>
            
            {loading && (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem',
                background: 'white',
                borderRadius: '8px',
                border: '1px solid #ddd'
              }}>
                <p style={{ fontSize: '1.1rem', color: '#666' }}>🔄 Loading events…</p>
              </div>
            )}
            
            {error && (
              <div style={{ 
                padding: '1rem', 
                background: '#ffebee',
                color: '#c62828',
                borderRadius: '8px',
                border: '1px solid #ffcdd2',
                marginBottom: '1rem'
              }}>
                <strong>⚠️ {error}</strong>
              </div>
            )}
            
            {!loading && !error && events.length === 0 && (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem',
                background: 'white',
                borderRadius: '8px',
                border: '1px solid #ddd'
              }}>
                <h3>🔍 No events found</h3>
                <p style={{ color: '#666' }}>
                  {Object.keys(filters).length > 0 ? 
                    'Try adjusting your filters or check back soon!' :
                    'Check back soon for upcoming events!'
                  }
                </p>
              </div>
            )}
            
            {!loading && events.length > 0 && (
              <div>
                {events.map(event => (
                  <EventCard 
                    key={event._id || event.id} 
                    event={event}
                    onAffiliateClick={handleAffiliateClick}
                  />
                ))}
                
                {events.length >= 50 && (
                  <div style={{
                    textAlign: 'center',
                    padding: '1rem',
                    background: '#e3f2fd',
                    borderRadius: '8px',
                    margin: '1rem 0'
                  }}>
                    <p style={{ margin: 0, color: '#1976d2' }}>
                      📍 Showing first 50 events. Use filters to find specific games!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Right column: vertical banner and info */}
        <aside style={{
          flex: '0 0 300px',
          position: 'sticky',
          top: '1rem'
        }}>
          {/* Stake vertical banner */}
          <div style={{ marginBottom: '1rem' }}>
            <a
              href="https://stake.us/?c=RIPCITYTICKETS"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'block' }}
            >
              <img
                src="/stake-banner-vertical.gif"
                alt="Stake.us vertical banner"
                style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
              />
            </a>
          </div>

          {/* Quick Info Panel */}
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #ddd',
            marginBottom: '1rem'
          }}>
            <h3 style={{ 
              margin: '0 0 1rem 0',
              color: '#333',
              fontSize: '1.1rem'
            }}>
              🎯 Quick Info
            </h3>
            <ul style={{ 
              listStyle: 'none', 
              padding: 0, 
              margin: 0,
              fontSize: '0.9rem',
              lineHeight: '1.6'
            }}>
              <li>🏀 <strong>Trail Blazers</strong> games featured</li>
              <li>🎫 <strong>Ticketmaster</strong> integration</li>
              <li>🤖 <strong>AI-powered</strong> odds prediction</li>
              <li>📊 <strong>Real-time</strong> pricing</li>
              <li>💰 <strong>Affiliate</strong> rewards</li>
            </ul>
          </div>

          {/* Sports Categories */}
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}>
            <h3 style={{ 
              margin: '0 0 1rem 0',
              color: '#333',
              fontSize: '1.1rem'
            }}>
              🏆 Sports Leagues
            </h3>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {[
                { icon: '🏀', name: 'NBA Basketball' },
                { icon: '🏈', name: 'NFL Football' },
                { icon: '⚾', name: 'MLB Baseball' },
                { icon: '🏒', name: 'NHL Hockey' },
                { icon: '⚽', name: 'MLS Soccer' }
              ].map(sport => (
                <div key={sport.name} style={{
                  padding: '0.5rem',
                  background: '#f8f9fa',
                  borderRadius: '4px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: '#555'
                }}>
                  {sport.icon} {sport.name}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>

      {/* Enhanced Footer */}
      <footer style={{ 
        textAlign: 'center', 
        padding: '2rem 1rem', 
        backgroundColor: '#001F3F', 
        color: '#fff',
        marginTop: '2rem'
      }}>
        <div style={{ marginBottom: '1rem' }}>
          <a
            href="https://stake.us/?c=RIPCITYTICKETS"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <img
              src="/stake-logo.png"
              alt="Stake logo"
              style={{ height: '40px', marginRight: '0.5rem', verticalAlign: 'middle' }}
            />
            <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>Powered by Stake</span>
          </a>
        </div>
        <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
          <p style={{ margin: '0 0 0.5rem 0' }}>
            🏟️ Rip City Ticket Dispatch • Your Premier Sports Events Platform
          </p>
          <p style={{ margin: 0 }}>
            Featuring Portland Trail Blazers • AI-Powered Predictions • Secure Ticketmaster Integration
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
