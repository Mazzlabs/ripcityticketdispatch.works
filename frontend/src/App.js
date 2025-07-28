import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import Hero from './components/Hero';
import GameSection from './components/GameSection';
import StakeInfo from './components/StakeInfo';
import Footer from './components/Footer';
import BlackjackGame from './components/games/BlackjackGame';
import RPSGame from './components/games/RPSGame';
import DiceGame from './components/games/DiceGame';
import './App.css';

function App() {
  const [activeGame, setActiveGame] = useState(null);

  const games = [
    {
      id: 'blackjack',
      name: 'Blackjack',
      description: 'Classic 21 card game with perfect basic strategy',
      component: BlackjackGame
    },
    {
      id: 'rps',
      name: 'Rock Paper Scissors',
      description: 'AI-powered opponent with pattern recognition',
      component: RPSGame
    },
    {
      id: 'dice',
      name: 'Dice Game',
      description: 'Simple betting game with various payout options',
      component: DiceGame
    }
  ];

  const handleGameSelect = (gameId) => {
    setActiveGame(gameId);
  };

  const handleGameClose = () => {
    setActiveGame(null);
  };

  const ActiveGameComponent = games.find(game => game.id === activeGame)?.component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <Header />
      
      <AnimatePresence mode="wait">
        {activeGame ? (
          <motion.div
            key="game"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="container mx-auto px-4 py-8"
          >
            <div className="max-w-4xl mx-auto">
              <button
                onClick={handleGameClose}
                className="mb-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                ← Back to Games
              </button>
              {ActiveGameComponent && <ActiveGameComponent />}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Hero />
            <GameSection games={games} onGameSelect={handleGameSelect} />
            <StakeInfo />
          </motion.div>
        )}
      </AnimatePresence>
      
      <Footer />
    </div>
  );
}

export default App;
