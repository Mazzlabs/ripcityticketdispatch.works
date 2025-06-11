import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Dashboard from './components/Dashboard/Dashboard';
import TicketCard from './components/TicketCard/TicketCard';
import { useTicketAutomation } from './hooks/useTicketAutomation';
import './App.css';

type FilterType = 'all' | 'sports' | 'music' | 'trending';

function App() {
  const {
    deals,
    isMonitoring,
    lastScanTime,
    startMonitoring,
    stopMonitoring,
    purchaseDeal,
    saveDeal,
    stats
  } = useTicketAutomation();

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  useEffect(() => {
    // Auto-start monitoring
    startMonitoring();
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [startMonitoring]);

  const filteredDeals = deals.filter(deal => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'trending') return deal.savingsPercent >= 30;
    return deal.type === activeFilter;
  });

  return (
    <div className="app">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <span className="logo-icon">🏀</span>
            <span className="logo-text">Rip City Ticket Dispatch</span>
          </div>
          
          <div className="nav-links">
            <button className="nav-link">Dashboard</button>
            <button className="nav-link">Live Deals</button>
            <button className="nav-link">Alerts</button>
            <button className="nav-link">Analytics</button>
          </div>
          
          <div className="monitoring-status">
            <div className={`status-indicator ${isMonitoring ? 'active' : 'inactive'}`}>
              <div className="pulse-dot"></div>
              <span>{isMonitoring ? 'Live Monitoring' : 'Monitoring Paused'}</span>
            </div>
            <button 
              className="toggle-btn"
              onClick={isMonitoring ? stopMonitoring : startMonitoring}
            >
              {isMonitoring ? 'Pause' : 'Start'}
            </button>
          </div>
        </div>
      </nav>

      {/* Dashboard Section */}
      <Dashboard />

      {/* Live Deals Section */}
      <section className="deals-section">
        <div className="container">
          <div className="section-header">
            <motion.h2 
              className="section-title"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              🔥 Hot Deals Right Now
            </motion.h2>
            
            <div className="deal-filters">
              {(['all', 'sports', 'music', 'trending'] as FilterType[]).map(filter => (
                <motion.button
                  key={filter}
                  className={`filter-btn ${activeFilter === filter ? 'active' : ''}`}
                  onClick={() => setActiveFilter(filter)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {filter === 'all' && '🎯 All'}
                  {filter === 'sports' && '🏀 Sports'}
                  {filter === 'music' && '🎵 Music'}
                  {filter === 'trending' && '🔥 Trending'}
                </motion.button>
              ))}
            </div>
            
            {lastScanTime && (
              <div className="last-scan">
                Last scan: {lastScanTime.toLocaleTimeString()}
              </div>
            )}
          </div>

          <motion.div 
            className="deals-grid"
            layout
          >
            <AnimatePresence>
              {filteredDeals.map((deal, index) => (
                <TicketCard
                  key={deal.id}
                  deal={deal}
                  onPurchase={purchaseDeal}
                  onSave={saveDeal}
                  index={index}
                />
              ))}
            </AnimatePresence>
          </motion.div>
          
          {filteredDeals.length === 0 && (
            <motion.div 
              className="no-deals"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="no-deals-icon">🎫</div>
              <h3>No deals found for {activeFilter}</h3>
              <p>Check back soon - we're constantly scanning for new opportunities!</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Stats Footer */}
      <footer className="stats-footer">
        <div className="container">
          <div className="stats-summary">
            <div className="stat">
              <span className="stat-label">Total Deals Found</span>
              <span className="stat-value">{stats.totalDeals}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Total Savings</span>
              <span className="stat-value">${stats.totalSavings.toLocaleString()}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Avg Savings</span>
              <span className="stat-value">{Math.round(stats.avgSavingsPercent)}%</span>
            </div>
            <div className="stat">
              <span className="stat-label">Active Alerts</span>
              <span className="stat-value">{stats.activeAlerts}</span>
            </div>
          </div>
          <div className="footer-text">
            <p>🏀 Built with ❤️ for Rip City • Go Blazers! 🔴⚫</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
