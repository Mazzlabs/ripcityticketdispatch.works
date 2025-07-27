import React from 'react';

/**
 * Enhanced EventCard component with Ticketmaster integration
 * 
 * Displays event information with improved UI, price ranges,
 * affiliate link tracking, and venue details.
 */
function EventCard({ event, onAffiliateClick }) {
  const formattedDate = new Date(event.date).toLocaleString();
  const hasTicketmasterData = event.ticketmaster && event.ticketmaster.id;
  
  // Handle affiliate link click tracking
  const handleAffiliateClick = async (e) => {
    e.preventDefault();
    
    try {
      // Track click
      await fetch(`/api/events/${event._id}/click`, { method: 'POST' });
      
      // Call parent handler if provided
      if (onAffiliateClick) {
        onAffiliateClick(event);
      }
      
      // Open affiliate link
      if (event.affiliateLink) {
        window.open(event.affiliateLink, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Failed to track click:', error);
      // Still open the link even if tracking fails
      if (event.affiliateLink) {
        window.open(event.affiliateLink, '_blank', 'noopener,noreferrer');
      }
    }
  };

  return (
    <div style={{ 
      border: '1px solid #ddd', 
      borderRadius: '8px', 
      padding: '1.5rem', 
      marginBottom: '1rem', 
      background: event.featured ? 'linear-gradient(135deg, #fff 0%, #f8f9ff 100%)' : '#fff',
      boxShadow: event.featured ? '0 4px 12px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)',
      position: 'relative'
    }}>
      {/* Featured badge */}
      {event.featured && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: '#ff4444',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '0.75rem',
          fontWeight: 'bold'
        }}>
          FEATURED
        </div>
      )}
      
      <h2 style={{ 
        marginTop: 0, 
        marginBottom: '0.5rem',
        color: '#333',
        fontSize: event.featured ? '1.5rem' : '1.25rem'
      }}>
        {event.name}
      </h2>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <strong>League:</strong> 
          <span style={{ 
            background: '#007bff', 
            color: 'white', 
            padding: '2px 6px', 
            borderRadius: '4px', 
            marginLeft: '4px',
            fontSize: '0.85rem'
          }}>
            {event.league}
          </span>
        </div>
        <div><strong>Date:</strong> {formattedDate}</div>
      </div>
      
      <div style={{ marginBottom: '1rem' }}>
        <strong>Teams:</strong> 
        <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#444', marginTop: '4px' }}>
          {Array.isArray(event.teams) ? event.teams.join(' vs ') : event.teams}
        </div>
      </div>

      {/* Venue information for Ticketmaster events */}
      {hasTicketmasterData && event.ticketmaster.venue?.name && (
        <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f8f9fa', borderRadius: '4px' }}>
          <strong>Venue:</strong> {event.ticketmaster.venue.name}
          {event.ticketmaster.venue.city && (
            <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '2px' }}>
              {event.ticketmaster.venue.city}, {event.ticketmaster.venue.state}
            </div>
          )}
        </div>
      )}

      {/* Price ranges for Ticketmaster events */}
      {hasTicketmasterData && event.ticketmaster.priceRanges?.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <strong>Price Range:</strong>
          <div style={{ marginTop: '4px' }}>
            {event.ticketmaster.priceRanges.map((range, idx) => (
              <span key={idx} style={{ 
                display: 'inline-block',
                background: '#28a745',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                marginRight: '8px',
                fontSize: '0.9rem'
              }}>
                {range.currency} ${range.min} - ${range.max}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* AI-generated odds */}
      {event.odds && Object.keys(event.odds).length > 0 ? (
        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#444' }}>
            🎯 AI Predicted Win Probabilities
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {Object.entries(event.odds).map(([team, prob]) => (
              <div key={team} style={{
                background: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '0.9rem'
              }}>
                {team}: {prob}%
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p style={{ color: '#666', fontStyle: 'italic', marginBottom: '1rem' }}>
          🔄 AI odds are being calculated… please refresh shortly.
        </p>
      )}

      {/* Analytics info */}
      {(event.views > 0 || event.clicks > 0) && (
        <div style={{ 
          fontSize: '0.8rem', 
          color: '#666', 
          marginBottom: '1rem',
          display: 'flex',
          gap: '1rem'
        }}>
          {event.views > 0 && <span>👁 {event.views} views</span>}
          {event.clicks > 0 && <span>🖱 {event.clicks} clicks</span>}
        </div>
      )}

      {/* Purchase tickets button */}
      {event.affiliateLink && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={handleAffiliateClick}
            style={{
              background: 'linear-gradient(135deg, #ff6b35 0%, #ff8e53 100%)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'inline-block',
              transition: 'transform 0.2s ease',
              boxShadow: '0 2px 4px rgba(255,107,53,0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 8px rgba(255,107,53,0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 4px rgba(255,107,53,0.3)';
            }}
          >
            🎫 Purchase Tickets
          </button>
          {hasTicketmasterData && (
            <span style={{ 
              fontSize: '0.8rem', 
              color: '#666',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <img 
                src="https://www.ticketmaster.com/h/favicon.ico" 
                alt="Ticketmaster" 
                style={{ width: '16px', height: '16px' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              via Ticketmaster
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default EventCard;