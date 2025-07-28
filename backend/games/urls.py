from django.urls import path
from .views import (
    CreateGameView, 
    BlackjackActionView, 
    RPSActionView, 
    DiceActionView, 
    GameStatusView
)

urlpatterns = [
    path('create/', CreateGameView.as_view(), name='create_game'),
    path('blackjack/<str:session_id>/', BlackjackActionView.as_view(), name='blackjack_action'),
    path('rps/<str:session_id>/', RPSActionView.as_view(), name='rps_action'),
    path('dice/<str:session_id>/', DiceActionView.as_view(), name='dice_action'),
    path('status/<str:session_id>/', GameStatusView.as_view(), name='game_status'),
]
