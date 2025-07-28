import React from 'react';
import { motion } from 'framer-motion';

const Header = () => {
  return (
    <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="bg-black/20 backdrop-blur-md border-b border-white/10 sticky top-0 z-50"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img 
              src="/stake-logo.png" 
              alt="Stake.us" 
              className="h-10 w-auto"
            />
            <div>
              <h1 className="text-2xl font-bold text-white">
                Rip City Tickets
              </h1>
              <p className="text-blue-300 text-sm">
                Stake.us Affiliate Partner
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 bg-green-600/20 px-3 py-1 rounded-full border border-green-500/30">
              <span className="text-green-400 text-sm font-medium">
                Referral Code:
              </span>
              <span className="text-green-300 font-bold">
                RIPCITYTICKETS
              </span>
            </div>
            
            <a
              href="https://stake.us/?c=RIPCITYTICKETS"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
            >
              Join Stake.us
            </a>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
