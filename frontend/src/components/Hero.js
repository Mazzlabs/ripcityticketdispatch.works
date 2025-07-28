import React from 'react';
import { motion } from 'framer-motion';

const Hero = () => {
  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img 
          src="/stake-banner-horizontal.gif" 
          alt="Stake.us Gaming" 
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-purple-900/80"></div>
      </div>
      
      {/* Content */}
      <div className="relative container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Rip City Gaming
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed">
            Register at Stake.us with the referral code{' '}
            <span className="text-green-400 font-bold">RIPCITYTICKETS</span>{' '}
            to get 5G Stake Cash, 260,000 Gold Coins, and a generous 5% rakeback. 
            You can also keep collecting when you generate a referral link!
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20"
            >
              <div className="text-3xl mb-2">💎</div>
              <h3 className="text-lg font-semibold text-white mb-2">5G Stake Cash</h3>
              <p className="text-blue-200">Instant bonus just for signing up with our code</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20"
            >
              <div className="text-3xl mb-2">🪙</div>
              <h3 className="text-lg font-semibold text-white mb-2">260K Gold Coins</h3>
              <p className="text-blue-200">Massive coin package + 5% rakeback</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20"
            >
              <div className="text-3xl mb-2">🎰</div>
              <h3 className="text-lg font-semibold text-white mb-2">Free Games</h3>
              <p className="text-blue-200">Practice here, then play for real at Stake.us</p>
            </motion.div>
          </div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <a
              href="https://stake.us/?c=RIPCITYTICKETS"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Claim 5G Stake Cash + 260K Gold Coins
            </a>
            
            <div className="text-center">
              <p className="text-blue-200 text-sm">Use referral code:</p>
              <code className="bg-black/30 text-green-400 px-3 py-1 rounded font-mono font-bold">
                RIPCITYTICKETS
              </code>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
