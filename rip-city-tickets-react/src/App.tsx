import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner/LoadingSpinner';
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
    <ErrorBoundary>
      <div className="app">
        {/* Navigation */}
        <nav className="navbar">
          <div className="container">
            <div className="nav-brand">
              <span className="nav-logo">🏀</span>
              <h1 className="nav-title">Rip City Ticket Dispatch</h1>
              <span className="nav-subtitle">Portland Trail Blazers Deal Hunter</span>
            </div>
            
            <div className="nav-controls">
              <div className="monitoring-status">
                <span className={`status-indicator ${isMonitoring ? 'active' : 'inactive'}`}>
                  {isMonitoring ? '🟢 SCANNING' : '🔴 PAUSED'}
                </span>
                <button 
                  className={`monitoring-toggle ${isMonitoring ? 'stop' : 'start'}`}
                  onClick={isMonitoring ? stopMonitoring : startMonitoring}
                  aria-label={isMonitoring ? 'Stop monitoring' : 'Start monitoring'}
                >
                  {isMonitoring ? 'PAUSE' : 'SCAN'}
                </button>
              </div>
              
              {lastScanTime && (
                <div className="last-scan">
                  Last scan: {lastScanTime.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Dashboard Section */}
        <Suspense fallback={<LoadingSpinner message="Loading dashboard..." />}>
          <Dashboard />
        </Suspense>

        {/* Filter Controls */}
        <section className="filter-section">
          <div className="container">
            <div className="filter-controls">
              <h2>Live Ticket Deals</h2>
              <div className="filter-buttons">
                {(['all', 'sports', 'music', 'trending'] as FilterType[]).map(filter => (
                  <button
                    key={filter}
                    className={`filter-btn ${activeFilter === filter ? 'active' : ''}`}
                    onClick={() => setActiveFilter(filter)}
                  >
                    {filter === 'all' ? '🎫 All Deals' : 
                     filter === 'sports' ? '🏀 Sports' :
                     filter === 'music' ? '🎵 Music' : '🔥 Trending'}
                    <span className="filter-count">
                      {filter === 'all' ? deals.length :
                       filter === 'trending' ? deals.filter(d => d.savingsPercent >= 30).length :
                       deals.filter(d => d.type === filter).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Live Deals Section */}
        <section className="deals-section">
          <div className="container">
            <motion.div 
              className="deals-grid"
              layout
            >
              <AnimatePresence>
                {filteredDeals.length === 0 ? (
                  <div className="no-deals-message">
                    <LoadingSpinner message="Scanning for deals..." size="large" />
                    <p>No deals found for "{activeFilter}" filter. Try expanding your search!</p>
                  </div>
                ) : (
                  filteredDeals.map((deal, index) => (
                    <TicketCard
                      key={deal.id}
                      deal={deal}
                      onPurchase={purchaseDeal}
                      onSave={saveDeal}
                      index={index}
                    />
                  ))
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </section>

        {/* Stats Footer */}
        <footer className="stats-footer">
          <div className="container">
            <div className="footer-stats">
              <div className="stat-item">
                <span className="stat-value">${stats.totalSavings.toLocaleString()}</span>
                <span className="stat-label">Total Savings</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{stats.totalDeals}</span>
                <span className="stat-label">Deals Found</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{stats.activeAlerts}</span>
                <span className="stat-label">Active Alerts</span>
              </div>
              <div className="footer-text">
                <p>🏀 Rip City Ticket Dispatch - Bringing you the best Trail Blazers deals in Portland! 🏀</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}

export default App;
