import React, { memo, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import './TicketCard.css';

export interface TicketDeal {
  id: string;
  name: string;
  venue: string;
  city: string;
  date: string;
  time?: string;
  url: string;
  image?: string;
  minPrice: number;
  maxPrice: number;
  currency: string;
  dealScore: number;
  category: string;
  source: string;
  savings: string;
  originalPrice: number;
  isFree: boolean;
  description?: string;
}

interface TicketCardProps {
  deal: TicketDeal;
  onPurchase: (dealId: string) => void;
  onSave: (dealId: string) => void;
  index: number;
}

const TicketCard: React.FC<TicketCardProps> = memo(({ deal, onPurchase, onSave, index }) => {
  // Memoize expensive calculations
  const { savingsAmount, savingsPercent, dealLevel, isBlazersGame, formattedDate } = useMemo(() => {
    const savings = deal.originalPrice - deal.minPrice;
    const percent = deal.originalPrice > 0 ? Math.round((savings / deal.originalPrice) * 100) : 0;
    const level = deal.dealScore >= 80 ? 'hot' : deal.dealScore >= 60 ? 'good' : 'ok';
    const isBlazers = deal.name.toLowerCase().includes('trail blazers');
    const dateObj = new Date(deal.date);
    const formatted = dateObj.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: dateObj.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
    
    return {
      savingsAmount: savings,
      savingsPercent: percent,
      dealLevel: level,
      isBlazersGame: isBlazers,
      formattedDate: formatted
    };
  }, [deal.originalPrice, deal.minPrice, deal.dealScore, deal.name, deal.date]);

  // Memoize event handlers to prevent unnecessary re-renders
  const handlePurchase = useCallback(() => {
    // Open the ticket URL in a new tab
    window.open(deal.url, '_blank', 'noopener,noreferrer');
    onPurchase(deal.id);
  }, [onPurchase, deal.id, deal.url]);
  
  const handleSave = useCallback(() => onSave(deal.id), [onSave, deal.id]);
  
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

  return (
    <motion.div
      className={`ticket-card ${dealLevel} ${isBlazersGame ? 'blazers-game' : ''}`}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.02, y: -5 }}
      layout
    >
      {/* Deal Score Badge */}
      <div className="deal-score-badge">
        <span className="score">{deal.dealScore}</span>
        <span className="score-label">Deal Score</span>
      </div>

      {/* Savings Badge */}
      {savingsAmount > 0 && (
        <motion.span
          className="savings-badge"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3 + index * 0.1 }}
        >
          <span className="savings-amount">Save ${savingsAmount}</span>
          {savingsPercent > 0 && <span className="savings-percent">({savingsPercent}% off)</span>}
        </motion.span>
      )}

      {/* Free Event Badge */}
      {deal.isFree && (
        <motion.span
          className="free-badge"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3 + index * 0.1 }}
        >
          FREE
        </motion.span>
      )}

      {/* Header */}
      <div className="card-header">
        <div className="event-info">
          <h3 className="event-title">{deal.name}</h3>
          <div className="venue-info">
            <span className="venue-name">🏟️ {deal.venue}</span>
            {deal.city && <span className="city-name">📍 {deal.city}</span>}
          </div>
          <span className="deal-date">📅 {formattedDate}</span>
          {deal.time && <span className="deal-time">🕐 {deal.time}</span>}
        </div>
      </div>

      {/* Deal Details */}
      <div className="deal-details">
        <div className="detail-row">
          <div className="detail-item">
            <span className="detail-label">Source:</span>
            <span className="detail-value">{deal.source}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Category:</span>
            <span className="detail-value">{deal.category}</span>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="pricing-section">
        <div className="price-comparison">
          <div className="price-item original">
            <span className="price-label">Original</span>
            <span className="price-value">${deal.originalPrice}</span>
          </div>
          <div className="price-item current">
            <span className="price-label">Current</span>
            <span className="price-value">${deal.minPrice}</span>
            {deal.maxPrice > deal.minPrice && (
              <span className="price-range">- ${deal.maxPrice}</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="card-actions">
        <motion.button
          className="btn btn-primary purchase-btn"
          onClick={handlePurchase}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🎫 Get Tickets
        </motion.button>
        
        <motion.button
          className="btn btn-secondary save-btn"
          onClick={handleSave}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          💾 Save Deal
        </motion.button>
      </div>

      {/* Special Event Indicators */}
      {isBlazersGame && (
        <div className="blazers-indicator">
          <span>🏀 RIP CITY! 🏀</span>
        </div>
      )}
      
      {/* Music/Entertainment Special Indicator */}
      {(deal.category === 'music' || deal.category === 'entertainment') && deal.dealScore >= 75 && (
        <div className="music-indicator">
          <span>🌹 PREMIUM SHOW! 🌹</span>
        </div>
      )}
    </motion.div>
  );
});

TicketCard.displayName = 'TicketCard';

export default TicketCard;
