import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTicketAutomation } from '../../hooks/useTicketAutomation';
import './Dashboard.css';

const Dashboard: React.FC = memo(() => {
  const { stats } = useTicketAutomation();

  // Memoize stat cards configuration to prevent recreation on every render
  const statCards = useMemo(() => [
    {
      icon: '🏀',
      value: stats.sportsDeals,
      label: 'Sports Deals Active',
      color: 'sports',
      gradient: 'linear-gradient(135deg, #E03A3E, #B8282D)'
    },
    {
      icon: '🎵',
      value: stats.musicDeals,
      label: 'Music Deals Active',
      color: 'music',
      gradient: 'linear-gradient(135deg, #B8282D, #000000)'
    },
    {
      icon: '💰',
      value: `$${stats.totalSavings.toLocaleString()}`,
      label: 'Total Savings Found',
      color: 'savings',
      gradient: 'linear-gradient(135deg, #E03A3E, #C4CED4)'
    },
    {
      icon: '🔔',
      value: stats.activeAlerts,
      label: 'Price Alerts Active',
      color: 'alerts',
      gradient: 'linear-gradient(135deg, #C4CED4, #E03A3E)'
    }
  ], [stats]);

  return (
    <section className="dashboard-hero">
      <div className="basketball-bg">
        <div className="court-lines"></div>
      </div>
      
      <div className="container">
        <motion.div 
          className="dashboard-header"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="blazers-title">
            Rip City Ticket Automation
            <span className="basketball-icon">🏀</span>
          </h1>
          <p className="subtitle">
            Trail Blazers-powered deal hunting for Portland sports & music events
          </p>
        </motion.div>

        <div className="stats-grid">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              className={`stat-card ${stat.color}`}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.6, 
                delay: index * 0.1,
                type: "spring",
                stiffness: 100
              }}
              whileHover={{ 
                y: -8, 
                scale: 1.05,
                transition: { duration: 0.2 }
              }}
              style={{ '--gradient': stat.gradient } as React.CSSProperties}
            >
              <div className="stat-icon">
                <span className="icon-emoji">{stat.icon}</span>
              </div>
              <div className="stat-content">
                <motion.div 
                  className="stat-number"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1, type: "spring" }}
                >
                  {stat.value}
                </motion.div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div 
          className="live-status"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <div className="pulse-indicator">
            <div className="pulse-dot"></div>
            <span>Live monitoring Portland venues</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;
