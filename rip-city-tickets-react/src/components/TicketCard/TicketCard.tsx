import React from 'react';
import { motion } from 'framer-motion';
import './TicketCard.css';

export interface TicketDeal {
  id: string;
  title: string;
  venue: string;
  date: Date;
  type: 'sports' | 'music';
  team?: string;
  genre?: string;
  originalPrice: number;
  currentPrice: number;
  savingsPercent: number;
  quantity: number;
  section: string;
  platform: string;
  confidence: number;
  scrapedAt: Date;
}

interface TicketCardProps {
  deal: TicketDeal;
  onPurchase: (dealId: string) => void;
  onSave: (dealId: string) => void;
  index: number;
}

const TicketCard: React.FC<TicketCardProps> = ({ deal, onPurchase, onSave, index }) => {
  const savings = deal.originalPrice - deal.currentPrice;
  const timeAgo = getTimeAgo(deal.scrapedAt);
  const isBlazersGame = deal.title.toLowerCase().includes('trail blazers');
  
  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        duration: 0.5,
        delay: index * 0.1,
        type: "spring",
        stiffness: 100
      }
    }
  };

  const hoverVariants = {
    scale: 1.05,
    y: -10,
    transition: { duration: 0.2 }
  };

  return (
    <motion.div
      className={`ticket-card ${deal.type} ${isBlazersGame ? 'blazers-game' : ''}`}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={hoverVariants}
      layout
    >
      {isBlazersGame && (
        <div className="blazers-badge">
          <span>🏀 RIP CITY</span>
        </div>
      )}
      
      <div className="card-header">
        <div className="deal-metadata">
          <span className={`deal-type ${deal.type}`}>
            {deal.type === 'sports' ? '🏀' : '🎵'} {deal.type}
          </span>
          <motion.span 
            className="savings-badge"
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0] 
            }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            -{deal.savingsPercent}%
          </motion.span>
        </div>
        <div className="confidence-meter">
          <div className="confidence-bar">
            <motion.div 
              className="confidence-fill"
              initial={{ width: 0 }}
              animate={{ width: `${deal.confidence * 100}%` }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </div>
          <span className="confidence-text">{Math.round(deal.confidence * 100)}%</span>
        </div>
      </div>

      <div className="card-content">
        <h3 className="deal-title">{deal.title}</h3>
        <div className="venue-info">
          <span className="venue-name">📍 {deal.venue}</span>
          <span className="deal-date">📅 {deal.date.toLocaleDateString()}</span>
        </div>
        
        <div className="deal-details">
          <div className="detail-item">
            <span className="detail-label">Section:</span>
            <span className="detail-value">{deal.section}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Quantity:</span>
            <span className="detail-value">{deal.quantity} tickets</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Platform:</span>
            <span className="detail-value">{deal.platform}</span>
          </div>
        </div>
      </div>

      <div className="price-section">
        <div className="price-comparison">
          <div className="current-price">
            <span className="price-label">Current</span>
            <span className="price-value">${deal.currentPrice}</span>
          </div>
          <div className="original-price">
            <span className="price-label">Original</span>
            <span className="price-value">${deal.originalPrice}</span>
          </div>
        </div>
        <div className="savings-highlight">
          <span className="savings-amount">Save ${savings}</span>
        </div>
      </div>

      <div className="card-footer">
        <div className="deal-meta">
          <span className="time-indicator">⏰ {timeAgo}</span>
          <span className="urgency-indicator">
            {deal.quantity <= 2 ? '🔥 Few left!' : '✅ Available'}
          </span>
        </div>
        
        <div className="action-buttons">
          <motion.button
            className="btn btn-primary purchase-btn"
            onClick={() => onPurchase(deal.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>🎫 Buy Now</span>
          </motion.button>
          <motion.button
            className="btn btn-secondary save-btn"
            onClick={() => onSave(deal.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>💾 Save</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default TicketCard;
