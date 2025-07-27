import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './App.css';

function App() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Wait for fonts and initial render
    const loadHandler = () => {
      // Check if Inter font is loaded
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          setIsLoaded(true);
        });
      } else {
        // Fallback for browsers without Font Loading API
        setTimeout(() => {
          setIsLoaded(true);
        }, 300);
      }
    };

    if (document.readyState === 'complete') {
      loadHandler();
    } else {
      window.addEventListener('load', loadHandler);
      return () => window.removeEventListener('load', loadHandler);
    }
  }, []);

  if (!isLoaded) {
    return (
      <div
        className="min-h-screen bg-gradient-to-br from-red-900 via-black to-red-800 flex items-center justify-center"
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #7f1d1d 0%, #000000 50%, #7f1d1d 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
        }}
      >
        <div className="text-center text-white" style={{ textAlign: 'center' }}>
          <h1 className="text-4xl font-bold mb-4">🏀 RIP CITY TICKETS</h1>
          <p className="opacity-80">Loading your gateway to Stake.us...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-black to-red-800">
      {/* Header */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="px-6 py-4 border-b border-red-700/30"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src="/stake-logo.png" 
              alt="Stake.us" 
              className="h-8 w-auto"
              onError={(e) => {e.target.style.display = 'none'}}
            />
            <h1 className="text-2xl font-bold text-white">
              <span className="text-red-500">RIP CITY</span> TICKETS
            </h1>
          </div>
          <motion.a
            href="https://stake.us/?c=RIPCITYTICKETS"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Join Now
          </motion.a>
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
        className="relative px-6 py-20"
      >
        <div className="max-w-6xl mx-auto text-center">
          {/* Welcome Bonus Banner */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="inline-block bg-gradient-to-r from-red-600 to-red-500 text-white px-8 py-3 rounded-full mb-8 text-lg font-bold shadow-2xl"
          >
            🎉 EXCLUSIVE WELCOME BONUS: Get $25 FREE + 5% RAKEBACK! 🎉
          </motion.div>

          <motion.h1 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="text-6xl md:text-8xl font-black text-white mb-6 leading-tight"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-white">
              RIP CITY
            </span>
            <br />
            <span className="text-red-500">GAMING</span>
          </motion.h1>

          <motion.p 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed"
          >
            Join the ultimate gaming experience for Portland fans! Get exclusive bonuses, 
            daily rewards, and be part of the Rip City community on Stake.us.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="mb-12"
          >
            <motion.a
              href="https://stake.us/?c=RIPCITYTICKETS"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05, boxShadow: "0 25px 50px rgba(239, 68, 68, 0.5)" }}
              whileTap={{ scale: 0.95 }}
              className="inline-block bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white text-2xl font-bold px-12 py-6 rounded-2xl shadow-2xl transition-all duration-300"
            >
              CLAIM YOUR $25 BONUS NOW
            </motion.a>
          </motion.div>

          {/* Promo Code */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.3 }}
            className="bg-black/50 border border-red-500/30 rounded-lg p-6 max-w-md mx-auto"
          >
            <p className="text-gray-400 text-sm mb-2">USE PROMO CODE:</p>
            <div className="flex items-center justify-center space-x-4">
              <code className="text-2xl font-mono font-bold text-red-400 bg-black/50 px-4 py-2 rounded border border-red-500/50">
                RIPCITYTICKETS
              </code>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigator.clipboard.writeText('RIPCITYTICKETS')}
                className="text-red-400 hover:text-red-300 transition-colors"
                title="Copy to clipboard"
              >
                📋
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Background Banner Images */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
          <img 
            src="/stake-banner-horizontal.gif" 
            alt="" 
            className="absolute top-20 left-10 w-64 rotate-12"
            onError={(e) => {e.target.style.display = 'none'}}
          />
          <img 
            src="/stake-banner-vertical.gif" 
            alt="" 
            className="absolute bottom-20 right-10 h-48 -rotate-12"
            onError={(e) => {e.target.style.display = 'none'}}
          />
        </div>
      </motion.section>

      {/* Benefits Section */}
      <motion.section 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="px-6 py-16 bg-black/30"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-12">
            Why <span className="text-red-500">Rip City</span> Gamers Choose Stake.us
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "💰",
                title: "$25 Welcome Bonus",
                description: "Start your gaming journey with free money! No deposit required to claim your welcome bonus."
              },
              {
                icon: "🎯",
                title: "5% Daily Rakeback",
                description: "Get money back on every bet! Our exclusive rakeback ensures you always get something back."
              },
              {
                icon: "🏀",
                title: "Portland Pride",
                description: "Join the Rip City community and rep Portland while you game on the best platform."
              }
            ].map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
                className="bg-gradient-to-br from-red-900/50 to-black/50 border border-red-500/30 rounded-xl p-8 text-center hover:border-red-400/50 transition-all duration-300"
              >
                <div className="text-4xl mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-bold text-white mb-4">{benefit.title}</h3>
                <p className="text-gray-300 leading-relaxed">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Footer CTA */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="px-6 py-16 text-center"
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Join <span className="text-red-500">Rip City Gaming</span>?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Don't miss out on your $25 welcome bonus and exclusive Portland community perks!
          </p>
          
          <motion.a
            href="https://stake.us/?c=RIPCITYTICKETS"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ 
              scale: 1.05, 
              boxShadow: "0 25px 50px rgba(239, 68, 68, 0.5)",
              background: "linear-gradient(135deg, #dc2626, #ef4444)"
            }}
            whileTap={{ scale: 0.95 }}
            className="inline-block bg-gradient-to-r from-red-600 to-red-500 text-white text-2xl font-bold px-16 py-6 rounded-2xl shadow-2xl transition-all duration-300"
          >
            START GAMING NOW →
          </motion.a>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="border-t border-red-700/30 px-6 py-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img src="/stake-logo.png" alt="Stake.us" className="h-6 w-auto" onError={(e) => {e.target.style.display = 'none'}} />
            <span className="text-gray-400">×</span>
            <span className="text-red-500 font-bold">RIP CITY TICKETS</span>
          </div>
          <p className="text-gray-500 text-sm">
            Promo Code: RIPCITYTICKETS | 21+ Only | Play Responsibly
          </p>
          <p className="text-gray-600 text-xs mt-2">
            © 2025 Rip City Gaming Community. Not affiliated with the Portland Trail Blazers.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
