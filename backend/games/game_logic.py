import random
import uuid
from typing import List, Dict, Tuple, Any

class BlackjackLogic:
    """Blackjack game logic implementation"""
    
    def __init__(self):
        self.suits = ['♠', '♥', '♦', '♣']
        self.ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
        
    def create_deck(self) -> List[Dict[str, Any]]:
        """Create and shuffle a standard 52-card deck"""
        deck = []
        for suit in self.suits:
            for rank in self.ranks:
                value = 11 if rank == 'A' else 10 if rank in ['J', 'Q', 'K'] else int(rank)
                deck.append({
                    'suit': suit,
                    'rank': rank,
                    'value': value
                })
        random.shuffle(deck)
        return deck
    
    def calculate_hand_value(self, hand: List[Dict[str, Any]]) -> int:
        """Calculate the value of a hand, handling Aces properly"""
        total = 0
        aces = 0
        
        for card in hand:
            if card['rank'] == 'A':
                aces += 1
                total += 11
            else:
                total += card['value']
        
        # Adjust for Aces
        while total > 21 and aces > 0:
            total -= 10
            aces -= 1
            
        return total
    
    def is_bust(self, hand: List[Dict[str, Any]]) -> bool:
        """Check if hand is bust (over 21)"""
        return self.calculate_hand_value(hand) > 21
    
    def is_blackjack(self, hand: List[Dict[str, Any]]) -> bool:
        """Check if hand is blackjack (21 with 2 cards)"""
        return len(hand) == 2 and self.calculate_hand_value(hand) == 21


class RPSLogic:
    """Rock Paper Scissors with pattern recognition"""
    
    def __init__(self):
        self.moves = ['rock', 'paper', 'scissors']
        self.winning_moves = {
            'rock': 'scissors',
            'paper': 'rock',
            'scissors': 'paper'
        }
    
    def determine_winner(self, player_move: str, computer_move: str) -> str:
        """Determine the winner of a single round"""
        if player_move == computer_move:
            return 'tie'
        elif self.winning_moves[player_move] == computer_move:
            return 'player'
        else:
            return 'computer'
    
    def analyze_pattern(self, player_moves: List[str]) -> str:
        """Simple pattern recognition for computer strategy"""
        if len(player_moves) < 3:
            return random.choice(self.moves)
        
        # Look for patterns in last few moves
        recent_moves = player_moves[-3:]
        
        # Check for repeated moves
        if len(set(recent_moves)) == 1:
            # Player is repeating, counter their move
            counter_move = [move for move, beats in self.winning_moves.items() 
                          if beats == recent_moves[-1]][0]
            return counter_move
        
        # Check for alternating pattern
        if len(player_moves) >= 2:
            last_move = player_moves[-1]
            # Try to predict next move and counter it
            move_frequency = {}
            for move in player_moves:
                move_frequency[move] = move_frequency.get(move, 0) + 1
            
            # Choose counter to most frequent move
            most_frequent = max(move_frequency, key=move_frequency.get)
            counter_move = [move for move, beats in self.winning_moves.items() 
                          if beats == most_frequent][0]
            return counter_move
        
        return random.choice(self.moves)


class DiceLogic:
    """Simple dice betting game logic"""
    
    def __init__(self):
        self.min_bet = 10
        self.max_bet = 100
    
    def roll_dice(self, num_dice: int = 2) -> List[int]:
        """Roll specified number of dice"""
        return [random.randint(1, 6) for _ in range(num_dice)]
    
    def calculate_payout(self, bet: int, dice_total: int, bet_type: str, target: int = None) -> int:
        """Calculate payout based on bet type and result"""
        if bet_type == 'over':
            # Bet that total will be over 7
            if dice_total > 7:
                return bet * 2
        elif bet_type == 'under':
            # Bet that total will be under 7
            if dice_total < 7:
                return bet * 2
        elif bet_type == 'exact' and target:
            # Bet on exact total
            if dice_total == target:
                payouts = {2: 30, 3: 15, 4: 10, 5: 8, 6: 6, 7: 5, 8: 6, 9: 8, 10: 10, 11: 15, 12: 30}
                return bet * payouts.get(target, 5)
        elif bet_type == 'seven':
            # Bet that total will be exactly 7
            if dice_total == 7:
                return bet * 5
        
        return 0  # Lost bet


class GameSessionManager:
    """Manages game sessions and state"""
    
    @staticmethod
    def create_session_id() -> str:
        """Generate unique session ID"""
        return str(uuid.uuid4())
    
    @staticmethod
    def validate_session(session_data: Dict) -> bool:
        """Validate session data"""
        required_fields = ['game_type', 'session_id']
        return all(field in session_data for field in required_fields)
