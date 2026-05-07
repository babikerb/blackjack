import { useEffect, useState } from 'react'
import './App.css'

const API = import.meta.env.VITE_API_URL ?? ''

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
  return <div style={styles.scorePill}>{score}</div>
}

function HandSection({ label, cards, score }: { label: string; cards: CardData[]; score: number }) {
  return (
    <div style={styles.handSection} className="bj-hand">
      <div style={styles.handLabel}>{label}</div>
      <div style={styles.cardsRow} className="bj-cards-row">
        {cards.map((card, i) => <PlayingCard key={i} card={card} />)}
      </div>
      <ScorePill score={score} />
    </div>
  )
}

type BarMode = 'rec' | 'win' | 'lose' | 'bust' | 'tied' | 'blackjack'

function AiRecommendBar({
  action, mode, algorithm, onAlgorithmChange,
}: {
  action: string
  mode: BarMode
  algorithm: 'basic' | 'montecarlo'
  onAlgorithmChange: (a: 'basic' | 'montecarlo') => void
}) {
  const content = mode === 'win' ? 'YOU WIN'
    : mode === 'lose' ? 'YOU LOSE'
    : mode === 'bust' ? 'YOU BUST'
    : mode === 'tied' ? 'TIED'
    : mode === 'blackjack' ? 'BLACKJACK'
    : action

  const isRed = mode === 'lose' || mode === 'bust'
  const isGreen = mode === 'win'
  const accentColor = isRed ? '#ef4444' : isGreen ? '#4edd79' : mode === 'tied' ? '#b1b1b1'
    : content === 'HIT' ? '#4edd79'
    : content === 'STAND' ? '#ef4444'
    : '#d4a843'
  const borderColor = isRed ? 'rgba(239,68,68,0.5)' : isGreen ? '#31864b' : mode === 'tied' ? '#4e4e4e'
    : content === 'HIT' ? 'rgba(78,221,121,0.4)' : content === 'STAND' ? 'rgba(239,68,68,0.4)' : 'rgba(212,168,67,0.5)'
  const bgColor = isRed ? 'rgba(239,68,68,0.08)' : isGreen ? '#0d2414' : mode === 'tied' ? '#141414' : 'rgba(0,0,0,0.3)'

  return (
    <div style={{ ...styles.aiBar, borderColor, background: bgColor }} className="bj-ai-bar">
      <span style={styles.aiBarText}>
        {mode === 'rec' && <span style={styles.aiBarLabel}>AI RECOMMENDATION </span>}
        <span style={{ ...styles.aiBarAction, color: accentColor }}>{content}</span>
      </span>
      {mode === 'rec' && (
        <select
          value={algorithm}
          onChange={e => onAlgorithmChange(e.target.value as 'basic' | 'montecarlo')}
          style={styles.algoDropdown}
        >
          <option value="montecarlo">MC</option>
          <option value="basic">BS</option>
        </select>
      )}
    </div>
  )
}

const CHIPS = [
  { label: '$5',   value: 5,   color: '#ef4444' },
  { label: '$25',  value: 25,  color: '#3b82f6' },
  { label: '$50',  value: 50,  color: '#8b5cf6' },
  { label: '$100', value: 100, color: '#d4a843' },
  { label: '$500', value: 500, color: '#1a1a1a' },
]

const CHIP_D = 38
const CHIP_PEEK = 10
const MAX_STACK = 8
const STACK_MAX_H = CHIP_D + (MAX_STACK - 1) * CHIP_PEEK  // fixed height all stacks share

function ChipStack({ chip, count }: { chip: typeof CHIPS[number]; count: number }) {
  const shown = Math.min(count, MAX_STACK)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      {/* fixed-height container so all stacks bottom-align */}
      <div style={{ position: 'relative', width: CHIP_D, height: STACK_MAX_H }}>
        {Array.from({ length: shown }).map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              bottom: i * CHIP_PEEK,
              left: 0,
              width: CHIP_D,
              height: CHIP_D,
              borderRadius: '50%',
              background: chip.color,
              border: '2px solid rgba(255,255,255,0.25)',
              boxShadow: i === shown - 1 ? '0 3px 10px rgba(0,0,0,0.6)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontFamily: '"Courier New", Courier, monospace',
              fontSize: '0.52rem',
              fontWeight: '800',
            }}
          >
            {i === shown - 1 ? chip.label : ''}
          </div>
        ))}
      </div>
      <span style={{ fontFamily: '"Courier New", Courier, monospace', fontSize: '0.55rem', color: 'rgba(255,255,255,0.45)', minHeight: '1em' }}>
        {count > 1 ? `x${count}` : ''}
      </span>
    </div>
  )
}

