import React from 'react';
import { motion } from 'framer-motion';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading deals...', 
  size = 'medium' 
}) => {
  return (
    <div className={`loading-container ${size}`}>
      <motion.div 
        className="basketball-spinner"
        animate={{ rotate: 360 }}
        transition={{ 
          duration: 1.5, 
          repeat: Infinity, 
          ease: "linear" 
        }}
      >
        🏀
      </motion.div>
      <motion.p 
        className="loading-message"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {message}
      </motion.p>
    </div>
  );
};

export default LoadingSpinner;
