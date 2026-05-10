# Blackjack
Babiker Babiker | Arturo Roman Morales

A browser-based Blackjack game with an AI recommendation system built using Monte Carlo simulation and Basic Strategy.

## How to run

**Backend**

```
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Runs at localhost:8000.

**Frontend** (in a separate terminal)

```
npm install
npm run dev
```

Runs at localhost:5173.

---

## Code layout

```
blackjack/
├── backend/
│   ├── main.py          FastAPI server. Defines all API endpoints (new game,
│   │                    hit, stand, recommend). Talks to the Deck of Cards
│   │                    API to handle card drawing, and calls ai.py to get
│   │                    the AI recommendation.
│   │
│   ├── ai.py            All AI logic lives here. Has two strategies:
│   │                    Monte Carlo runs 1,000 simulations of hitting and
│   │                    standing and picks the one that wins more often.
│   │                    Basic Strategy uses a fixed set of rules based on
│   │                    the player's total and the dealer's shown card.
│   │
│   ├── test_ai.py       Script for testing the AI. Runs a set number of
│   │                    simulated games and prints win/loss/push results.
│   │
│   └── requirements.txt Python packages needed to run the backend
│                        (FastAPI, uvicorn, requests).
│
├── src/
│   ├── App.tsx          The entire frontend. Handles both game phases
│   │                    (betting and playing), renders cards and scores,
│   │                    sends requests to the backend, and displays the
│   │                    AI recommendation bar.
│   │
│   ├── App.css          Styles for responsive layout across screen sizes.
│   │
│   ├── main.tsx         Entry point. Mounts the React app into index.html.
│   │
│   └── index.css        Global base styles.
│
├── index.html           The HTML file the browser loads. React injects
│                        the app into the div inside here.
│
├── vite.config.ts       Vite config. Tells Vite to use the React plugin
│                        and sets allowed dev server hosts.
│
└── package.json         Lists frontend dependencies and the npm scripts
                         (dev, build, preview).
```
