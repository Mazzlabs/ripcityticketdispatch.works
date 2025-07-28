import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ApiService from '../../services/api';

const RPSGame = () => {
  const [gameState, setGameState] = useState({
    sessionId: null,
    playerScore: 0,
    computerScore: 0,
    totalRounds: 0,
    lastResult: null,
    playerMove: null,
    computerMove: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMove, setSelectedMove] = useState(null);

  const moves = [
    { id: 'rock', emoji: '🪨', name: 'Rock' },
    { id: 'paper', emoji: '📄', name: 'Paper' },
    { id: 'scissors', emoji: '✂️', name: 'Scissors' }
  ];

  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ApiService.createGame('rps');
      setGameState({
        sessionId: response.session_id,
        playerScore: response.player_score,
        computerScore: response.computer_score,
        totalRounds: 0,
        lastResult: null,
        playerMove: null,
        computerMove: null,
      });
      setSelectedMove(null);
    } catch (err) {
      setError('Failed to start new game. Please try again.');
      console.error('Error starting game:', err);
    } finally {
      setLoading(false);
    }
  };

  const playMove = async (move) => {
    if (!gameState.sessionId || loading) return;
    
    setSelectedMove(move);
    setLoading(true);
    
    try {
      const response = await ApiService.rpsMove(gameState.sessionId, move);
      setGameState(prev => ({
        ...prev,
        playerScore: response.player_score,
        computerScore: response.computer_score,
        totalRounds: response.total_rounds,
        lastResult: response.result,
        playerMove: response.player_move,
        computerMove: response.computer_move,
      }));
    } catch (err) {
      setError('Failed to play move. Please try again.');
      console.error('Error playing move:', err);
    } finally {
      setLoading(false);
      setSelectedMove(null);
    }
  };

  const getResultMessage = () => {
    if (!gameState.lastResult) return null;
    
    switch (gameState.lastResult) {
      case 'player':
        return { text: 'You Win! 🎉', color: 'text-green-400' };
      case 'computer':
        return { text: 'Computer Wins! 🤖', color: 'text-red-400' };
      case 'tie':
        return { text: 'It\'s a Tie! 🤝', color: 'text-yellow-400' };
      default:
        return null;
    }
  };

  const getMoveEmoji = (move) => {
    const moveObj = moves.find(m => m.id === move);
    return moveObj ? moveObj.emoji : '❓';
  };

  const resultMessage = getResultMessage();

  if (error) {
    return (
      <div className="text-center">
        <div className="bg-red-600/20 border border-red-500/30 rounded-lg p-6 mb-4">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={startNewGame}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-800 to-blue-800 rounded-xl p-8 min-h-[600px]">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Rock Paper Scissors</h2>
        <p className="text-blue-200">
          AI-powered opponent with pattern recognition
        </p>
      </div>

      {/* Score Display */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-green-600/20 rounded-lg p-4 text-center border border-green-500/30">
          <div className="text-2xl font-bold text-green-400">{gameState.playerScore}</div>
          <div className="text-green-200">You</div>
        </div>
        <div className="bg-white/10 rounded-lg p-4 text-center border border-white/20">
          <div className="text-2xl font-bold text-white">{gameState.totalRounds}</div>
          <div className="text-blue-200">Rounds</div>
        </div>
        <div className="bg-red-600/20 rounded-lg p-4 text-center border border-red-500/30">
          <div className="text-2xl font-bold text-red-400">{gameState.computerScore}</div>
          <div className="text-red-200">AI</div>
        </div>
      </div>

      {/* Last Round Result */}
      <AnimatePresence>
        {gameState.playerMove && gameState.computerMove && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="text-center mb-8"
          >
            <div className="flex justify-center items-center gap-8 mb-4">
              <div className="text-center">
                <div className="text-6xl mb-2">{getMoveEmoji(gameState.playerMove)}</div>
                <div className="text-white font-semibold">You</div>
              </div>
              
              <div className="text-4xl text-white">VS</div>
              
              <div className="text-center">
                <div className="text-6xl mb-2">{getMoveEmoji(gameState.computerMove)}</div>
                <div className="text-white font-semibold">AI</div>
              </div>
            </div>
            
            {resultMessage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-2xl font-bold ${resultMessage.color}`}
              >
                {resultMessage.text}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Move Selection */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-white text-center mb-6">
          Choose Your Move
        </h3>
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
          {moves.map((move) => (
            <motion.button
              key={move.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => playMove(move.id)}
              disabled={loading}
              className={`bg-white/10 hover:bg-white/20 disabled:bg-gray-600/50 disabled:cursor-not-allowed border border-white/20 hover:border-blue-400/50 rounded-lg p-6 text-center transition-all duration-300 ${
                selectedMove === move.id ? 'ring-2 ring-blue-400' : ''
              }`}
            >
              <div className="text-4xl mb-2">{move.emoji}</div>
              <div className="text-white font-semibold">{move.name}</div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Game Controls */}
      <div className="text-center mb-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={startNewGame}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
        >
          {loading ? 'Starting...' : 'New Game'}
        </motion.button>
      </div>

      {/* Game Info */}
      <div className="text-center text-purple-200 text-sm mb-6">
        <p className="mb-2">
          <strong>AI Strategy:</strong> The computer learns from your patterns and adapts its strategy!
        </p>
        <p>
          <strong>Rules:</strong> Rock beats Scissors, Scissors beats Paper, Paper beats Rock
        </p>
      </div>

      {/* Stake.us Promotion */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-md rounded-lg p-6 border border-white/20 text-center">
        <p className="text-blue-200 mb-4">
          Ready for more competitive gaming? Try Stake.us tournaments!
        </p>
        <a
          href="https://stake.us/casino?c=RIPCITYTICKETS"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
        >
          Play at Stake.us
        </a>
      </div>
    </div>
  );
};

export default RPSGame;
