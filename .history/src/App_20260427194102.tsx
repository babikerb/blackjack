import { useState, useEffect, useRef } from 'react'
import './App.css'

type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs'
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'

interface CardData {
  rank: Rank
  suit: Suit
  faceDown?: boolean
}

interface ApiCard {
  value: string
  suit: string
}

const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
}

const RED_SUITS: Suit[] = ['hearts', 'diamonds']

const CARD_VALUES: Record<string, number> = {
  A: 11, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
  '8': 8, '9': 9, '10': 10, J: 10, Q: 10, K: 10,
}

function mapApiCard(apiCard: ApiCard): CardData {
  const rankMap: Record<string, Rank> = {
    ACE: 'A', JACK: 'J', QUEEN: 'Q', KING: 'K',
  }
  const rank = (rankMap[apiCard.value] ?? apiCard.value) as Rank
  const suit = apiCard.suit.toLowerCase() as Suit
  return { rank, suit }
}

const TEN_VALUE_RANKS: Rank[] = ['10', 'J', 'Q', 'K']

function isNaturalBlackjack(cards: CardData[]): boolean {
  if (cards.length !== 2) return false
  const ranks = cards.map(c => c.rank)
  return ranks.includes('A') && ranks.some(r => TEN_VALUE_RANKS.includes(r))
}

function calcScore(cards: CardData[]): number {
  let total = 0
  let aces = 0
  for (const card of cards) {
    if (card.faceDown) continue
    total += CARD_VALUES[card.rank]
    if (card.rank === 'A') aces++
  }
  while (total > 21 && aces > 0) {
    total -= 10
    aces--
  }
  return total
}

function PlayingCard({ card }: { card: CardData }) {
  if (card.faceDown) {
    return (
      <div style={styles.cardFaceDown}>
        <span style={styles.faceDownQuestion}>?</span>
      </div>
    )
  }

  const isRed = RED_SUITS.includes(card.suit)
  const color = isRed ? '#dc2626' : '#111'
  const symbol = SUIT_SYMBOLS[card.suit]

  return (
    <div style={styles.card}>
      <div style={{ ...styles.cornerTopLeft, color }}>
        <div style={styles.cornerRank}>{card.rank}</div>
        <div style={styles.cornerSuit}>{symbol}</div>
      </div>

      <div style={{ ...styles.centerSuit, color }}>{symbol}</div>

      <div style={{ ...styles.cornerBottomRight, color }}>
        <div style={styles.cornerRank}>{card.rank}</div>
        <div style={styles.cornerSuit}>{symbol}</div>
      </div>
    </div>
  )
}

function ScorePill({ score }: { score: number }) {
  return (
    <div style={styles.scorePill}>
      {score}
    </div>
  )
}

function HandSection({
  label,
  cards,
  score,
}: {
  label: string
  cards: CardData[]
  score: number
}) {
  return (
    <div style={styles.handSection}>
      <div style={styles.handLabel}>{label}</div>
      <div style={styles.cardsRow}>
        {cards.map((card, i) => (
          <PlayingCard key={i} card={card} />
        ))}
      </div>
      <ScorePill score={score} />
    </div>
  )
}

type BarMode = 'rec' | 'player blackjack' | 'dealer blackjack'| 'dealer bust' | 'lost' 

function AiRecommendBar({ action, mode }: { action: string; mode: BarMode }) {
  const accentColor = mode === 'lost' ? '#ef4444' : '#d4a843'
  const borderColor = mode === 'lost' ? 'rgba(239,68,68,0.5)' : 'rgba(212,168,67,0.5)'
  const bgColor = mode === 'lost' ? 'rgba(239,68,68,0.08)' : 'rgba(0,0,0,0.3)'

  const label = mode === 'rec' ? 'AI RECOMMENDATION' : null
  const content = mode === 'blackjack' ? 'BLACKJACK' : mode === 'lost' ? 'BUST' : action

  return (
    <div style={{ ...styles.aiBar, borderColor, background: bgColor }}>
      <span style={styles.aiBarText}>
        {label && <>{label}{' '}</>}
        <span style={{ ...styles.aiBarAction, color: accentColor }}>{content}</span>
      </span>
    </div>
  )
}

