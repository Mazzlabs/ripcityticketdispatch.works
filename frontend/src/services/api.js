const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/games';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Game session management
  async createGame(gameType) {
    return this.request('/create/', {
      method: 'POST',
      body: { game_type: gameType },
    });
  }

  async getGameStatus(sessionId) {
    return this.request(`/status/${sessionId}/`);
  }

  // Blackjack specific
  async blackjackAction(sessionId, action) {
    return this.request(`/blackjack/${sessionId}/`, {
      method: 'POST',
      body: { action },
    });
  }

  // Rock Paper Scissors specific
  async rpsMove(sessionId, move) {
    return this.request(`/rps/${sessionId}/`, {
      method: 'POST',
      body: { move },
    });
  }

  // Dice game specific
  async placeBet(sessionId, betAmount, betType, target = null) {
    return this.request(`/dice/${sessionId}/`, {
      method: 'POST',
      body: { bet_amount: betAmount, bet_type: betType, target },
    });
  }
}

export default new ApiService();
