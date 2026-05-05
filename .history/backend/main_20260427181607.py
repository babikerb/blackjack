from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

CARD_API = "https://deckofcardsapi.com/api/deck"


@app.get("/game/stand")
def stand(deck_id: str):
    drawn = requests.get(f"{CARD_API}/{deck_id}/draw/?count=1").json()
    return {"card": drawn["cards"][0]}

@app.post("/game/hit")
def hit(deck_id: str):
    drawn = requests.get(f"{CARD_API}/{deck_id}/draw/?count=1").json()
    return {"card": drawn["cards"][0]}


@app.post("/game/new")
def new_game():
    deck = requests.get(f"{CARD_API}/new/shuffle/?deck_count=1").json()
    deck_id = deck["deck_id"]

    # 4 cards: player, dealer, player, dealer
    drawn = requests.get(f"{CARD_API}/{deck_id}/draw/?count=4").json()
    cards = drawn["cards"]

    player_cards = [cards[0], cards[2]]
    dealer_cards = [cards[1], cards[3]]

    return {
        "deck_id": deck_id,
        "player_cards": player_cards,
        "dealer_cards": dealer_cards,
    }


# cd backend
# python -m venv venv
# source venv/bin/activate or on windows it would be source venv\Scripts\activate
# pip install -r requirements.txt
# uvicorn main:app --reload

# then go to localhost:8000/docs to test endpoints