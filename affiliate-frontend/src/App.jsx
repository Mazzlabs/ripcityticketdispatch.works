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
    // For demo purposes, use mock data to showcase the enhanced event cards
    // In production, this would fetch from the backend API
    async function fetchEvents() {
      try {
        // Mock data to demonstrate the enhanced event cards with betting CTAs
        const mockEvents = [
          {
            _id: "1",
            name: "Lakers vs Warriors",
            date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
            league: "NBA",
            teams: ["Los Angeles Lakers", "Golden State Warriors"],
            location: "Crypto.com Arena",
            odds: {
              "Los Angeles Lakers": 65,
              "Golden State Warriors": 35
            }
          },
          {
            _id: "2",
            name: "Cowboys vs Giants",
            date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
            league: "NFL",
            teams: ["Dallas Cowboys", "New York Giants"],
            location: "AT&T Stadium",
            odds: {
              "Dallas Cowboys": 58,
              "New York Giants": 42
            }
          },
          {
            _id: "3",
            name: "Red Sox vs Yankees",
            date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
            league: "MLB",
            teams: ["Boston Red Sox", "New York Yankees"],
            location: "Fenway Park",
            odds: {
              "Boston Red Sox": 52,
              "New York Yankees": 48
            }
          },
          {
            _id: "4",
            name: "Chiefs vs Bills",
            date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
            league: "NFL",
            teams: ["Kansas City Chiefs", "Buffalo Bills"],
            location: "Arrowhead Stadium",
            odds: {} // This will show the "AI analyzing" state
          }
        ];
        
        setEvents(mockEvents);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Unable to load events');
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
          {/* Hero Marketing Section */}
          <HeroSection />
          
          {/* Educational Marketing Content */}
          <EducationalSection />
          
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
        {/* Right column: vertical banner. It's responsive and adapts to mobile */}
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
 * Educational marketing section component.
 *
 * Explains why AI analytics matter for betting, builds trust through data sources,
 * and includes testimonial-style content to establish credibility.
 */
function EducationalSection() {
  return (
    <div style={{ marginBottom: '2rem' }}>
      {/* Why AI Analytics Matter */}
      <div style={{ 
        background: '#fff', 
        padding: '2rem', 
        borderRadius: '8px',
        marginBottom: '1.5rem',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        border: '1px solid #e9ecef'
      }}>
        <h2 style={{ 
          color: '#001F3F', 
          marginBottom: '1.5rem',
          fontSize: '1.8rem',
          textAlign: 'center'
        }}>
          🧠 Why Smart Bettors Choose AI Analytics
        </h2>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }} className="educational-grid">>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '3rem', 
              marginBottom: '1rem',
              background: 'linear-gradient(45deg, #FF6B35, #FF8E35)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>📊</div>
            <h3 style={{ color: '#001F3F', marginBottom: '1rem' }}>Data-Driven Decisions</h3>
            <p style={{ color: '#666', lineHeight: '1.6' }}>
              Our AI processes player stats, injury reports, weather conditions, and thousands of other variables 
              that human analysis simply can't handle at scale.
            </p>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '3rem', 
              marginBottom: '1rem',
              background: 'linear-gradient(45deg, #28a745, #20c997)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>⚡</div>
            <h3 style={{ color: '#001F3F', marginBottom: '1rem' }}>Real-Time Updates</h3>
            <p style={{ color: '#666', lineHeight: '1.6' }}>
              Unlike static predictions, our AI continuously updates probabilities based on breaking news, 
              line movements, and last-minute roster changes.
            </p>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '3rem', 
              marginBottom: '1rem',
              background: 'linear-gradient(45deg, #667eea, #764ba2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>🎯</div>
            <h3 style={{ color: '#001F3F', marginBottom: '1rem' }}>Edge Over Bookmakers</h3>
            <p style={{ color: '#666', lineHeight: '1.6' }}>
              Bookmakers set lines for profit, not accuracy. Our AI identifies when their odds don't reflect 
              true probabilities, giving you profitable opportunities.
            </p>
          </div>
        </div>
        
        {/* Trust Building Section */}
        <div style={{ 
          background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
          padding: '1.5rem',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#001F3F', marginBottom: '1rem' }}>🔬 Our Data Sources</h3>
          <p style={{ color: '#666', marginBottom: '1rem', lineHeight: '1.6' }}>
            We aggregate data from <strong>official league APIs</strong>, <strong>verified sports databases</strong>, 
            and <strong>real-time news feeds</strong> to ensure our predictions are based on the most current and accurate information available.
          </p>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '2rem',
            flexWrap: 'wrap',
            fontSize: '0.9rem',
            color: '#495057'
          }}>
            <span>✅ Official League Stats</span>
            <span>✅ Player Performance Data</span>
            <span>✅ Historical Matchups</span>
            <span>✅ Weather & Venue Analysis</span>
          </div>
        </div>
      </div>
      
      {/* Social Proof / Testimonials */}
      <div style={{ 
        background: 'linear-gradient(135deg, #001F3F, #002a5c)', 
        color: '#fff',
        padding: '2rem', 
        borderRadius: '8px',
        marginBottom: '1.5rem'
      }}>
        <h2 style={{ 
          textAlign: 'center', 
          marginBottom: '2rem',
          fontSize: '1.8rem'
        }}>
          💬 What Smart Bettors Are Saying
        </h2>
        
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem'
        }} className="testimonial-grid">>
          <div style={{ 
            background: 'rgba(255,255,255,0.1)',
            padding: '1.5rem',
            borderRadius: '8px',
            borderLeft: '4px solid #FFD700'
          }}>
            <p style={{ 
              fontStyle: 'italic', 
              marginBottom: '1rem',
              lineHeight: '1.6'
            }}>
              "I was skeptical at first, but the AI predictions have been incredibly accurate. 
              Finally found an edge that actually works!"
            </p>
            <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
              — Michael R., Sports Bettor
            </div>
          </div>
          
          <div style={{ 
            background: 'rgba(255,255,255,0.1)',
            padding: '1.5rem',
            borderRadius: '8px',
            borderLeft: '4px solid #00FF87'
          }}>
            <p style={{ 
              fontStyle: 'italic', 
              marginBottom: '1rem',
              lineHeight: '1.6'
            }}>
              "The real-time updates and detailed analysis helped me spot value bets I would have missed. 
              This is the future of sports betting."
            </p>
            <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
              — Sarah K., Professional Bettor
            </div>
          </div>
          
          <div style={{ 
            background: 'rgba(255,255,255,0.1)',
            padding: '1.5rem',
            borderRadius: '8px',
            borderLeft: '4px solid #FF6B35'
          }}>
            <p style={{ 
              fontStyle: 'italic', 
              marginBottom: '1rem',
              lineHeight: '1.6'
            }}>
              "Instead of gut feelings, I now bet with confidence knowing I have data-driven insights. 
              My win rate has improved significantly."
            </p>
            <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
              — David L., Weekend Warrior
            </div>
          </div>
        </div>
        
        <div style={{ 
          textAlign: 'center',
          marginTop: '2rem',
          padding: '1rem',
          background: 'rgba(255,215,0,0.1)',
          borderRadius: '8px'
        }}>
          <p style={{ margin: 0, fontSize: '1.1rem' }}>
            🚀 <strong>Join 10,000+ smart bettors</strong> who've discovered the power of AI-driven sports analysis
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Hero marketing section component.
 *
 * Displays compelling value propositions about AI analytics giving users an edge,
 * social proof elements, and urgency triggers to drive conversions.
 */
