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
      
      {/* Engaging advocacy section about life-changing wins */}
      <section style={{
        backgroundColor: '#001F3F',
        color: 'white',
        padding: '2rem',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #001F3F 0%, #003366 100%)'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            marginBottom: '1rem', 
            background: 'linear-gradient(45deg, #FFD700, #FFA500)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            🎉 Life-Changing Wins Happen Every Day! 🎉
          </h1>
          <p style={{ fontSize: '1.2rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            Every single day, players on Stake.us are winning incredible amounts that change their lives forever. 
            From paying off student loans to buying dream homes, our community celebrates real winners with real stories.
          </p>
          <div style={{ 
            backgroundColor: 'rgba(255, 215, 0, 0.1)', 
            border: '2px solid #FFD700', 
            borderRadius: '10px', 
            padding: '1.5rem', 
            margin: '1.5rem 0'
          }}>
            <h2 style={{ color: '#FFD700', marginBottom: '1rem' }}>🎁 Exclusive Welcome Bonus for New Players!</h2>
            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              When you sign up through our affiliate link, you'll receive:
            </p>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#FFD700' }}>
              💰 $50 Stake Cash + 💎 500,000 Gold Coins
            </div>
            <p style={{ fontSize: '0.9rem', marginTop: '1rem', opacity: '0.9' }}>
              This exclusive bonus gives you the perfect start to potentially win life-changing amounts!
            </p>
          </div>
          <a
            href="https://stake.us/?c=RIPCITYTICKETS"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              backgroundColor: '#FFD700',
              color: '#001F3F',
              padding: '1rem 2rem',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              textDecoration: 'none',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)'
            }}
          >
            🚀 Claim Your Welcome Bonus & Start Winning!
          </a>
        </div>
      </section>
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
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ color: '#001F3F', marginBottom: '0.5rem' }}>
              🏈 Upcoming Sporting Events & AI Predictions
            </h1>
            <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '1rem' }}>
              Get the edge with AI-powered odds while you explore life-changing opportunities at Stake.us!
            </p>
            <div style={{
              backgroundColor: '#e8f4fd',
              border: '1px solid #bee5eb',
              borderRadius: '5px',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <p style={{ margin: 0, color: '#0c5460', fontSize: '0.95rem' }}>
                💡 <strong>Pro Tip:</strong> While you're analyzing these predictions, why not take advantage of 
                your exclusive welcome bonus? New Stake.us players get $50 Stake Cash + 500,000 Gold Coins 
                when they sign up through our links!
              </p>
            </div>
          </div>
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
        {/* Right column: vertical banner with advocacy text. It's hidden on very narrow screens with maxWidth 768px */}
        <aside
          style={{
            flex: '0 0 300px',
            marginTop: '2rem',
          }}
        >
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            marginBottom: '1rem',
            border: '2px solid #FFD700'
          }}>
            <h3 style={{ color: '#001F3F', marginTop: 0, textAlign: 'center' }}>
              💎 Start Your Winning Journey!
            </h3>
            <p style={{ fontSize: '0.9rem', lineHeight: '1.5', color: '#333', marginBottom: '1rem' }}>
              Join the community where ordinary people win extraordinary amounts every single day. 
              Your life-changing moment could be just one play away!
            </p>
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '1rem',
              borderRadius: '5px',
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              <strong style={{ color: '#001F3F' }}>Your Welcome Bonus:</strong><br/>
              <span style={{ color: '#FFD700', fontSize: '1.1rem', fontWeight: 'bold' }}>
                $50 Stake Cash<br/>
                + 500,000 Gold Coins
              </span>
            </div>
          </div>
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
      {/* Footer with Stake logo and additional advocacy. Links to Stake via the referral code. */}
      <footer style={{ textAlign: 'center', padding: '2rem 0', backgroundColor: '#001F3F', color: '#fff' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ color: '#FFD700', marginBottom: '1rem' }}>Join Thousands of Daily Winners! 🏆</h3>
            <p style={{ marginBottom: '1rem' }}>
              Don't just watch from the sidelines – be part of the winning community where dreams become reality.
              Every day brings new opportunities for life-changing wins!
            </p>
            <p style={{ 
              fontSize: '1.1rem', 
              fontWeight: 'bold', 
              color: '#FFD700',
              marginBottom: '1rem'
            }}>
              Remember: New players get $50 Stake Cash + 500,000 Gold Coins!
            </p>
          </div>
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
            <span>Powered by Stake - Where Winners Are Made Daily</span>
          </a>
        </div>
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
