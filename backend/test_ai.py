from ai import hand_score, basic_strategy, build_remaining_deck, _draw_random

def new_deck() -> dict[str, int]:
    return build_remaining_deck([])

def draw_card(deck: dict[str, int]) -> str:
    return _draw_random(deck)

def play_dealer(deck: dict[str, int], dealer_hand: list[str]) -> list[str]:
    while hand_score(dealer_hand)[0] < 17:
        dealer_hand.append(draw_card(deck))
    return dealer_hand

def outcome(player: list[str], dealer: list[str]) -> str:
    p, _ = hand_score(player)
    d, _ = hand_score(dealer)
    if p > 21:
        return "lose"
    if d > 21 or p > d:
        return "win"
    if p < d:
        return "lose"
    return "push"


GAMES = 1000
wins = losses = pushes = 0

print(f"running {GAMES} simulated games...\n")
print(f"{'#':<6} {'player':<28} {'dealer up':<10} {'action':<8} {'p score':<9} {'d score':<9} result")
print("-" * 80)

for i in range(1, GAMES + 1):
    deck = new_deck()

    player = [draw_card(deck), draw_card(deck)]
    dealer_up = draw_card(deck)
    dealer_hand = [dealer_up, draw_card(deck)]

    action = basic_strategy(player, dealer_up)
    first_action = action
    while action == "hit":
        player.append(draw_card(deck))
        if hand_score(player)[0] >= 21:
            break
        action = basic_strategy(player, dealer_up)

    dealer_hand = play_dealer(deck, dealer_hand)
    result = outcome(player, dealer_hand)

    if result == "win":
        wins += 1
    elif result == "lose":
        losses += 1
    else:
        pushes += 1

    p_score, _ = hand_score(player)
    d_score, _ = hand_score(dealer_hand)
    marker = "✓" if result == "win" else "✗" if result == "lose" else "~"
    print(f"{i:<6} {str(player):<28} {dealer_up:<10} {first_action:<8} {p_score:<9} {d_score:<9} {marker} {result}")

print("-" * 80)
print(f"\nresults over {GAMES} games:")
print(f"  wins:   {wins:<4} ({wins / GAMES * 100:.1f}%)")
print(f"  losses: {losses:<4} ({losses / GAMES * 100:.1f}%)")
print(f"  pushes: {pushes:<4} ({pushes / GAMES * 100:.1f}%)")

# 1000 simulated games using basic strategy (hit/stand only)
# - Wins: 421 (42.1%)
# - Losses: 488 (48.8%)
# - Pushes: 91 (9.1%)
#
# the main rules:
# - stand on 17 or higher, always
# - if dealer shows 2-6 they have to keep drawing and will probably bust, so stand and wait
# - if dealer shows 7 or higher they're already strong, so you need to hit and try to beat them
# - if you have an ace it counts as 11 until it would bust you, so you can hit more freely
#
# 42.1% win rate matches what basic strategy is supposed to get you (~42-43%)
# you still lose more than you win because you go first and can bust before the dealer even plays