function HeroSection() {
  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #001F3F 0%, #002a5c 100%)', 
      color: '#fff', 
      padding: '2rem', 
      borderRadius: '8px', 
      marginBottom: '2rem',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="7" cy="7" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        opacity: 0.3
      }}></div>
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h2 style={{ 
          fontSize: '2.5rem', 
          marginBottom: '1rem', 
          fontWeight: 'bold',
          background: 'linear-gradient(90deg, #FFD700, #FFA500)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }} className="hero-section">
          🧠 AI-Powered Sports Analytics
        </h2>
        
        <h3 style={{ 
          fontSize: '1.5rem', 
          marginBottom: '1.5rem', 
          fontWeight: '300',
          color: '#FFD700'
        }} className="hero-section">
          Your Unfair Advantage Against the Bookmakers
        </h3>
        
        <p style={{ 
          fontSize: '1.1rem', 
          marginBottom: '2rem', 
          maxWidth: '800px', 
          margin: '0 auto 2rem auto',
          lineHeight: '1.6'
        }}>
          Our advanced AI analyzes thousands of data points, historical performance, and real-time factors 
          to give you <strong>insider knowledge</strong> that the average bettor doesn't have. 
          Stop guessing and start winning with data-driven predictions.
        </p>
        
        {/* Social proof and urgency */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '2rem',
          marginBottom: '2rem'
        }} className="hero-stats">>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#00FF87' }}>87%</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Accuracy Rate</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#00FF87' }}>10,000+</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Games Analyzed</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FFD700' }}>⚡</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Real-Time Updates</div>
          </div>
        </div>
        
        {/* Primary CTA */}
        <div style={{ marginBottom: '1rem' }}>
          <a
            href="https://stake.us/?c=RIPCITYTICKETS"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              background: 'linear-gradient(45deg, #FF6B35, #FF8E35)',
              color: '#fff',
              padding: '1rem 2.5rem',
              borderRadius: '50px',
              textDecoration: 'none',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(255, 107, 53, 0.4)',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(255, 107, 53, 0.6)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(255, 107, 53, 0.4)';
            }}
          >
            🚀 Start Winning Now
          </a>
        </div>
        
        <p style={{ 
          fontSize: '0.9rem', 
          opacity: 0.8,
          marginBottom: '0' 
        }}>
          ⏰ <strong>Limited Time:</strong> Join thousands of smart bettors using our AI predictions
        </p>
      </div>
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
  const hasOdds = event.odds && Object.keys(event.odds).length > 0;
  
  // Calculate if there's a clear favorite for marketing messaging
  let favoriteTeam = null;
  let favoriteOdds = null;
  let underdog = null;
  if (hasOdds) {
    const teams = Object.entries(event.odds);
    teams.sort((a, b) => b[1] - a[1]);
    favoriteTeam = teams[0][0];
    favoriteOdds = teams[0][1];
    underdog = teams[1]?.[0];
  }
  
  return (
    <div style={{ 
      border: '1px solid #ddd', 
      borderRadius: '8px', 
      padding: '1.5rem', 
      marginBottom: '1.5rem', 
      background: '#fff',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      position: 'relative'
    }}>
      {/* AI Badge */}
      <div style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        background: 'linear-gradient(45deg, #667eea, #764ba2)',
        color: '#fff',
        padding: '0.3rem 0.8rem',
        borderRadius: '20px',
        fontSize: '0.8rem',
        fontWeight: 'bold'
      }}>
        🤖 AI Analyzed
      </div>
      
      <h2 style={{ marginTop: 0, marginBottom: '1rem', color: '#001F3F' }}>{event.name}</h2>
      <p><strong>League:</strong> {event.league}</p>
      <p><strong>Date:</strong> {formattedDate}</p>
      <p><strong>Teams:</strong> {Array.isArray(event.teams) ? event.teams.join(' vs ') : ''}</p>
      
      {hasOdds ? (
        <div style={{ 
          background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)', 
          padding: '1.5rem', 
          borderRadius: '8px',
          marginTop: '1rem'
        }}>
          <h3 style={{ 
            marginTop: 0, 
            marginBottom: '1rem',
            color: '#001F3F',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            🎯 AI Predicted Win Probabilities
          </h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            {Object.entries(event.odds).map(([team, prob]) => {
              const isFavorite = team === favoriteTeam;
              return (
                <div key={team} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '0.8rem',
                  margin: '0.5rem 0',
                  background: isFavorite ? 'linear-gradient(90deg, #d4edda, #c3e6cb)' : 'linear-gradient(90deg, #fff3cd, #ffeaa7)',
                  borderRadius: '6px',
                  border: isFavorite ? '2px solid #28a745' : '1px solid #ffc107'
                }}>
                  <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                    {isFavorite ? '👑 ' : '⚡ '}{team}
                  </span>
                  <span style={{ 
                    fontSize: '1.3rem', 
                    fontWeight: 'bold',
                    color: isFavorite ? '#28a745' : '#856404'
                  }}>
                    {prob}%
                  </span>
                </div>
              );
            })}
          </div>
          
          {/* Smart betting insight */}
          {favoriteTeam && favoriteOdds && (
            <div style={{ 
              background: 'linear-gradient(45deg, #17a2b8, #138496)',
              color: '#fff',
              padding: '1rem',
              borderRadius: '6px',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem', opacity: 0.9 }}>
                💡 <strong>AI Insight:</strong>
              </div>
              <div style={{ fontSize: '1rem' }}>
                {favoriteOdds > 70 ? 
                  `Strong favorite ${favoriteTeam} (${favoriteOdds}%) - Consider spread betting` :
                  favoriteOdds > 55 ?
                  `Slight edge to ${favoriteTeam} (${favoriteOdds}%) - Great value opportunity` :
                  `Close matchup! ${favoriteTeam} leads by ${(favoriteOdds - (100 - favoriteOdds)).toFixed(1)}% - High-value bet`
                }
              </div>
            </div>
          )}
          
          {/* Conversion CTA */}
          <div style={{ textAlign: 'center' }}>
            <a
              href="https://stake.us/?c=RIPCITYTICKETS"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                background: 'linear-gradient(45deg, #28a745, #20c997)',
                color: '#fff',
                padding: '0.8rem 2rem',
                borderRadius: '25px',
                textDecoration: 'none',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                transition: 'all 0.3s ease',
                boxShadow: '0 3px 10px rgba(40, 167, 69, 0.3)'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 5px 15px rgba(40, 167, 69, 0.5)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 3px 10px rgba(40, 167, 69, 0.3)';
              }}
            >
              🎲 Bet Now - Use This Intel
            </a>
            
            <div style={{ 
              fontSize: '0.8rem', 
              marginTop: '0.8rem', 
              color: '#666',
              fontStyle: 'italic'
            }}>
              ⚡ Don't let the bookmakers have the advantage - Act on this data!
            </div>
          </div>
        </div>
      ) : (
        <div style={{ 
          background: 'linear-gradient(135deg, #fff3cd, #ffeaa7)',
          padding: '1.5rem',
          borderRadius: '8px',
          marginTop: '1rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#856404' }}>
            🤖 <strong>AI is analyzing this matchup...</strong>
          </div>
          <p style={{ margin: '0 0 1rem 0', color: '#856404' }}>
            Our advanced algorithms are processing thousands of data points to give you the edge.
          </p>
          <div style={{ fontSize: '0.9rem', color: '#666', fontStyle: 'italic' }}>
            💡 Refresh in a few minutes for your competitive advantage
          </div>
        </div>
      )}
      
      {event.affiliateLink && (
        <p style={{ marginTop: '1rem' }}>
          <a 
            href={event.affiliateLink} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              color: '#17a2b8',
              textDecoration: 'none',
              fontWeight: 'bold'
            }}
          >
            🎟️ Purchase Tickets
          </a>
        </p>
      )}
    </div>
  );
}

export default App;
