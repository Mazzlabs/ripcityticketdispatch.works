import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ApiService from '../services/api';

const BlackjackGame = () => {
  const [gameState, setGameState] = useState({
    sessionId: null,
    playerHand: [],
    dealerHand: [],
    playerScore: 0,
    dealerScore: 0,
    gameStatus: 'loading',
    canHit: false,
    canStand: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleStakeClick = () => {
    window.open('https://stake.us/?c=RIPCITYTICKETS', '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ApiService.createGame('blackjack');
      setGameState({
        sessionId: response.session_id,
        playerHand: response.player_hand,
        dealerHand: response.dealer_hand,
        playerScore: response.player_score,
        dealerScore: response.dealer_score,
        gameStatus: response.game_status,
        canHit: response.can_hit,
        canStand: response.can_stand,
      });
    } catch (err) {
      setError('Failed to start new game. Please try again.');
      console.error('Error starting game:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    if (!gameState.sessionId) return;
    
    setLoading(true);
    try {
      const response = await ApiService.blackjackAction(gameState.sessionId, action);
      setGameState(prev => ({
        ...prev,
        playerHand: response.player_hand,
        dealerHand: response.dealer_hand,
        playerScore: response.player_score,
        dealerScore: response.dealer_score,
        gameStatus: response.game_status,
        canHit: response.can_hit,
        canStand: response.can_stand,
      }));
    } catch (err) {
      setError('Failed to perform action. Please try again.');
      console.error('Error performing action:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderCard = (card, index, isHidden = false) => {
    if (isHidden || card.hidden) {
      return (
        <motion.div
          key={`hidden-${index}`}
          initial={{ scale: 0, rotateY: 180 }}
          animate={{ scale: 1, rotateY: 0 }}
          transition={{ delay: index * 0.1 }}
          className="card bg-rose-600 text-white"
        >
          <div className="text-2xl">🂠</div>
        </motion.div>
      );
    }

    const isRed = card.suit === '♥' || card.suit === '♦';
    
    return (
      <motion.div
        key={`${card.suit}-${card.rank}-${index}`}
        initial={{ scale: 0, rotateY: 180 }}
        animate={{ scale: 1, rotateY: 0 }}
        transition={{ delay: index * 0.1 }}
        className={`card ${isRed ? 'red' : 'black'}`}
      >
        <div className="text-xs">{card.rank}</div>
        <div className="text-lg">{card.suit}</div>
      </motion.div>
    );
  };

  const getGameStatusMessage = () => {
    switch (gameState.gameStatus) {
      case 'won':
        return { text: 'You Win! 🎉', color: 'text-green-400' };
      case 'lost':
        return { text: 'You Lose 😞', color: 'text-red-400' };
      case 'push':
        return { text: 'Push - It\'s a Tie! 🤝', color: 'text-yellow-400' };
      case 'playing':
        return { text: 'Your Turn', color: 'text-rose-400' };
      default:
        return { text: 'Game Ready', color: 'text-white' };
    }
  };

  const statusMessage = getGameStatusMessage();

  if (error) {
    return (
      <div className="text-center">
        <div className="bg-red-600/20 border border-red-500/30 rounded-lg p-6 mb-4">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={startNewGame}
            className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-800 rounded-xl p-8 min-h-[600px]">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Blackjack</h2>
        <p className={`text-xl font-semibold ${statusMessage.color}`}>
          {statusMessage.text}
        </p>
      </div>

      {/* Dealer Section */}
      <div className="mb-8">
        <div className="text-center mb-4">
          <h3 className="text-xl font-semibold text-white mb-2">
            Dealer ({gameState.dealerScore})
          </h3>
          <div className="flex justify-center gap-2 flex-wrap">
            <AnimatePresence>
              {gameState.dealerHand.map((card, index) => 
                renderCard(card, index, card.hidden)
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Player Section */}
      <div className="mb-8">
        <div className="text-center mb-4">
          <h3 className="text-xl font-semibold text-white mb-2">
            You ({gameState.playerScore})
          </h3>
          <div className="flex justify-center gap-2 flex-wrap">
            <AnimatePresence>
              {gameState.playerHand.map((card, index) => 
                renderCard(card, index)
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Game Controls */}
      <div className="flex justify-center gap-4 mb-6">
        {gameState.gameStatus === 'playing' && (
          <>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAction('hit')}
              disabled={!gameState.canHit || loading}
              className="bg-rose-600 hover:bg-rose-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              {loading ? 'Processing...' : 'Hit'}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAction('stand')}
              disabled={!gameState.canStand || loading}
              className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Stand
            </motion.button>
          </>
        )}
        
        {gameState.gameStatus !== 'playing' && gameState.gameStatus !== 'loading' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startNewGame}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            {loading ? 'Starting...' : 'New Game'}
          </motion.button>
        )}
      </div>

      {/* Game Rules */}
      <div className="text-center text-green-200 text-sm mb-6">
        <p className="mb-2">
          <strong>Goal:</strong> Get as close to 21 as possible without going over.
        </p>
        <p>
          <strong>Card Values:</strong> Aces = 1 or 11, Face cards = 10, Number cards = Face value
        </p>
      </div>

      {/* Stake.us Promotion */}
      <div className="bg-gradient-to-r from-rose-600/20 to-red-600/20 backdrop-blur-md rounded-lg p-6 border border-white/20 text-center">
        <p className="text-rose-200 mb-4">
          Love this game? Play for real money at Stake.us!
        </p>
        <button
          onClick={handleStakeClick}
          className="bg-gradient-to-r from-green-500 to-rose-600 hover:from-green-600 hover:to-rose-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
        >
          Play Live Blackjack at Stake.us
        </button>
      </div>
    </div>
  );
};

export default BlackjackGame;
