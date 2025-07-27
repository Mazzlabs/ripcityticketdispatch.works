import React from 'react';

/**
 * Main application component for the Stake.us affiliate site.
 *
 * This component displays promotional content for Stake.us casino games
 * and directs users to the affiliate site for gaming.
 */
function App() {

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
        {/* Left column: casino games promotion */}
        <div style={{ flex: '1 1 auto', marginRight: '1rem' }}>
          <h1>America's Social Casino - Play on Stake.us!</h1>
          <div style={{ 
            background: '#001F3F', 
            color: 'white', 
            padding: '1rem', 
            borderRadius: '8px', 
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            <h2 style={{ margin: '0 0 0.5rem 0' }}>🎰 Ready to Play?</h2>
            <p style={{ margin: '0 0 1rem 0' }}>Experience the thrill of casino games, slots, and exclusive promotions!</p>
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
          
          <div style={{ marginTop: '2rem' }}>
            <h2 style={{ color: '#001F3F' }}>🎮 What You'll Find on Stake.us</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
              <GameCategory 
                title="🎰 Slots" 
                description="Hundreds of exciting slot games with amazing graphics and bonus features"
                icon="🎰"
              />
              <GameCategory 
                title="🃏 Table Games" 
                description="Classic casino favorites like Blackjack, Roulette, and Baccarat"
                icon="🃏"
              />
              <GameCategory 
                title="🎲 Live Casino" 
                description="Real dealers and authentic casino atmosphere from your home"
                icon="🎲"
              />
              <GameCategory 
                title="🎪 Originals" 
                description="Unique Stake.us exclusive games you won't find anywhere else"
                icon="🎪"
              />
            </div>
          </div>

          <div style={{ 
            background: '#f8f9fa', 
            padding: '1.5rem', 
            borderRadius: '8px', 
            marginTop: '2rem',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#001F3F' }}>✨ Why Choose Stake.us?</h3>
            <ul style={{ textAlign: 'left', margin: '0', padding: '0 1rem', listStyle: 'none' }}>
              <li style={{ marginBottom: '0.5rem' }}>💯 100% Legal and Licensed Social Casino</li>
              <li style={{ marginBottom: '0.5rem' }}>🎁 Daily Bonuses and Promotions</li>
              <li style={{ marginBottom: '0.5rem' }}>📱 Play on Desktop, Mobile, or Tablet</li>
              <li style={{ marginBottom: '0.5rem' }}>🔒 Safe, Secure, and Trusted Platform</li>
              <li style={{ marginBottom: '0.5rem' }}>⚡ Instant Play - No Downloads Required</li>
            </ul>
          </div>
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
 * Game category component for displaying different types of casino games.
 */
function GameCategory({ title, description, icon }) {
  return (
    <div style={{ 
      border: '1px solid #ddd', 
      borderRadius: '8px', 
      padding: '1.5rem', 
      background: '#fff',
      textAlign: 'center',
      transition: 'transform 0.2s ease',
      cursor: 'pointer'
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{icon}</div>
      <h3 style={{ margin: '0 0 0.5rem 0', color: '#001F3F' }}>{title}</h3>
      <p style={{ margin: '0 0 1rem 0', color: '#666', fontSize: '14px' }}>{description}</p>
      <a
        href="https://stake.us/?c=RIPCITYTICKETS"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          background: '#001F3F',
          color: 'white',
          padding: '8px 16px',
          textDecoration: 'none',
          borderRadius: '5px',
          fontWeight: 'bold',
          fontSize: '14px',
          display: 'inline-block'
        }}
      >
        Play Now
      </a>
    </div>
  );
}

export default App;
