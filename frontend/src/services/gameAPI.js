// API service for communicating with Django backend
const API_BASE_URL = 'http://localhost:8000/api/games';

class GameAPI {
  static async createGame(gameType) {
    try {
      const response = await fetch(`${API_BASE_URL}/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ game_type: gameType }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating game:', error);
      throw error;
    }
  }

  static async blackjackAction(sessionId, action) {
    try {
      const response = await fetch(`${API_BASE_URL}/blackjack/${sessionId}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error with blackjack action:', error);
      throw error;
    }
  }

  static async rpsAction(sessionId, move) {
    try {
      const response = await fetch(`${API_BASE_URL}/rps/${sessionId}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ move }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error with RPS action:', error);
      throw error;
    }
  }

  static async diceAction(sessionId, betAmount, betType, target = null) {
    try {
      const response = await fetch(`${API_BASE_URL}/dice/${sessionId}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          bet_amount: betAmount, 
          bet_type: betType,
          target 
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error with dice action:', error);
      throw error;
    }
  }

  static async getGameStatus(sessionId) {
    try {
      const response = await fetch(`${API_BASE_URL}/status/${sessionId}/`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting game status:', error);
      throw error;
    }
  }
}

export default GameAPI;
