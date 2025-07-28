from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import GameSession, BlackjackGame, RPSGame, DiceGame
from .game_logic import BlackjackLogic, RPSLogic, DiceLogic, GameSessionManager
import json


class CreateGameView(APIView):
    """Create a new game session"""
    
    def post(self, request):
        game_type = request.data.get('game_type')
        if game_type not in ['blackjack', 'rps', 'dice']:
            return Response(
                {'error': 'Invalid game type'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        session_id = GameSessionManager.create_session_id()
        
        # Create game session
        session = GameSession.objects.create(
            game_type=game_type,
            session_id=session_id
        )
        
        # Create specific game instance
        if game_type == 'blackjack':
            blackjack_logic = BlackjackLogic()
            deck = blackjack_logic.create_deck()
            
            # Deal initial cards
            player_hand = [deck.pop(), deck.pop()]
            dealer_hand = [deck.pop(), deck.pop()]
            
            game = BlackjackGame.objects.create(
                session=session,
                player_hand=player_hand,
                dealer_hand=dealer_hand,
                deck=deck,
                player_score=blackjack_logic.calculate_hand_value(player_hand),
                dealer_score=blackjack_logic.calculate_hand_value([dealer_hand[0]])  # Only show one dealer card
            )
            
            return Response({
                'session_id': session_id,
                'game_type': game_type,
                'player_hand': player_hand,
                'dealer_hand': [dealer_hand[0], {'hidden': True}],  # Hide dealer's second card
                'player_score': game.player_score,
                'dealer_score': blackjack_logic.calculate_hand_value([dealer_hand[0]]),
                'can_hit': True,
                'can_stand': True,
                'game_status': 'playing'
            })
            
        elif game_type == 'rps':
            game = RPSGame.objects.create(session=session)
            return Response({
                'session_id': session_id,
                'game_type': game_type,
                'player_score': 0,
                'computer_score': 0,
                'moves': ['rock', 'paper', 'scissors']
            })
            
        elif game_type == 'dice':
            game = DiceGame.objects.create(session=session)
            return Response({
                'session_id': session_id,
                'game_type': game_type,
                'balance': 1000,
                'min_bet': 10,
                'max_bet': 100,
                'bet_types': ['over', 'under', 'seven', 'exact']
            })


class BlackjackActionView(APIView):
    """Handle blackjack game actions"""
    
    def post(self, request, session_id):
        action = request.data.get('action')
        
        try:
            session = GameSession.objects.get(session_id=session_id, game_type='blackjack')
            game = session.blackjackgame
            blackjack_logic = BlackjackLogic()
            
            if action == 'hit':
                # Player takes another card
                if game.deck:
                    new_card = game.deck.pop()
                    game.player_hand.append(new_card)
                    game.player_score = blackjack_logic.calculate_hand_value(game.player_hand)
                    
                    # Check for bust
                    if blackjack_logic.is_bust(game.player_hand):
                        game.game_status = 'lost'
                    
                    game.save()
                
            elif action == 'stand':
                # Player stands, dealer plays
                dealer_hand = game.dealer_hand
                deck = game.deck
                
                # Dealer must hit on 16 and below, stand on 17 and above
                while blackjack_logic.calculate_hand_value(dealer_hand) < 17 and deck:
                    dealer_hand.append(deck.pop())
                
                dealer_score = blackjack_logic.calculate_hand_value(dealer_hand)
                player_score = game.player_score
                
                # Determine winner
                if blackjack_logic.is_bust(dealer_hand):
                    game.game_status = 'won'
                elif dealer_score > player_score:
                    game.game_status = 'lost'
                elif player_score > dealer_score:
                    game.game_status = 'won'
                else:
                    game.game_status = 'push'
                
                game.dealer_hand = dealer_hand
                game.dealer_score = dealer_score
                game.deck = deck
                game.save()
            
            return Response({
                'session_id': session_id,
                'player_hand': game.player_hand,
                'dealer_hand': game.dealer_hand if action == 'stand' else [game.dealer_hand[0], {'hidden': True}],
                'player_score': game.player_score,
                'dealer_score': game.dealer_score if action == 'stand' else blackjack_logic.calculate_hand_value([game.dealer_hand[0]]),
                'game_status': game.game_status,
                'can_hit': game.game_status == 'playing' and not blackjack_logic.is_bust(game.player_hand),
                'can_stand': game.game_status == 'playing'
            })
            
        except GameSession.DoesNotExist:
            return Response(
                {'error': 'Game session not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )


class RPSActionView(APIView):
    """Handle Rock Paper Scissors actions"""
    
    def post(self, request, session_id):
        player_move = request.data.get('move')
        
        try:
            session = GameSession.objects.get(session_id=session_id, game_type='rps')
            game = session.rpsgame
            rps_logic = RPSLogic()
            
            # Get computer move using pattern recognition
            computer_move = rps_logic.analyze_pattern(game.player_moves)
            
            # Determine winner
            result = rps_logic.determine_winner(player_move, computer_move)
            
            # Update game state
            game.player_moves.append(player_move)
            game.computer_moves.append(computer_move)
            game.results.append(result)
            
            if result == 'player':
                game.player_score += 1
            elif result == 'computer':
                game.computer_score += 1
            
            game.save()
            
            return Response({
                'session_id': session_id,
                'player_move': player_move,
                'computer_move': computer_move,
                'result': result,
                'player_score': game.player_score,
                'computer_score': game.computer_score,
                'total_rounds': len(game.results)
            })
            
        except GameSession.DoesNotExist:
            return Response(
                {'error': 'Game session not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )


class DiceActionView(APIView):
    """Handle dice game actions"""
    
    def post(self, request, session_id):
        bet_amount = request.data.get('bet_amount')
        bet_type = request.data.get('bet_type')
        target = request.data.get('target')  # For exact bets
        
        try:
            session = GameSession.objects.get(session_id=session_id, game_type='dice')
            game = session.dicegame
            dice_logic = DiceLogic()
            
            if bet_amount > game.player_balance:
                return Response(
                    {'error': 'Insufficient balance'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Roll dice
            dice_roll = dice_logic.roll_dice()
            dice_total = sum(dice_roll)
            
            # Calculate payout
            payout = dice_logic.calculate_payout(bet_amount, dice_total, bet_type, target)
            
            # Update balance
            game.player_balance -= bet_amount
            game.player_balance += payout
            game.current_bet = bet_amount
            game.last_roll = dice_roll
            game.total_games += 1
            
            if payout > 0:
                game.games_won += 1
            
            game.save()
            
            return Response({
                'session_id': session_id,
                'dice_roll': dice_roll,
                'dice_total': dice_total,
                'bet_amount': bet_amount,
                'bet_type': bet_type,
                'payout': payout,
                'new_balance': game.player_balance,
                'won': payout > 0,
                'total_games': game.total_games,
                'games_won': game.games_won
            })
            
        except GameSession.DoesNotExist:
            return Response(
                {'error': 'Game session not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )


class GameStatusView(APIView):
    """Get current game status"""
    
    def get(self, request, session_id):
        try:
            session = GameSession.objects.get(session_id=session_id)
            
            if session.game_type == 'blackjack':
                game = session.blackjackgame
                return Response({
                    'session_id': session_id,
                    'game_type': 'blackjack',
                    'player_hand': game.player_hand,
                    'dealer_hand': game.dealer_hand,
                    'player_score': game.player_score,
                    'dealer_score': game.dealer_score,
                    'game_status': game.game_status
                })
            elif session.game_type == 'rps':
                game = session.rpsgame
                return Response({
                    'session_id': session_id,
                    'game_type': 'rps',
                    'player_score': game.player_score,
                    'computer_score': game.computer_score,
                    'total_rounds': len(game.results)
                })
            elif session.game_type == 'dice':
                game = session.dicegame
                return Response({
                    'session_id': session_id,
                    'game_type': 'dice',
                    'balance': game.player_balance,
                    'total_games': game.total_games,
                    'games_won': game.games_won
                })
                
        except GameSession.DoesNotExist:
            return Response(
                {'error': 'Game session not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

# Create your views here.
