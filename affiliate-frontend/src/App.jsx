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
    // Fetch events from the backend API. The frontend assumes that
    // requests made relative to its own origin will be proxied by the
    // development server to the Express backend (see package.json proxy).
    async function fetchEvents() {
      try {
        const res = await fetch('/api/events');
        if (!res.ok) throw new Error('Failed to fetch events');
        const data = await res.json();
        setEvents(data);
      } catch (err) {
        console.error(err);
        setError('Unable to load events');
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
          <h1>Find These Events and More on Stake.us!</h1>
          <div style={{ 
            background: '#001F3F', 
            color: 'white', 
            padding: '1rem', 
            borderRadius: '8px', 
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            <h2 style={{ margin: '0 0 0.5rem 0' }}>🎯 Ready to Bet?</h2>
            <p style={{ margin: '0 0 1rem 0' }}>Head over to Stake.us for the best odds, live betting, and exclusive promotions!</p>
            <a
              href="https://stake.us/?c=RIPCITYTICKETS"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: '#28a745',
                color: 'white',
                padding: '12px 24px',
                textDecoration: 'none',
                borderRadius: '5px',
                fontWeight: 'bold',
                fontSize: '18px',
                display: 'inline-block'
              }}
            >
              🚀 PLAY NOW ON STAKE.US
            </a>
          </div>
          {loading && <p>Loading featured events…</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {!loading && !error && events.length === 0 && <p>Check out the latest events on Stake.us!</p>}
          {!loading && events.length > 0 && (
            <div>
              <p style={{ fontSize: '16px', marginBottom: '1rem', fontStyle: 'italic' }}>
                Preview some upcoming events below, then head to Stake.us to place your bets:
              </p>
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
 * Displays basic event information and directs users to stake.us for betting.
 */
function EventCard({ event }) {
  const formattedDate = new Date(event.date).toLocaleString();
  return (
    <div style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '1rem', marginBottom: '1rem', background: '#fff' }}>
      <h2 style={{ marginTop: 0, color: '#001F3F' }}>{event.name}</h2>
      <p><strong>League:</strong> {event.league}</p>
      <p><strong>Date:</strong> {formattedDate}</p>
      <p><strong>Teams:</strong> {Array.isArray(event.teams) ? event.teams.join(' vs ') : ''}</p>
      
      <div style={{ 
        background: '#f8f9fa', 
        padding: '1rem', 
        borderRadius: '5px', 
        marginTop: '1rem',
        textAlign: 'center'
      }}>
        <p style={{ margin: '0 0 1rem 0', fontWeight: 'bold', color: '#001F3F' }}>
          🎲 Want to bet on this game?
        </p>
        <a
          href="https://stake.us/?c=RIPCITYTICKETS"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: '#001F3F',
            color: 'white',
            padding: '10px 20px',
            textDecoration: 'none',
            borderRadius: '5px',
            fontWeight: 'bold',
            display: 'inline-block'
          }}
        >
          🏆 Bet on Stake.us
        </a>
      </div>
      
      {event.affiliateLink && (
        <p style={{ marginTop: '1rem', fontSize: '14px' }}>
          <a href={event.affiliateLink} target="_blank" rel="noopener noreferrer">
            Purchase Tickets
          </a>
        </p>
      )}
    </div>
  );
}

export default App;
