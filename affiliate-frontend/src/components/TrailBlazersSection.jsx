import React, { useState, useEffect } from 'react';

/**
 * Trail Blazers dedicated section component
 * 
 * Features Portland Trail Blazers events prominently with
 * special styling and team-specific information.
 */
function TrailBlazersSection() {
  const [blazersData, setBlazersData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTrailBlazersData();
  }, []);

  const fetchTrailBlazersData = async () => {
    try {
      const response = await fetch('/api/teams/trail-blazers');
      if (!response.ok) throw new Error('Failed to fetch Trail Blazers data');
      const data = await response.json();
      setBlazersData(data);
    } catch (err) {
      console.error('Error fetching Trail Blazers data:', err);
      setError('Unable to load Trail Blazers events');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center',
        background: 'linear-gradient(135deg, #ff0000 0%, #000000 100%)',
        color: 'white',
        borderRadius: '8px',
        margin: '1rem 0'
      }}>
        <h2>🏀 Loading Trail Blazers Events...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center',
        background: '#ffebee',
        color: '#c62828',
        borderRadius: '8px',
        margin: '1rem 0',
        border: '1px solid #ffcdd2'
      }}>
        <h3>⚠️ {error}</h3>
      </div>
    );
  }

  const { localEvents = [], ticketmasterEvents = [], totalEvents } = blazersData || {};

  return (
    <div style={{
      background: 'linear-gradient(135deg, #ff0000 0%, #000000 100%)',
      color: 'white',
      padding: '2rem',
      borderRadius: '12px',
      margin: '2rem 0',
      boxShadow: '0 8px 24px rgba(255,0,0,0.3)'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          margin: '0 0 0.5rem 0',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
        }}>
          🏀 PORTLAND TRAIL BLAZERS
        </h1>
        <p style={{ 
          fontSize: '1.2rem', 
          margin: 0, 
          opacity: 0.9 
        }}>
          Rip City's Finest • NBA Basketball
        </p>
        {totalEvents > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.2)',
            padding: '8px 16px',
            borderRadius: '20px',
            display: 'inline-block',
            marginTop: '1rem',
            fontSize: '0.9rem'
          }}>
            📅 {totalEvents} Upcoming Games
          </div>
        )}
      </div>

      {/* Local Events */}
      {localEvents.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ 
            borderBottom: '2px solid rgba(255,255,255,0.3)', 
            paddingBottom: '0.5rem',
            marginBottom: '1rem'
          }}>
            🏠 Upcoming Home & Away Games
          </h3>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {localEvents.slice(0, 5).map((event) => (
              <div key={event._id} style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>
                      {event.name}
                    </h4>
                    <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem' }}>
                      📍 {event.location || 'TBA'} • 📅 {new Date(event.date).toLocaleDateString()}
                    </p>
                  </div>
                  {event.affiliateLink && (
                    <a
                      href={event.affiliateLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: 'rgba(255,255,255,0.9)',
                        color: '#ff0000',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'white';
                        e.target.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(255,255,255,0.9)';
                        e.target.style.transform = 'scale(1)';
                      }}
                    >
                      🎫 Get Tickets
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ticketmaster Events Preview */}
      {ticketmasterEvents.length > 0 && (
        <div>
          <h3 style={{ 
            borderBottom: '2px solid rgba(255,255,255,0.3)', 
            paddingBottom: '0.5rem',
            marginBottom: '1rem'
          }}>
            🎟️ Live Ticketmaster Events
          </h3>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {ticketmasterEvents.slice(0, 3).map((event, idx) => (
              <div key={event.id || idx} style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '0.75rem',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.1)',
                fontSize: '0.9rem'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                  {event.name}
                </div>
                <div style={{ opacity: 0.8 }}>
                  📅 {event.dates?.start?.localDate || 'TBA'} • 
                  🏟️ {event._embedded?.venues?.[0]?.name || 'TBA'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No events message */}
      {localEvents.length === 0 && ticketmasterEvents.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '8px'
        }}>
          <h3>🔍 No upcoming games found</h3>
          <p style={{ opacity: 0.8 }}>Check back soon for the latest Trail Blazers schedule!</p>
        </div>
      )}

      {/* Team Stats/Info Footer */}
      <div style={{
        marginTop: '1.5rem',
        padding: '1rem',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>
          🏆 Follow the Portland Trail Blazers in the NBA • Est. 1970 • Moda Center
        </p>
      </div>
    </div>
  );
}

export default TrailBlazersSection;