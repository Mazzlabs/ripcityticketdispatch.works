import React from 'react';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="navbar">
        <div className="container">
          <div className="nav-brand">
            <span className="nav-logo">🎫</span>
            <h1 className="nav-title">Rip City Events Hub</h1>
            <span className="nav-subtitle">Testing Minimal Version</span>
          </div>
        </div>
      </header>
      
      <main className="main-content">
        <div className="container">
          <h2>🏀 Rip City Ticket Dispatch</h2>
          <p>This is a minimal version to test if the basic React app works.</p>
          <div className="test-content">
            <button className="btn btn-primary">Test Button</button>
            <div style={{ marginTop: '20px' }}>
              <p>Current time: {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
