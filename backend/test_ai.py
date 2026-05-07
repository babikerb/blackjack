import random
from ai import hand_score, basic_strategy, monte_carlo_action, build_remaining_deck, _draw_random

TEN_RANKS = {'10', 'J', 'Q', 'K'}


def is_blackjack(hand):
    return len(hand) == 2 and 'A' in hand and bool(TEN_RANKS & set(hand))


def play_dealer(deck, dealer_hand):
    while hand_score(dealer_hand)[0] < 17:
        dealer_hand.append(_draw_random(deck))
    return dealer_hand


def outcome(player, dealer):
    p, _ = hand_score(player)
    d, _ = hand_score(dealer)
    if p > 21: return "bust"
    if d > 21 or p > d: return "win"
    if p < d: return "lose"
    return "push"


def play(player, dealer_up, dealer_hidden, deck, strategy):
    player = list(player)
    dealer_hand = [dealer_up, dealer_hidden]

    player_bj = is_blackjack(player)
    dealer_bj = is_blackjack(dealer_hand)
    if player_bj or dealer_bj:
        if player_bj and dealer_bj: return player, dealer_hand, "push", "blackjack"
        if dealer_bj: return player, dealer_hand, "lose", "blackjack"
        return player, dealer_hand, "win", "blackjack"

    if strategy == "basic":
        action = basic_strategy(player, dealer_up)
        first = action
        while action == "hit":
            player.append(_draw_random(deck))
            score = hand_score(player)[0]
            if score > 21: return player, dealer_hand, "bust", first
            if score == 21: break
            action = basic_strategy(player, dealer_up)
    else:
        seen = player + [dealer_up]
        action, _ = monte_carlo_action(player, dealer_up, build_remaining_deck(seen, num_decks=1), num_simulations=3000)
        first = action
        while action == "hit":
            player.append(_draw_random(deck))
            score = hand_score(player)[0]
            if score > 21: return player, dealer_hand, "bust", first
            if score == 21: break
            seen = player + [dealer_up]
            action, _ = monte_carlo_action(player, dealer_up, build_remaining_deck(seen, num_decks=1), num_simulations=3000)

    dealer_hand = play_dealer(deck, dealer_hand)
    return player, dealer_hand, outcome(player, dealer_hand), first


GAMES = 1000
random.seed(42)
hands = []
for _ in range(GAMES):
    deck = build_remaining_deck([])
    hands.append(([_draw_random(deck), _draw_random(deck)], _draw_random(deck), _draw_random(deck), deck))

bs_wins = bs_losses = bs_pushes = 0
mc_wins = mc_losses = mc_pushes = 0

print(f"Running {GAMES} games... (this may take a while)")

for i, (start, dup, dhid, extra) in enumerate(hands, 1):
    bp, bd, br, ba = play(start, dup, dhid, dict(extra), "basic")
    mp, md, mr, ma = play(start, dup, dhid, dict(extra), "montecarlo")

    if br in ("win", "blackjack"): bs_wins += 1
    elif br in ("lose", "bust"):   bs_losses += 1
    else:                           bs_pushes += 1

    if mr in ("win", "blackjack"): mc_wins += 1
    elif mr in ("lose", "bust"):   mc_losses += 1
    else:                           mc_pushes += 1

    if i % 100 == 0:
        print(f"  {i}/{GAMES} games done...")
print(f"\n{'':=<60}")
print(f"  {GAMES} GAMES — RESULTS AGAINST THE DEALER")
print(f"{'':=<60}")
print(f"  {'':18} {'BASIC STRATEGY':>16}   {'MONTE CARLO':>11}")
print(f"  {'wins':<18} {bs_wins:>8} ({bs_wins/GAMES*100:.1f}%)   {mc_wins:>5} ({mc_wins/GAMES*100:.1f}%)")
print(f"  {'losses':<18} {bs_losses:>8} ({bs_losses/GAMES*100:.1f}%)   {mc_losses:>5} ({mc_losses/GAMES*100:.1f}%)")
print(f"  {'pushes':<18} {bs_pushes:>8} ({bs_pushes/GAMES*100:.1f}%)   {mc_pushes:>5} ({mc_pushes/GAMES*100:.1f}%)")
print(f"{'':=<60}")
