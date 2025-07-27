import React, { useEffect, useState } from 'react';

/**
 * Main application component for the sports affiliate tracker.
 *
 * This component fetches all events from the backend and renders them in
 * simple cards. Each card displays the event metadata (name, league,
 * date, teams) and, when available, the AI‑generated win probabilities.
 * A Stake.us banner is displayed at the top of the page; clicking the
 * banner can be configured to use your affiliate tracking link.
 */
function App() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch events from the backend API. The API URL is configurable via
    // environment variables for different deployment environments.
    async function fetchEvents() {
      try {
        const apiUrl = process.env.REACT_APP_API_URL || '';
        const res = await fetch(`${apiUrl}/api/events`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: Failed to fetch events`);
        }
        const data = await res.json();
        setEvents(data);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError(`Unable to load events: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', minHeight: '100vh', backgroundColor: '#F5F5F5' }}>
      {/* Site banner. Use the animated horizontal GIF and include the referral code RIPCITYTICKETS. */}
      <header style={{ backgroundColor: '#001F3F', padding: '0', textAlign: 'center' }}>
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
      </header>
      {/* Main content area. We use flexbox to position the vertical banner next to the event list on larger screens. */}
      <main
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '1rem',
        }}
      >
        {/* Left column: events list */}
        <div style={{ flex: '1 1 auto', marginRight: '1rem' }}>
          <h1>Upcoming Sporting Events</h1>
          {loading && <p>Loading events…</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {!loading && !error && events.length === 0 && <p>No events found. Check back soon!</p>}
          {!loading && events.length > 0 && (
            <div>
              {events.map(event => (
                <EventCard key={event._id || event.id} event={event} />
              ))}
            </div>
          )}
        </div>
        {/* Right column: vertical banner. It's hidden on very narrow screens with maxWidth 768px */}
        <aside
          style={{
            flex: '0 0 300px',
            marginTop: '2rem',
          }}
        >
          <a
            href="https://stake.us/?c=RIPCITYTICKETS"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'block' }}
          >
            <img
              src="/stake-banner-vertical.gif"
              alt="Stake.us vertical banner"
              style={{ width: '100%', height: 'auto' }}
            />
          </a>
        </aside>
      </main>
      {/* Footer with Stake logo. Links to Stake via the referral code. */}
      <footer style={{ textAlign: 'center', padding: '1rem 0', backgroundColor: '#001F3F', color: '#fff' }}>
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
          <span>Powered by Stake</span>
        </a>
      </footer>
    </div>
  );
}

/**
 * Individual event card component.
 *
 * Displays the event name, league, date, teams and, if present, the odds.
 */
function EventCard({ event }) {
  const formattedDate = new Date(event.date).toLocaleString();
  return (
    <div style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '1rem', marginBottom: '1rem', background: '#fff' }}>
      <h2 style={{ marginTop: 0 }}>{event.name}</h2>
      <p><strong>League:</strong> {event.league}</p>
      <p><strong>Date:</strong> {formattedDate}</p>
      <p><strong>Teams:</strong> {Array.isArray(event.teams) ? event.teams.join(' vs ') : ''}</p>
      {event.odds && Object.keys(event.odds).length > 0 ? (
        <div>
          <h3>Predicted Win Probabilities</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {Object.entries(event.odds).map(([team, prob]) => (
              <li key={team}>{team}: {prob}%</li>
            ))}
          </ul>
        </div>
      ) : (
        <p>Odds are being calculated… please refresh the page shortly.</p>
      )}
      {event.affiliateLink && (
        <p>
          <a href={event.affiliateLink} target="_blank" rel="noopener noreferrer">
            Purchase Tickets
          </a>
        </p>
      )}
    </div>
  );
}

export default App;
