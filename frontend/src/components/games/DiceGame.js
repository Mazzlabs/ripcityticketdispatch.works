import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ApiService from '../../services/api';

const DiceGame = () => {
  const [gameState, setGameState] = useState({
    sessionId: null,
    balance: 1000,
    totalGames: 0,
    gamesWon: 0,
    lastRoll: [],
    lastBet: null,
    lastPayout: 0,
  });
  const [betAmount, setBetAmount] = useState(50);
  const [betType, setBetType] = useState('over');
  const [exactTarget, setExactTarget] = useState(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rolling, setRolling] = useState(false);

  const betTypes = [
    { id: 'over', name: 'Over 7', payout: '2x', description: 'Dice total > 7' },
    { id: 'under', name: 'Under 7', payout: '2x', description: 'Dice total < 7' },
    { id: 'seven', name: 'Lucky 7', payout: '5x', description: 'Dice total = 7' },
    { id: 'exact', name: 'Exact Number', payout: 'Varies', description: 'Choose exact total' },
  ];

  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ApiService.createGame('dice');
      setGameState({
        sessionId: response.session_id,
        balance: response.balance,
        totalGames: 0,
        gamesWon: 0,
        lastRoll: [],
        lastBet: null,
        lastPayout: 0,
      });
    } catch (err) {
      setError('Failed to start new game. Please try again.');
      console.error('Error starting game:', err);
    } finally {
      setLoading(false);
    }
  };

  const placeBet = async () => {
    if (!gameState.sessionId || loading || betAmount > gameState.balance) return;
    
    setRolling(true);
    setLoading(true);
    
    try {
      const target = betType === 'exact' ? exactTarget : null;
      const response = await ApiService.placeBet(gameState.sessionId, betAmount, betType, target);
      
      // Simulate dice rolling animation
      setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          balance: response.new_balance,
          totalGames: response.total_games,
          gamesWon: response.games_won,
          lastRoll: response.dice_roll,
          lastBet: {
            amount: response.bet_amount,
            type: response.bet_type,
            target: target,
            won: response.won,
          },
          lastPayout: response.payout,
        }));
        setRolling(false);
      }, 1500);
    } catch (err) {
      setError('Failed to place bet. Please try again.');
      console.error('Error placing bet:', err);
      setRolling(false);
    } finally {
      setLoading(false);
    }
  };

  const renderDice = (value, index) => {
    const dots = {
      1: [4],
      2: [0, 8],
      3: [0, 4, 8],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 1, 2, 6, 7, 8],
    };

    return (
      <motion.div
        key={index}
        initial={{ scale: 0, rotate: 0 }}
        animate={{ 
          scale: rolling ? [1, 1.2, 1] : 1,
          rotate: rolling ? [0, 360, 720] : 0,
        }}
        transition={{
          duration: rolling ? 1.5 : 0.5,
          repeat: rolling ? 3 : 0,
        }}
        className="dice mx-2"
      >
        <div className="grid grid-cols-3 gap-1 w-full h-full p-2">
          {Array.from({ length: 9 }, (_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                dots[value]?.includes(i) ? 'bg-gray-800' : 'bg-transparent'
              }`}
            />
          ))}
        </div>
      </motion.div>
    );
  };

  const getWinRate = () => {
    return gameState.totalGames > 0 
      ? Math.round((gameState.gamesWon / gameState.totalGames) * 100)
      : 0;
  };

  const getBetTypeDescription = () => {
    const type = betTypes.find(t => t.id === betType);
    return type ? type.description : '';
  };

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
    <div className="bg-gradient-to-br from-red-800 to-orange-800 rounded-xl p-8 min-h-[600px]">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Dice Betting Game</h2>
        <p className="text-orange-200">
          Test your luck with virtual credits
        </p>
      </div>

      {/* Stats Display */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-green-600/20 rounded-lg p-4 text-center border border-green-500/30">
          <div className="text-2xl font-bold text-green-400">{gameState.balance}</div>
          <div className="text-green-200 text-sm">Balance</div>
        </div>
        <div className="bg-blue-600/20 rounded-lg p-4 text-center border border-blue-500/30">
          <div className="text-2xl font-bold text-blue-400">{gameState.totalGames}</div>
          <div className="text-blue-200 text-sm">Total Games</div>
        </div>
        <div className="bg-purple-600/20 rounded-lg p-4 text-center border border-purple-500/30">
          <div className="text-2xl font-bold text-purple-400">{gameState.gamesWon}</div>
          <div className="text-purple-200 text-sm">Games Won</div>
        </div>
        <div className="bg-yellow-600/20 rounded-lg p-4 text-center border border-yellow-500/30">
          <div className="text-2xl font-bold text-yellow-400">{getWinRate()}%</div>
          <div className="text-yellow-200 text-sm">Win Rate</div>
        </div>
      </div>

      {/* Dice Display */}
      <div className="text-center mb-8">
        <h3 className="text-xl font-semibold text-white mb-4">
          {gameState.lastRoll.length > 0 
            ? `Last Roll: ${gameState.lastRoll.reduce((a, b) => a + b, 0)}`
            : 'Place your bet and roll!'
          }
        </h3>
        
        <div className="flex justify-center items-center mb-4">
          {gameState.lastRoll.length > 0 ? (
            gameState.lastRoll.map((value, index) => renderDice(value, index))
          ) : (
            [1, 1].map((value, index) => renderDice(value, index))
          )}
        </div>

        {/* Last Bet Result */}
        <AnimatePresence>
          {gameState.lastBet && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`text-lg font-semibold ${
                gameState.lastBet.won ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {gameState.lastBet.won 
                ? `Won ${gameState.lastPayout} credits! 🎉`
                : `Lost ${gameState.lastBet.amount} credits 😞`
              }
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Betting Interface */}
      <div className="max-w-md mx-auto space-y-6 mb-8">
        {/* Bet Amount */}
        <div>
          <label className="block text-white font-semibold mb-2">Bet Amount</label>
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min="10"
              max={Math.min(gameState.balance, 100)}
              value={betAmount}
              onChange={(e) => setBetAmount(parseInt(e.target.value))}
              className="flex-1"
              disabled={loading}
            />
            <span className="text-white font-bold w-12 text-center">{betAmount}</span>
          </div>
          <div className="flex justify-between text-sm text-orange-200 mt-1">
            <span>10</span>
            <span>{Math.min(gameState.balance, 100)}</span>
          </div>
        </div>

        {/* Bet Type */}
        <div>
          <label className="block text-white font-semibold mb-2">Bet Type</label>
          <select
            value={betType}
            onChange={(e) => setBetType(e.target.value)}
            disabled={loading}
            className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white"
          >
            {betTypes.map(type => (
              <option key={type.id} value={type.id} className="bg-gray-800">
                {type.name} ({type.payout})
              </option>
            ))}
          </select>
          <p className="text-orange-200 text-sm mt-1">{getBetTypeDescription()}</p>
        </div>

        {/* Exact Target (if exact bet type) */}
        {betType === 'exact' && (
          <div>
            <label className="block text-white font-semibold mb-2">Target Number</label>
            <select
              value={exactTarget}
              onChange={(e) => setExactTarget(parseInt(e.target.value))}
              disabled={loading}
              className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white"
            >
              {Array.from({ length: 11 }, (_, i) => i + 2).map(num => (
                <option key={num} value={num} className="bg-gray-800">
                  {num} (Payout: {[30,15,10,8,6,5,6,8,10,15,30][num-2]}x)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Roll Button */}
      <div className="text-center mb-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={placeBet}
          disabled={loading || betAmount > gameState.balance || gameState.balance < 10}
          className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white px-12 py-4 rounded-lg font-bold text-lg transition-all duration-300"
        >
          {rolling ? 'Rolling...' : loading ? 'Processing...' : `Roll Dice (${betAmount} credits)`}
        </motion.button>
        
        {gameState.balance < 10 && (
          <p className="text-red-400 mt-2">Insufficient balance to place minimum bet (10 credits)</p>
        )}
      </div>

      {/* Reset Game */}
      <div className="text-center mb-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={startNewGame}
          disabled={loading}
          className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
        >
          {loading ? 'Resetting...' : 'Reset Game'}
        </motion.button>
      </div>

      {/* Stake.us Promotion */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-md rounded-lg p-6 border border-white/20 text-center">
        <p className="text-blue-200 mb-4">
          Ready to play with real money? Check out Stake.us dice games!
        </p>
        <a
          href="https://stake.us/casino/game/keno?c=RIPCITYTICKETS"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
        >
          Play Real Money Games
        </a>
      </div>
    </div>
  );
};

export default DiceGame;
