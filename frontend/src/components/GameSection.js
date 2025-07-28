import React from 'react';
import { motion } from 'framer-motion';

const GameSection = ({ games, onGameSelect }) => {
  return (
    <section className="py-16 bg-black/20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Practice Your Skills
          </h2>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto">
            Try our free games to sharpen your strategy, then take your skills to Stake.us 
            with referral code <span className="text-green-400 font-bold">RIPCITYTICKETS</span> 
            for 5G Stake Cash + 260K Gold Coins!
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {games.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="game-card rounded-xl p-8 text-center cursor-pointer transition-all duration-300"
              onClick={() => onGameSelect(game.id)}
            >
              <div className="text-6xl mb-6">
                {game.id === 'blackjack' && '🃏'}
                {game.id === 'rps' && '✂️'}
                {game.id === 'dice' && '🎲'}
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-4">
                {game.name}
              </h3>
              
              <p className="text-blue-200 mb-6 leading-relaxed">
                {game.description}
              </p>
              
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105">
                Play Now
              </button>
            </motion.div>
          ))}
        </div>
        
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-blue-300 mb-4">
            Ready for real money gaming?
          </p>
          <a
            href="https://stake.us/?c=RIPCITYTICKETS"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-4 rounded-lg font-bold transition-all duration-300 transform hover:scale-105"
          >
            <span>Join Stake.us Now</span>
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default GameSection;
