import React, { useState } from 'react';

/**
 * EventFilters component for filtering sports events
 * 
 * Provides filtering options by league, team, and other criteria
 * with a responsive design.
 */
function EventFilters({ onFiltersChange, currentFilters = {} }) {
  const [filters, setFilters] = useState({
    league: '',
    team: '',
    featured: false,
    ...currentFilters
  });

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Call parent handler with cleaned filters (remove empty values)
    const cleanedFilters = Object.entries(newFilters)
      .filter(([_, val]) => val !== '' && val !== false)
      .reduce((acc, [key, val]) => ({ ...acc, [key]: val }), {});
    
    onFiltersChange(cleanedFilters);
  };

  const handleReset = () => {
    const resetFilters = { league: '', team: '', featured: false };
    setFilters(resetFilters);
    onFiltersChange({});
  };

  const leagues = [
    { value: 'NBA', label: '🏀 NBA Basketball' },
    { value: 'NFL', label: '🏈 NFL Football' },
    { value: 'MLB', label: '⚾ MLB Baseball' },
    { value: 'NHL', label: '🏒 NHL Hockey' },
    { value: 'MLS', label: '⚽ MLS Soccer' },
    { value: 'NCAA', label: '🎓 NCAA College Sports' }
  ];

  const popularTeams = [
    'Portland Trail Blazers',
    'Los Angeles Lakers',
    'Golden State Warriors',
    'Seattle Seahawks',
    'San Francisco 49ers',
    'Oakland Athletics',
    'Seattle Mariners',
    'Portland Timbers'
  ];

  return (
    <div style={{
      background: '#f8f9fa',
      padding: '1.5rem',
      borderRadius: '8px',
      marginBottom: '1.5rem',
      border: '1px solid #e9ecef'
    }}>
      <h3 style={{ 
        margin: '0 0 1rem 0', 
        color: '#333',
        fontSize: '1.2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        🔍 Filter Events
      </h3>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        alignItems: 'end'
      }}>
        
        {/* League Filter */}
        <div>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem',
            fontWeight: '600',
            color: '#555',
            fontSize: '0.9rem'
          }}>
            League
          </label>
          <select
            value={filters.league}
            onChange={(e) => handleFilterChange('league', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '0.9rem',
              background: 'white'
            }}
          >
            <option value="">All Leagues</option>
            {leagues.map(league => (
              <option key={league.value} value={league.value}>
                {league.label}
              </option>
            ))}
          </select>
        </div>

        {/* Team Filter */}
        <div>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem',
            fontWeight: '600',
            color: '#555',
            fontSize: '0.9rem'
          }}>
            Team
          </label>
          <select
            value={filters.team}
            onChange={(e) => handleFilterChange('team', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '0.9rem',
              background: 'white'
            }}
          >
            <option value="">All Teams</option>
            {popularTeams.map(team => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </div>

        {/* Featured Filter */}
        <div>
          <label style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600',
            color: '#555'
          }}>
            <input
              type="checkbox"
              checked={filters.featured}
              onChange={(e) => handleFilterChange('featured', e.target.checked)}
              style={{
                transform: 'scale(1.2)',
                accentColor: '#ff4444'
              }}
            />
            ⭐ Featured Events Only
          </label>
        </div>

        {/* Reset Button */}
        <div>
          <button
            onClick={handleReset}
            style={{
              background: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '600',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#5a6268';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#6c757d';
            }}
          >
            🔄 Reset Filters
          </button>
        </div>
      </div>

      {/* Active Filters Display */}
      {(filters.league || filters.team || filters.featured) && (
        <div style={{ 
          marginTop: '1rem',
          padding: '0.75rem',
          background: 'white',
          borderRadius: '4px',
          border: '1px solid #ddd'
        }}>
          <div style={{ 
            fontSize: '0.8rem', 
            color: '#666', 
            marginBottom: '0.5rem',
            fontWeight: '600'
          }}>
            Active Filters:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {filters.league && (
              <span style={{
                background: '#007bff',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                League: {filters.league}
              </span>
            )}
            {filters.team && (
              <span style={{
                background: '#28a745',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                Team: {filters.team}
              </span>
            )}
            {filters.featured && (
              <span style={{
                background: '#ff4444',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                ⭐ Featured
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default EventFilters;