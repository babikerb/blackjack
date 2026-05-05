from __future__ import annotations

import random
from typing import Literal

Action = Literal["hit", "stand", "double", "split"]

RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
FULL_DECK = {rank: 4 for rank in RANKS}


# --- helpers ---
def card_value(rank: str) -> int:
    # returns the numeric value of a card rank, aces are 11 by default
    ...


def hand_score(ranks: list[str]) -> tuple[int, bool]:
    # returns (score, is_soft), handles ace reduction when busting
    ...


def is_bust(ranks: list[str]) -> bool:
    # returns true if the hand is over 21
    ...


def build_remaining_deck(seen_ranks: list[str], num_decks: int = 1) -> dict[str, int]:
    # builds a rank -> count map of cards that havent been seen yet
    # used by both algorithms to know whats left in the shoe
    ...


# --- basic strategy ---
def basic_strategy(
    player_ranks: list[str],
    dealer_upcard: str,
    can_double: bool = True,
    can_split: bool = True,
) -> Action:
    # returns the textbook basic strategy action for the given hand
    # covers hard totals, soft totals, and pairs
    # useful as a sanity check against the ai methods
    ...


# --- expectimax ---
def expectimax_action(
    player_ranks: list[str],
    dealer_upcard: str,
    remaining_deck: dict[str, int],
    depth: int = 4,
) -> tuple[Action, dict[Action, float]]:
    # runs expectimax over the game tree up to depth plies
    # returns the best action and a dict of expected values per action
    # so we can show confidence scores on the frontend, not just the top pick
    ...


def _expectimax(
    player_ranks: list[str],
    dealer_ranks: list[str],
    remaining_deck: dict[str, int],
    depth: int,
) -> float:
    # recursive helper, not called directly by routes
    # at each node, weighs every possible draw by its probability in the remaining deck
    ...


def _resolve_stand(
    player_ranks: list[str],
    dealer_ranks: list[str],
    remaining_deck: dict[str, int],
) -> float:
    # computes the expected outcome when the player stands
    # used as the leaf evaluation in expectimax
    ...


def _dealer_expected_score(
    dealer_ranks: list[str],
    remaining_deck: dict[str, int],
) -> float:
    # simulates all possible dealer completions (dealer hits to 17)
    # returns the dealers expected final score weighted by card probabilities
    ...


# --- monte carlo ---
def monte_carlo_action(
    player_ranks: list[str],
    dealer_upcard: str,
    remaining_deck: dict[str, int],
    num_simulations: int = 10_000,
) -> tuple[Action, dict[Action, float]]:
    # estimates win rate for each action by running random rollouts
    # returns the best action and a dict of win rates per action
    # same return shape as expectimax so the frontend can treat both the same
    ...


def _simulate_hand(
    player_ranks: list[str],
    dealer_upcard: str,
    action: Action,
    remaining_deck: dict[str, int],
) -> float:
    # plays out one random hand given an initial action
    # returns +1 for win, 0 for push, -1 for loss
    ...


def _draw_random(remaining_deck: dict[str, int]) -> str:
    # draws a random card rank weighted by whats left in the deck
    # mutates remaining_deck in place
    ...


# --- api ---
def recommend(
    player_ranks: list[str],
    dealer_upcard: str,
    seen_ranks: list[str],
    method: Literal["expectimax", "montecarlo", "basic"] = "montecarlo",
    num_decks: int = 1,
) -> dict:
    # top level function called by the fastapi route
    # returns {"action": ..., "scores": {action: float}, "method": ...}
    ...