function BettingPanel({
  balance,
  currentBet,
  betChips,
  onChip,
  onClear,
  onDeal,
}: {
  balance: number
  currentBet: number
  betChips: { value: number; color: string }[]
  onChip: (v: number, color: string) => void
  onClear: () => void
  onDeal: () => void
}) {
  const counts = CHIPS.map(chip => ({
    chip,
    count: betChips.filter(c => c.value === chip.value).length,
  })).filter(x => x.count > 0)

  return (
    <div style={styles.bettingPanel}>
      <div style={styles.balanceRow}>
        <span style={styles.balanceLabel}>BALANCE</span>
        <span style={styles.balanceValue}>${balance.toLocaleString()}</span>
      </div>

      {/* stacked chips side by side per denomination */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 14, height: STACK_MAX_H + 24 }}>
        {counts.length === 0
          ? <span style={styles.emptyStack}>place your bet</span>
          : counts.map(({ chip, count }) => <ChipStack key={chip.value} chip={chip} count={count} />)
        }
      </div>

      <div style={styles.betDisplay}>
        <span style={styles.betLabel}>BET</span>
        <span style={styles.betValue}>${currentBet.toLocaleString()}</span>
      </div>

      <div style={styles.chipRow}>
        {CHIPS.map(chip => {
          const canAfford = balance - currentBet >= chip.value
          return (
            <button
              key={chip.value}
              style={{
                ...styles.chip,
                background: chip.color,
                opacity: canAfford ? 1 : 0.3,
                cursor: canAfford ? 'pointer' : 'not-allowed',
              }}
              onClick={() => canAfford && onChip(chip.value, chip.color)}
            >
              {chip.label}
            </button>
          )
        })}
        <button
          style={{
            height: '46px',
            padding: '0 14px',
            borderRadius: '8px',
            background: 'transparent',
            border: '1px solid #4edd79',
            color: '#4edd79',
            fontFamily: '"Courier New", Courier, monospace',
            fontSize: '0.6rem',
            fontWeight: '800',
            letterSpacing: '0.12em',
            cursor: balance - currentBet > 0 ? 'pointer' : 'not-allowed',
            opacity: balance - currentBet > 0 ? 1 : 0.3,
            whiteSpace: 'nowrap',
          }}
          onClick={() => {
            const remaining = balance - currentBet
            if (remaining > 0) onChip(remaining, '#14532d')
          }}
        >
          ALL IN
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, width: '100%', height: BTN_H, flexShrink: 0 }}>
        {([['CLEAR', onClear], ['DEAL', onDeal]] as [string, () => void][]).map(([label, fn]) => (
          <button
            key={label}
            onClick={fn}
            disabled={currentBet === 0}
            style={{
              ...BTN_FONT,
              flex: '1 0 0',
              height: BTN_H,
              background: label === 'DEAL' ? 'rgba(212,168,67,0.15)' : 'transparent',
              border: `1px solid ${label === 'DEAL' ? 'rgba(212,168,67,0.7)' : 'rgba(212,168,67,0.45)'}`,
              borderRadius: '8px',
              color: label === 'DEAL' ? '#d4a843' : 'rgba(255,255,255,0.85)',
              cursor: currentBet === 0 ? 'not-allowed' : 'pointer',
              opacity: currentBet === 0 ? 0.3 : 1,
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

const BTN_H = 40
const BTN_FONT: React.CSSProperties = {
  fontFamily: '"Courier New", Courier, monospace',
  fontSize: '0.78rem',
  fontWeight: '700',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
}

function ActionButtons({
  onHit, onNewGame, onStand, disabled,
}: {
  onHit: () => void
  onNewGame: () => void
  onStand: () => void
  disabled: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', flexShrink: 0 }}>
      <div style={{ display: 'flex', gap: 8, width: '100%', height: BTN_H, flexShrink: 0 }}>
        {([['HIT', onHit], ['STAND', onStand]] as [string, () => void][]).map(([label, fn]) => (
          <button
            key={label}
            onClick={fn}
            disabled={disabled}
            style={{
              ...BTN_FONT,
              flex: '1 0 0',
              height: BTN_H,
              background: 'transparent',
              border: '1px solid rgba(212,168,67,0.45)',
              borderRadius: '8px',
              color: 'rgba(255,255,255,0.85)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.4 : 1,
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <button
        onClick={onNewGame}
        style={{
          ...BTN_FONT,
          width: '100%',
          height: BTN_H,
          flexShrink: 0,
          background: 'rgba(212,168,67,0.15)',
          border: '1px solid rgba(212,168,67,0.7)',
          borderRadius: '8px',
          color: '#d4a843',
          cursor: 'pointer',
        }}
      >
        NEW GAME
      </button>
    </div>
  )
}

export default function App() {
  const [phase, setPhase] = useState<'betting' | 'playing'>('betting')
  const [balance, setBalance] = useState(1000)
  const [currentBet, setCurrentBet] = useState(0)
  const [betChips, setBetChips] = useState<{ value: number; color: string }[]>([])
  const [playerCards, setPlayerCards] = useState<CardData[]>([])
  const [dealerCards, setDealerCards] = useState<CardData[]>([])
  const [deckId, setDeckId] = useState<string | null>(null)
  const [gameOver, setGameOver] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [algorithm, setAlgorithm] = useState<'basic' | 'montecarlo'>('montecarlo')
  const [aiRec, setAiRec] = useState<string>('...')

  async function fetchRecommendation(pCards: CardData[], dCards: CardData[], algo: 'basic' | 'montecarlo') {
    setAiRec('...')
    try {
      const playerRanks = pCards.map(c => c.rank)
      const dealerUpcard = dCards[0].rank
      const res = await fetch(`${API}/game/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_cards: playerRanks,
          dealer_upcard: dealerUpcard,
          seen_cards: [...playerRanks, dealerUpcard],
          method: algo,
        }),
      })
      const data = await res.json()
      setAiRec((data.action as string).toUpperCase())
    } catch {
      setAiRec('?')
    }
  }

  function resolveBalance(result: string, bet: number) {
    if (result === 'YOU WIN') setBalance(b => b + bet * 2)
    else if (result === 'BLACKJACK') setBalance(b => b + Math.floor(bet * 2.5))
    else if (result === 'TIED') setBalance(b => b + bet)
    // lose/bust: nothing, already deducted
  }

  async function deal() {
    setBalance(b => b - currentBet)
    setLoading(true)
    setError(null)
    setGameOver(null)
    try {
      const res = await fetch(`${API}/game/new`, { method: 'POST' })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data = await res.json()
      setDeckId(data.deck_id)
      const pCards = (data.player_cards as ApiCard[]).map(mapApiCard)
      const dCards = (data.dealer_cards as ApiCard[]).map((c, i) =>
        i === 1 ? { ...mapApiCard(c), faceDown: true } : mapApiCard(c)
      )
      setPlayerCards(pCards)
      setDealerCards(dCards)
      setPhase('playing')
      const playerBJ = isNaturalBlackjack(pCards)
      const dealerBJ = isNaturalBlackjack(dCards)
      if (playerBJ || dealerBJ) {
        setDealerCards(dCards.map(c => ({ ...c, faceDown: false })))
        if (playerBJ && dealerBJ) { setGameOver('TIED'); resolveBalance('TIED', currentBet) }
        else if (dealerBJ) { setGameOver('YOU LOSE'); resolveBalance('YOU LOSE', currentBet) }
        else { setGameOver('BLACKJACK'); resolveBalance('BLACKJACK', currentBet) }
      } else {
        fetchRecommendation(pCards, dCards, algorithm)
      }
    } catch (e) {
      setBalance(b => b + currentBet) // refund on error
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function hit() {
    if (!deckId) return
    try {
      const res = await fetch(`${API}/game/hit?deck_id=${deckId}`, { method: 'POST' })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data = await res.json()
      const newCard = mapApiCard(data.card as ApiCard)
      const updated = [...playerCards, newCard]
      setPlayerCards(updated)
      const score = calcScore(updated)
      if (score > 21) { setGameOver('YOU BUST'); resolveBalance('YOU BUST', currentBet) }
      else if (score === 21) await stand(updated)
      else fetchRecommendation(updated, dealerCards, algorithm)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  function timeout(delay: number) {
    return new Promise(resolve => setTimeout(resolve, delay))
  }

  async function stand(currentPlayerCards: CardData[] = playerCards) {
    let dCards = dealerCards.map(c => c.faceDown ? { ...c, faceDown: false } : c)
    setDealerCards(dCards)
    let currentDealerScore = calcScore(dCards)
    if (!deckId) return
    try {
      while (currentDealerScore < 17) {
        const res = await fetch(`${API}/game/hit?deck_id=${deckId}`, { method: 'POST' })
        if (!res.ok) throw new Error(`Server error: ${res.status}`)
        const data = await res.json()
        const newCard = mapApiCard(data.card as ApiCard)
        dCards = [...dCards, newCard]
        await timeout(1000)
        setDealerCards(dCards)
        currentDealerScore = calcScore(dCards)
        if (currentDealerScore > 21) {
          setGameOver('YOU WIN')
          resolveBalance('YOU WIN', currentBet)
          return
        }
      }
      const pScore = calcScore(currentPlayerCards)
      let result: string
      if (currentDealerScore > pScore) result = 'YOU LOSE'
      else if (pScore > currentDealerScore) result = 'YOU WIN'
      else result = 'TIED'
      setGameOver(result)
      resolveBalance(result, currentBet)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  function newGame() {
    setPhase('betting')
    setCurrentBet(0)
    setBetChips([])
    setPlayerCards([])
    setDealerCards([])
    setGameOver(null)
    setError(null)
    setAiRec('...')
  }

  useEffect(() => {
    if (gameOver === null || phase !== 'playing') return
    if (playerCards.length > 0 && dealerCards.length > 0) return
  }, [algorithm])

  useEffect(() => {
    if (!gameOver && playerCards.length > 0 && dealerCards.length > 0) {
      fetchRecommendation(playerCards, dealerCards, algorithm)
    }
  }, [algorithm])

  const playerScore = calcScore(playerCards)
  const dealerScore = calcScore(dealerCards)

  return (
    <div style={styles.root} className="bj-root">
      <h1 style={styles.title}>Blackjack</h1>

      {error && <div style={styles.errorBanner}>{error}</div>}

      {phase === 'betting' ? (
        <div style={{ ...styles.table, justifyContent: 'flex-end' }} className="bj-table">
          <div style={styles.tableBottom}>
            <BettingPanel
              balance={balance}
              currentBet={currentBet}
              betChips={betChips}
              onChip={(v, color) => { setCurrentBet(b => b + v); setBetChips(cs => [...cs, { value: v, color }]) }}
              onClear={() => { setCurrentBet(0); setBetChips([]) }}
              onDeal={deal}
            />
          </div>
        </div>
      ) : (
        <div style={styles.table} className="bj-table">
          {loading ? (
            <div style={styles.loadingText}>Dealing cards...</div>
          ) : (
            <>
              <div style={styles.handsGroup}>
                <HandSection label="DEALER" cards={dealerCards} score={dealerScore} />
                <div style={styles.divider} />
                <HandSection label="PLAYER" cards={playerCards} score={playerScore} />
              </div>

              <div style={styles.tableBottom}>
                <div style={styles.balanceBetBar}>
                  <span style={styles.balanceBetItem}>
                    <span style={styles.balanceBetLabel}>BALANCE </span>
                    <span style={styles.balanceBetValue}>${balance.toLocaleString()}</span>
                  </span>
                  <span style={styles.balanceBetDivider}>|</span>
                  <span style={styles.balanceBetItem}>
                    <span style={styles.balanceBetLabel}>BET </span>
                    <span style={styles.balanceBetValue}>${currentBet.toLocaleString()}</span>
                  </span>
                </div>
                <AiRecommendBar
                  action={aiRec}
                  algorithm={algorithm}
                  onAlgorithmChange={setAlgorithm}
                  mode={
                    gameOver === 'YOU BUST' ? 'bust'
                    : gameOver === 'YOU WIN' ? 'win'
                    : gameOver === 'YOU LOSE' ? 'lose'
                    : gameOver === 'TIED' ? 'tied'
                    : gameOver === 'BLACKJACK' ? 'blackjack'
                    : 'rec'
                  }
                />
                <ActionButtons
                  onHit={hit}
                  onNewGame={newGame}
                  onStand={() => stand()}
                  disabled={gameOver !== null}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    position: 'relative',
    background: '#1a3d28',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },

  title: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: 'clamp(1.8rem, 8vw, 2.6rem)',
    fontWeight: '700',
    color: '#d4a843',
    letterSpacing: '0.04em',
    textShadow: '0 2px 12px rgba(212,168,67,0.25)',
  },

  table: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    maxWidth: '520px',
  },

  tableBottom: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    width: '100%',
    flexShrink: 0,
  },

  handSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },

  handLabel: {
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: 'clamp(0.7rem, 1.5vw, 0.95rem)',
    fontWeight: '600',
    letterSpacing: '0.25em',
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
  },

  cardsRow: {
    display: 'flex',
    gap: 'min(10px, 2.5vw)',
    alignItems: 'flex-start',
    overflowX: 'auto',
    width: '100%',
    justifyContent: 'center',
    paddingBottom: '4px',
  },

  card: {
    position: 'relative',
    width: 'min(90px, 18vw, 12vh)',
    height: 'min(126px, 25vw, 17vh)',
    background: '#fff',
    borderRadius: '10px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.45)',
    flexShrink: 0,
  },

  cardFaceDown: {
    position: 'relative',
    width: 'min(90px, 18vw, 12vh)',
    height: 'min(126px, 25vw, 17vh)',
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
    fontSize: 'clamp(0.65rem, 2vw, 1rem)',
    fontWeight: '800',
    fontFamily: 'Georgia, serif',
    lineHeight: 1,
  },

  cornerSuit: {
    fontSize: 'clamp(0.55rem, 1.6vw, 0.8rem)',
    lineHeight: 1,
    marginTop: '1px',
  },

  centerSuit: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: 'clamp(1.6rem, 5vw, 2.8rem)',
    lineHeight: 1,
    userSelect: 'none',
  },

  scorePill: {
    background: 'rgba(0,0,0,0.45)',
    color: 'rgba(255,255,255,0.85)',
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: 'clamp(0.7rem, 1.4vw, 0.9rem)',
    fontWeight: '700',
    letterSpacing: '0.05em',
    padding: '5px 18px',
    borderRadius: '999px',
    border: '1px solid rgba(255,255,255,0.1)',
  },

  handsGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    width: '100%',
    flex: 1,
    overflow: 'hidden',
    minHeight: 0,
  },

  divider: {
    width: '100%',
    height: '1px',
    background: 'rgba(255,255,255,0.08)',
  },

  // Betting phase
  bettingPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
    alignItems: 'center',
  },

  balanceRow: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },

  balanceLabel: {
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: '0.6rem',
    fontWeight: '600',
    letterSpacing: '0.25em',
    color: 'rgba(255,255,255,0.4)',
  },

  balanceValue: {
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#d4a843',
    letterSpacing: '0.05em',
  },

  emptyStack: {
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: '0.6rem',
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    alignSelf: 'center',
  },

  chipRow: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    flexWrap: 'wrap',
    width: '100%',
  },

  chip: {
    width: '46px',
    height: '46px',
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.25)',
    color: '#fff',
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: '0.58rem',
    fontWeight: '800',
    letterSpacing: '0.02em',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 3px 8px rgba(0,0,0,0.4)',
    userSelect: 'none',
    WebkitUserSelect: 'none',
  },

  betDisplay: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1px',
    padding: '8px 32px',
    borderRadius: '8px',
    border: '1px solid rgba(212,168,67,0.3)',
    background: 'rgba(0,0,0,0.25)',
    minWidth: '120px',
  },

  betLabel: {
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: '0.6rem',
    fontWeight: '600',
    letterSpacing: '0.25em',
    color: 'rgba(255,255,255,0.4)',
  },

  betValue: {
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: '1rem',
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: '0.05em',
  },

  // Balance/bet bar during play
  balanceBetBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    height: 34,
    padding: '0 16px',
    borderRadius: 6,
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.07)',
    width: '100%',
    flexShrink: 0,
    overflow: 'hidden',
  },

  balanceBetItem: {
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: '0.7rem',
    letterSpacing: '0.08em',
  },

  balanceBetLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
  },

  balanceBetValue: {
    color: '#d4a843',
    fontWeight: '700',
  },

  balanceBetDivider: {
    color: 'rgba(255,255,255,0.15)',
    fontFamily: '"Courier New", Courier, monospace',
  },

  aiBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    height: 44,
    width: '100%',
    flexShrink: 0,
    overflow: 'hidden',
    border: '1px solid rgba(212,168,67,0.5)',
    borderRadius: 8,
    background: 'rgba(0,0,0,0.3)',
    gap: 10,
  },

  aiBarText: {
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: 'clamp(0.62rem, 1.2vw, 0.82rem)',
    fontWeight: '700',
    letterSpacing: '0.2em',
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    flex: 1,
    textAlign: 'center',
  },

  aiBarLabel: {
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: '0.2em',
  },

  aiBarAction: {
    color: '#d4a843',
    letterSpacing: '0.25em',
  },

  algoDropdown: {
    background: 'transparent',
    border: '1px solid rgba(212,168,67,0.4)',
    borderRadius: '6px',
    color: '#d4a843',
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: '0.65rem',
    fontWeight: '700',
    letterSpacing: '0.1em',
    padding: '8px 10px',
    minHeight: '36px',
    cursor: 'pointer',
    outline: 'none',
    flexShrink: 0,
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
