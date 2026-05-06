from __future__ import annotations

import random
from typing import Literal

Action = Literal["hit", "stand"]

RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
FULL_DECK = {rank: 4 for rank in RANKS}


# --- helpers ---

# returns the numeric value of a card rank, aces are 11 by default
def card_value(rank: str) -> int:
    if rank == "A":
        return 11
    if rank in ("J", "Q", "K"):
        return 10
    return int(rank)

# returns (score, is_soft), handles ace reduction when busting
def hand_score(ranks: list[str]) -> tuple[int, bool]:
    total = sum(card_value(r) for r in ranks)
    aces = ranks.count("A")
    while total > 21 and aces > 0:
        total -= 10
        aces -= 1
    is_soft = aces > 0 and total <= 21
    return total, is_soft

# returns true if the hand is over 21
def is_bust(ranks: list[str]) -> bool:
    score, _ = hand_score(ranks)
    return score > 21

# builds a rank -> count map of cards that havent been seen yet
# used by both algorithms to know whats left in the shoe
def build_remaining_deck(seen_ranks: list[str], num_decks: int = 1) -> dict[str, int]:
    remaining = {rank: count * num_decks for rank, count in FULL_DECK.items()}
    for rank in seen_ranks:
        if remaining.get(rank, 0) > 0:
            remaining[rank] -= 1
    return remaining


# --- basic strategy ---

# returns hit or stand based on standard basic strategy
# covers hard totals and soft totals
def basic_strategy(
    player_ranks: list[str],
    dealer_upcard: str,
) -> Action:
    score, is_soft = hand_score(player_ranks)
    dval = card_value(dealer_upcard)

    if is_soft:
        if score >= 18 and dval <= 8:
            return "stand"
        if score >= 19:
            return "stand"
        return "hit"

    if score >= 17:
        return "stand"
    if score >= 13 and dval <= 6:
        return "stand"
    if score == 12 and dval in (4, 5, 6):
        return "stand"
    return "hit"


# --- expectimax ---

# runs expectimax over the game tree up to depth plies
# returns the best action and a dict of expected values per action
def expectimax_action(
    player_ranks: list[str],
    dealer_upcard: str,
    remaining_deck: dict[str, int],
    depth: int = 4,
) -> tuple[Action, dict[Action, float]]:
    ...

# recursive helper, not called directly by routes
# at each node, weighs every possible draw by its probability in the remaining deck
def _expectimax(
    player_ranks: list[str],
    dealer_ranks: list[str],
    remaining_deck: dict[str, int],
    depth: int,
) -> float:
    ...

# computes the expected outcome when the player stands
# used as the leaf evaluation in expectimax
def _resolve_stand(
    player_ranks: list[str],
    dealer_ranks: list[str],
    remaining_deck: dict[str, int],
) -> float:
    ...

# simulates all possible dealer completions (dealer hits to 17)
# returns the dealers expected final score weighted by card probabilities
def _dealer_expected_score(
    dealer_ranks: list[str],
    remaining_deck: dict[str, int],
) -> float:
    ...


# --- monte carlo ---

# 10 | J | Q | K --> 10 value
# 1-9 --> 1-9 values
# A --> 1/11 value

# draws a random card rank weighted by whats left in the deck
# mutates remaining_deck in place
def _draw_random(remaining_deck: dict[str, int]) -> str:
    pool = [rank for rank, count in remaining_deck.items() for _ in range(count)]
    if not pool:
        return ""
    card = random.choice(pool)
    remaining_deck[card] -= 1
    return card


# plays out one random hand given an initial action
# returns +1 for win, 0 for push, -1 for loss
def _simulate_hand(
    player_ranks: list[str],
    dealer_upcard: str,
    action: Action,
    remaining_deck: dict[str, int],
) -> float:
    
    player_hand = player_ranks.copy()
    dealer_hand = dealer_upcard
    remaining_cards = remaining_deck.copy()
    
    if (action == 'hit'):
        player_hand.append(_draw_random(remaining_cards))
        if is_bust(player_hand):
            return -1


    player_score, _ = hand_score(player_hand)
    dealer_hand.append(_draw_random(remaining_cards))

    while hand_score(dealer_hand)[0] < 17:
        dealer_hand.append(_draw_random(remaining_cards))

    dealer_score, _ = hand_score(dealer_hand)

    if (dealer_score < player_score):
        return 1
    elif (dealer_score > player_score):
        return -1
    else:
        return 0

        

# estimates win rate for hit vs stand via random rollouts
# returns the best action and a dict of win rates per action
def monte_carlo_action(
    player_ranks: list[str],
    dealer_upcard: str,
    remaining_deck: dict[str, int],
    num_simulations: int = 1000
) -> tuple[Action, dict[Action, float]]:

    
    # Grab data pertaining to the player's hand
    # Dealer's single flipped card
    # And the remaining cards in the deck

    players_hand = player_ranks.copy()
    dealers_card = dealer_upcard

    simulation_quantity = num_simulations

    hit_amount = stand_amount = hit_percentage = stand_percentage = 0

    for _ in range(simulation_quantity):
        hit_amount += _simulate_hand(players_hand, dealers_card, 'hit', remaining_deck.copy())
        stand_amount += _simulate_hand(players_hand, dealers_card, 'stand', remaining_deck.copy())

    hit_ev = hit_amount / num_simulations
    stand_ev = stand_amount / num_simulations

    if (hit_ev > stand_ev):
        return 'hit', {'hit': hit_ev, 'stand': stand_ev }
    else:
        return 'stand', {'hit': hit_ev, 'stand': stand_ev}



# --- api ---

# top level function called by the fastapi route
# returns {"action": "hit"|"stand", "scores": {action: float}, "method": ...}
def recommend(
    player_ranks: list[str],
    dealer_upcard: str,
    seen_ranks: list[str],
    method: Literal["expectimax", "montecarlo", "basic"] = "montecarlo",
    num_decks: int = 1,
) -> dict:
    ...
