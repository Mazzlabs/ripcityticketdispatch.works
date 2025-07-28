from django.db import models
import json

class GameSession(models.Model):
    """Base model for all game sessions"""
    GAME_TYPES = [
        ('blackjack', 'Blackjack'),
        ('rps', 'Rock Paper Scissors'),
        ('dice', 'Dice Game'),
    ]
    
    game_type = models.CharField(max_length=20, choices=GAME_TYPES)
    session_id = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    game_state = models.JSONField(default=dict)
    
    def __str__(self):
        return f"{self.game_type} - {self.session_id}"

class BlackjackGame(models.Model):
    """Specific model for Blackjack games"""
    session = models.OneToOneField(GameSession, on_delete=models.CASCADE)
    player_hand = models.JSONField(default=list)
    dealer_hand = models.JSONField(default=list)
    deck = models.JSONField(default=list)
    player_score = models.IntegerField(default=0)
    dealer_score = models.IntegerField(default=0)
    game_status = models.CharField(max_length=20, default='playing')  # playing, won, lost, push
    
    def __str__(self):
        return f"Blackjack {self.session.session_id} - {self.game_status}"

class RPSGame(models.Model):
    """Rock Paper Scissors with pattern recognition"""
    session = models.OneToOneField(GameSession, on_delete=models.CASCADE)
    player_moves = models.JSONField(default=list)
    computer_moves = models.JSONField(default=list)
    results = models.JSONField(default=list)  # win, lose, tie
    player_score = models.IntegerField(default=0)
    computer_score = models.IntegerField(default=0)
    pattern_data = models.JSONField(default=dict)  # For pattern recognition
    
    def __str__(self):
        return f"RPS {self.session.session_id} - {self.player_score}:{self.computer_score}"

class DiceGame(models.Model):
    """Simple dice betting game"""
    session = models.OneToOneField(GameSession, on_delete=models.CASCADE)
    player_balance = models.IntegerField(default=1000)  # Virtual credits
    current_bet = models.IntegerField(default=0)
    last_roll = models.JSONField(default=list)
    total_games = models.IntegerField(default=0)
    games_won = models.IntegerField(default=0)
    
    def __str__(self):
        return f"Dice {self.session.session_id} - Balance: {self.player_balance}"

# Create your models here.
