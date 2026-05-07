from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import requests
import os
from ai import recommend as ai_recommend

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

CARD_API = "https://deckofcardsapi.com/api/deck"


class RecommendRequest(BaseModel):
    player_cards: list[str]
    dealer_upcard: str
    seen_cards: list[str]
    method: str = "montecarlo"


@app.post("/game/recommend")
def recommend(req: RecommendRequest):
    return ai_recommend(req.player_cards, req.dealer_upcard, req.seen_cards, req.method)


@app.post("/game/stand")
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


DIST = os.path.join(os.path.dirname(__file__), "..", "dist")
if os.path.exists(DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        return FileResponse(os.path.join(DIST, "index.html"))


# cd backend
# python -m venv venv
# source venv/bin/activate or on windows it would be source venv\Scripts\activate
# pip install -r requirements.txt
# uvicorn main:app --reload

# then go to localhost:8000/docs to test endpoints