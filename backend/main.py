import requests

respose = requests.get("https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1")
deck_data = respose.json()
deck_id = deck_data["deck_id"]

draw_url = f"https://deckofcardsapi.com/api/deck/{deck_id}/draw/?count=10"
draw_response = requests.get(draw_url).json()

for card in draw_response['cards']:
    print(f"{card['value']} of {card['suit']}")

#print("Program started")