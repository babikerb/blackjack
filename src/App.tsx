import './App.css'

type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs'
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'

interface CardData {
  rank: Rank
  suit: Suit
  faceDown?: boolean
}

const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
}

const RED_SUITS: Suit[] = ['hearts', 'diamonds']

const DEALER_CARDS: CardData[] = [
  { rank: 'A', suit: 'spades' },
  { rank: 'K', suit: 'hearts', faceDown: true },
]

const PLAYER_CARDS: CardData[] = [
  { rank: '7', suit: 'hearts' },
  { rank: '6', suit: 'clubs' },
  { rank: '3', suit: 'diamonds' },
]

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


function AiRecommendBar({ action }: { action: string }) {
  return (
    <div style={styles.aiBar}>
      <span style={styles.aiBarText}>
        AI RECOMMENDS{' '}
        <span style={styles.aiBarAction}>{action}</span>
      </span>
    </div>
  )
}

const ACTIONS = ['HIT', 'STAND', 'DOUBLE', 'SPLIT']

function ActionButtons() {
  return (
    <div style={styles.actionsRow}>
      {ACTIONS.map((action) => (
        <button key={action} style={styles.actionBtn}>
          {action}
        </button>
      ))}
    </div>
  )
}

export default function App() {
  return (
    <div style={styles.root}>
      <h1 style={styles.title}>Blackjack AI</h1>

      <div style={styles.table}>
        <HandSection label="DEALER" cards={DEALER_CARDS} score={11} />

        <div style={styles.divider} />

        <HandSection label="PLAYER" cards={PLAYER_CARDS} score={16} />

        <AiRecommendBar action="HIT" />

        <ActionButtons />
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
    width: '100%',
    padding: '12px 20px',
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

  actionsRow: {
    display: 'flex',
    gap: '10px',
    width: '100%',
  },

  actionBtn: {
    flex: 1,
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
}