function ActionButtons({
  onHit,
  onNewGame,
  onStand,
  disabled,
}: {
  onHit: () => void
  onNewGame: () => void
  onStand: () => void
  disabled: boolean
}) {
  return (
    <div style={styles.actionsCol}>
      <div style={styles.actionsRow}>
        <button
          style={{ ...styles.actionBtn, opacity: disabled ? 0.4 : 1 }}
          onClick={onHit}
          disabled={disabled}
        >
          HIT
        </button>
        <button
          style={{ ...styles.actionBtn, opacity: disabled ? 0.4 : 1 }}
          onClick={onStand}
          disabled={disabled}
        >
          STAND
        </button>
      </div>
      <button style={styles.newGameBtn} onClick={onNewGame}>
        NEW GAME
      </button>
    </div>
  )
}

export default function App() {
  const [playerCards, setPlayerCards] = useState<CardData[]>([])
  const [dealerCards, setDealerCards] = useState<CardData[]>([])
  const [deckId, setDeckId] = useState<string | null>(null)
  const [gameOver, setGameOver] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const initialized = useRef(false)

  async function startNewGame() {
    setLoading(true)
    setError(null)
    setGameOver(null)
    try {
      const res = await fetch('http://localhost:8000/game/new', { method: 'POST' })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data = await res.json()
      setDeckId(data.deck_id)
      const pCards = (data.player_cards as ApiCard[]).map(mapApiCard)
      const dCards = (data.dealer_cards as ApiCard[]).map((c, i) =>
        i === 1 ? { ...mapApiCard(c), faceDown: true } : mapApiCard(c)
      )
      setPlayerCards(pCards)
      setDealerCards(dCards)
      if (isNaturalBlackjack(pCards)) setGameOver('Player Blackjack!') // natural blackjack is an A + any other 10 value card in the initial deal
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function hit() {
    if (!deckId) return
    try {
      const res = await fetch(`http://localhost:8000/game/hit?deck_id=${deckId}`, { method: 'POST' })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data = await res.json()
      const newCard = mapApiCard(data.card as ApiCard)
      const updated = [...playerCards, newCard]
      setPlayerCards(updated)
      const score = calcScore(updated)
      if (score > 21) setGameOver('BUST You lose!')
      else if (score === 21) setGameOver('21')
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function stand() {
    const dCards = dealerCards.map(c => c.faceDown ? { ...c, faceDown: false } : c)
    setDealerCards(dCards)
    if (isNaturalBlackjack(dCards)) {
      setGameOver('Dealer Blackjack!')
      return
    }
    if (!deckId) return 
    try {
      const res = await fetch(`http://localhost:8000/game/stand?deck_id=${deckId}`, { method: 'POST' })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      let data = await res.json()
      let newCard = mapApiCard(data.card as ApiCard)
      let updated = [...dCards, newCard]
      setDealerCards(updated)
      let dealerScore = calcScore(updated)
      while (dealerScore < 17) {
        const res = await fetch(`http://localhost:8000/game/stand?deck_id=${deckId}`, { method: 'POST' })
        if (!res.ok) throw new Error(`Server error: ${res.status}`)
        const data = await res.json()
        newCard = mapApiCard(data.card as ApiCard)
        updated = [...dealerCards, newCard]
        setDealerCards(updated)
        dealerScore = calcScore(updated)
        if (dealerScore > 21) {
          setGameOver('Dealer BUSTS!')
          break
        }
      }
      if (dealerScore > calcScore(playerCards)) setGameOver('Player Wins!')
    } catch (e) {
      setError((e as Error).message)
    }
    // if (!deckId) return
    // try {
    //   const res = await fetch(`http://localhost:8000/game/stand?deck_id=${deckId}`, { method: 'POST' })
    //   if (!res.ok) throw new Error(`Server error: ${res.status}`)
    //   const data = await res.json()
    //   const newCard = mapApiCard(data.card as ApiCard)
    //   const updated = [...dealerCards, newCard]
    //   setDealerCards(updated)
    // }
  }

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    startNewGame()
  }, [])

  const playerScore = calcScore(playerCards)
  const dealerScore = calcScore(dealerCards)

  return (
    <div style={styles.root}>
      <h1 style={styles.title}>Blackjack AI</h1>

      {error && <div style={styles.errorBanner}>{error}</div>}

      <div style={styles.table}>
        {loading ? (
          <div style={styles.loadingText}>Dealing cards...</div>
        ) : (
          <>
            <HandSection label="DEALER" cards={dealerCards} score={dealerScore} />

            <div style={styles.divider} />

            <HandSection label="PLAYER" cards={playerCards} score={playerScore} />

            <AiRecommendBar
              action="HIT"
              mode={
                gameOver === 'Player Blackjack!' ? 'player blackjack'
                : gameOver === 'Dealer Blackjack!' ? 'dealerblackjack'
                : gameOver === 'BUST You lose!' ? 'lost'
                : gameOver === 'Dealer Busts!' ? 'dealer wins'
                : 'rec'
              }
            />

            <ActionButtons
              onHit={hit}
              onNewGame={startNewGame}
              onStand={stand}
              disabled={gameOver !== null}
            />
          </>
        )}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    background: '#1a3d28',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 16px',
    gap: '32px',
    overflowX: 'hidden',
  },

  title: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: '2.6rem',
    fontWeight: '700',
    color: '#d4a843',
    letterSpacing: '0.04em',
    textShadow: '0 2px 12px rgba(212,168,67,0.25)',
  },

  table: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '28px',
    width: '100%',
    maxWidth: '480px',
  },

  handSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '14px',
    width: '100%',
    overflowX: 'auto',
  },

  handLabel: {
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: '0.7rem',
    fontWeight: '600',
    letterSpacing: '0.25em',
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
  },

  cardsRow: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
  },

  card: {
    position: 'relative',
    width: '80px',
    height: '112px',
    background: '#fff',
    borderRadius: '10px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.45)',
    flexShrink: 0,
  },

  cardFaceDown: {
    position: 'relative',
    width: '80px',
    height: '112px',
    background: '#163324',
    borderRadius: '10px',
    border: '2px dashed rgba(255,255,255,0.22)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  faceDownQuestion: {
    fontSize: '2rem',
    color: 'rgba(255,255,255,0.22)',
    fontFamily: '"Courier New", Courier, monospace',
    fontWeight: '700',
    userSelect: 'none',
  },

  cornerTopLeft: {
    position: 'absolute',
    top: '7px',
    left: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    lineHeight: 1,
  },

  cornerBottomRight: {
    position: 'absolute',
    bottom: '7px',
    right: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    lineHeight: 1,
    transform: 'rotate(180deg)',
  },

  cornerRank: {
    fontSize: '0.8rem',
    fontWeight: '800',
    fontFamily: 'Georgia, serif',
    lineHeight: 1,
  },

  cornerSuit: {
    fontSize: '0.65rem',
    lineHeight: 1,
    marginTop: '1px',
  },

  centerSuit: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '2.2rem',
    lineHeight: 1,
    userSelect: 'none',
  },

  scorePill: {
    background: 'rgba(0,0,0,0.45)',
    color: 'rgba(255,255,255,0.85)',
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: '0.75rem',
    fontWeight: '700',
    letterSpacing: '0.05em',
    padding: '4px 14px',
    borderRadius: '999px',
    border: '1px solid rgba(255,255,255,0.1)',
  },

  divider: {
    width: '100%',
    height: '1px',
    background: 'rgba(255,255,255,0.08)',
  },

  aiBar: {
    padding: '12px 28px',
    border: '1px solid rgba(212,168,67,0.5)',
    borderRadius: '8px',
    background: 'rgba(0,0,0,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  aiBarText: {
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: '0.72rem',
    fontWeight: '700',
    letterSpacing: '0.2em',
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
  },

  aiBarAction: {
    color: '#d4a843',
    letterSpacing: '0.25em',
  },

  actionsCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    alignItems: 'center',
  },

  actionsRow: {
    display: 'flex',
    gap: '10px',
  },

  actionBtn: {
    width: '120px',
    padding: '12px 4px',
    background: 'transparent',
    border: '1px solid rgba(212,168,67,0.45)',
    borderRadius: '8px',
    color: 'rgba(255,255,255,0.85)',
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: '0.68rem',
    fontWeight: '700',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    transition: 'border-color 0.15s, background 0.15s',
  },

  newGameBtn: {
    width: '250px',
    padding: '12px 4px',
    background: 'rgba(212,168,67,0.15)',
    border: '1px solid rgba(212,168,67,0.7)',
    borderRadius: '8px',
    color: '#d4a843',
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: '0.68rem',
    fontWeight: '700',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    cursor: 'pointer',
  },

  loadingText: {
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: '0.9rem',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: '0.15em',
  },

  errorBanner: {
    background: 'rgba(220,38,38,0.15)',
    border: '1px solid rgba(220,38,38,0.5)',
    borderRadius: '8px',
    padding: '10px 20px',
    color: '#f87171',
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: '0.75rem',
    maxWidth: '480px',
    width: '100%',
    textAlign: 'center',
  },
}
