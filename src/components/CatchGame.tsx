import { useCallback, useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useT } from '../i18n/i18n'
import { hasLeaderboard, getTop, getRank, submitScore, MAX_NAME, type ScoreRow } from '../lib/leaderboard'
import './CatchGame.css'

type Phase = 'idle' | 'count' | 'playing' | 'ending' | 'over'
type Heart = { id: number; x: number; y: number }
type Ripple = { id: number; x: number; y: number }
type Spot = { x: number; y: number; size: number }

const DURATION = 20 // seconds
const BEST_KEY = 'catch-tito-best'

function readBest(): number {
  try {
    return parseInt(localStorage.getItem(BEST_KEY) || '0', 10) || 0
  } catch {
    return 0
  }
}

/**
 * "Atrapa a Tito" — a tiny easter-egg game. Tito (the site's pixel cat) hops to
 * a new spot every so often; tap him for points before the timer runs out. He
 * gets faster and smaller as the score climbs. Opened via the command palette
 * ("game:open" event). Reduced-motion keeps the gameplay but drops the flourish.
 */
export function CatchGame({ onClose }: { onClose: () => void }) {
  const t = useT()
  const [closing, setClosing] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [score, setScore] = useState(0)
  const [time, setTime] = useState(DURATION)
  const [best, setBest] = useState(() => readBest())
  const [spot, setSpot] = useState<Spot>({ x: 40, y: 40, size: 84 })
  const [hearts, setHearts] = useState<Heart[]>([])
  const [ripples, setRipples] = useState<Ripple[]>([])
  const [name, setName] = useState('')
  const [submitState, setSubmitState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [top, setTop] = useState<ScoreRow[]>([])
  const [rank, setRank] = useState<number | null>(null)
  const [showFull, setShowFull] = useState(false)
  const [showBoard, setShowBoard] = useState(false)
  const [count, setCount] = useState(3)

  const boardRef = useRef<HTMLDivElement>(null)
  const hopRef = useRef<number | undefined>(undefined)
  const tickRef = useRef<number | undefined>(undefined)
  const countRef = useRef<number | undefined>(undefined)
  const endRef = useRef<number | undefined>(undefined)
  const heartId = useRef(0)
  const scoreRef = useRef(0)
  const curSpot = useRef<Spot | null>(null)

  const reduce = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const clearTimers = () => {
    window.clearTimeout(hopRef.current)
    window.clearInterval(tickRef.current)
    window.clearInterval(countRef.current)
    window.clearTimeout(endRef.current)
  }

  // Move Tito to a fresh random spot inside the board, then schedule the next
  // hop — the interval shrinks and he shrinks as the score grows.
  const hop = useCallback(() => {
    const board = boardRef.current
    if (!board) return
    const s = scoreRef.current
    const size = Math.max(52, 84 - s * 1.6)
    const pad = 8
    const maxX = Math.max(pad, board.clientWidth - size - pad)
    const maxY = Math.max(pad, board.clientHeight - size - pad)
    const x = pad + Math.random() * (maxX - pad)
    const y = pad + Math.random() * (maxY - pad)
    // leave a fading ripple where Tito just was
    const prev = curSpot.current
    if (prev) {
      const rid = heartId.current++
      const rx = prev.x + prev.size / 2
      const ry = prev.y + prev.size * 0.6
      setRipples((rs) => [...rs, { id: rid, x: rx, y: ry }])
      window.setTimeout(() => setRipples((rs) => rs.filter((r) => r.id !== rid)), 520)
    }
    curSpot.current = { x, y, size }
    setSpot({ x, y, size })
    const delay = Math.max(520, 1000 - s * 34)
    hopRef.current = window.setTimeout(hop, delay)
  }, [])

  // Idle-screen "view leaderboard" — load the Top 10 without playing.
  const openBoard = () => {
    if (!hasLeaderboard) return
    getTop(10)
      .then((rows) => setTop(rows))
      .catch(() => {})
    setShowFull(true)
    setShowBoard(true)
  }

  // "A jugar" runs a 3-2-1 countdown, then hands off to the real game.
  const start = () => {
    clearTimers()
    setShowBoard(false)
    setSubmitState('idle')
    setHearts([])
    setRipples([])
    setScore(0)
    scoreRef.current = 0
    setTime(DURATION)
    setCount(3)
    setPhase('count')
    let c = 3
    countRef.current = window.setInterval(() => {
      c -= 1
      if (c <= 0) {
        window.clearInterval(countRef.current)
        beginPlay()
      } else {
        setCount(c)
      }
    }, 750)
  }

  const beginPlay = () => {
    scoreRef.current = 0
    setScore(0)
    setTime(DURATION)
    setPhase('playing')
    setHearts([])
    setRipples([])
    curSpot.current = null
    clearTimers()
    // first placement on the next frame, once the board has size
    window.setTimeout(hop, 30)
    tickRef.current = window.setInterval(() => {
      setTime((v) => {
        if (v <= 1) {
          window.clearInterval(tickRef.current)
          window.clearTimeout(hopRef.current)
          // "time's up" splash first (no buttons), then reveal the full over
          // screen — stops an accidental "play again" tap from skipping submit
          setPhase('ending')
          endRef.current = window.setTimeout(() => setPhase('over'), 3000)
          setBest((b) => {
            const nb = Math.max(b, scoreRef.current)
            try {
              localStorage.setItem(BEST_KEY, String(nb))
            } catch {
              /* ignore */
            }
            return nb
          })
          return 0
        }
        return v - 1
      })
    }, 1000)
  }

  const onCatch = (e: React.PointerEvent) => {
    e.stopPropagation()
    if (phase !== 'playing') return
    const next = scoreRef.current + 1
    scoreRef.current = next
    setScore(next)
    // heart pop at Tito's centre
    const hx = spot.x + spot.size / 2
    const hy = spot.y + spot.size * 0.4
    const id = heartId.current++
    setHearts((hs) => [...hs, { id, x: hx, y: hy }])
    window.setTimeout(() => setHearts((hs) => hs.filter((h) => h.id !== id)), 700)
    // relocate immediately (also resets the hop timer)
    window.clearTimeout(hopRef.current)
    hop()
  }

  const close = () => {
    clearTimers()
    setClosing(true)
    window.setTimeout(onClose, 300)
  }

  // Esc closes; lock body scroll while mounted
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    // Lock BOTH <html> and <body> — the real scroller here is the document
    // element, so locking body alone lets the page behind still scroll on touch.
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
      clearTimers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isRecord = (phase === 'over' || phase === 'ending') && score > 0 && score >= best

  // The full ordered board with the player's slot woven in (a dashed "ghost" at
  // their rank before submitting, a solid highlighted row after). From this we
  // derive two views: a compact window around the player, or the full Top 10.
  type Row = { pos: number; name: string; score: number; you: boolean; ghost: boolean; divider?: boolean }
  let fullRows: Row[] = []
  if (hasLeaderboard && score > 0) {
    const youName = name.trim() || t.game.you
    if (submitState === 'done') {
      let marked = false
      fullRows = top.map((r) => {
        const you = !marked && r.score === score && r.name === youName
        if (you) marked = true
        return { pos: 0, name: r.name, score: r.score, you, ghost: false }
      })
    } else if (rank !== null) {
      const base: Row[] = top.map((r) => ({ pos: 0, name: r.name, score: r.score, you: false, ghost: false }))
      const insertAt = Math.min(base.length, rank - 1)
      base.splice(insertAt, 0, { pos: 0, name: youName, score, you: true, ghost: true })
      fullRows = base
    }
    fullRows = fullRows.map((r, i) => ({ ...r, pos: i + 1 }))
  }

  const youIdx = fullRows.findIndex((r) => r.you)
  // Compact view: the player's row plus one neighbour on each side.
  const windowRows: Row[] =
    youIdx < 0 ? fullRows.slice(0, 3) : fullRows.slice(Math.max(0, youIdx - 1), youIdx + 2)
  // Full view: Top 10, and if the player sits outside it, a divider + their row.
  const fullView: Row[] =
    youIdx >= 10
      ? [...fullRows.slice(0, 10), { pos: -1, name: '', score: 0, you: false, ghost: false, divider: true }, fullRows[youIdx]]
      : fullRows.slice(0, 10)
  const visibleRows = showFull ? fullView : windowRows
  const canToggle = fullRows.length > windowRows.length

  // celebratory heart burst when the run ends on a new record
  useEffect(() => {
    if (!isRecord) return
    const board = boardRef.current
    if (!board) return
    const w = board.clientWidth
    const h = board.clientHeight
    const burst = Array.from({ length: 12 }, () => ({
      id: heartId.current++,
      x: 24 + Math.random() * (w - 48),
      y: 24 + Math.random() * (h - 48),
    }))
    setHearts(burst)
    const to = window.setTimeout(() => setHearts([]), 900)
    return () => window.clearTimeout(to)
  }, [isRecord])

  // when a run ends, load the board and work out where this score would land,
  // so we can preview the ranking with the player's provisional slot
  useEffect(() => {
    // fetch during the "ending" splash so the board is ready when "over" shows
    if (phase !== 'ending' || !hasLeaderboard || score <= 0) {
      if (phase === 'idle' || phase === 'count' || phase === 'playing') {
        setRank(null)
        setTop([])
      }
      return
    }
    let alive = true
    setShowFull(false)
    Promise.all([getTop(50), getRank(score)])
      .then(([rows, r]) => {
        if (!alive) return
        setTop(rows)
        setRank(r)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [phase, score])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitState === 'sending' || !name.trim() || score <= 0) return
    setSubmitState('sending')
    try {
      await submitScore(name, score)
      const rows = await getTop(10)
      setTop(rows)
      setSubmitState('done')
    } catch {
      setSubmitState('error')
    }
  }

  return (
    <div
      className={`cg ${closing ? 'is-out' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={t.game.title}
      onClick={close}
    >
      <div className={`cg__panel ${reduce() ? 'is-reduced' : ''}`} onClick={(e) => e.stopPropagation()}>
        <span className="cg__frame" aria-hidden />
        <button className="cg__close" onClick={close} aria-label={t.game.close} data-cursor="link">
          <span className="cg__close-lbl">{t.game.close}</span>
          <X size={15} strokeWidth={1.8} />
        </button>

        <div className="cg__head">
          <span className="meta cg__tag">MINI‑GAME</span>
          <h2 className="cg__title">{t.game.title}</h2>
        </div>

        <div className="cg__hud" aria-live="polite">
          <span className="cg__stat">
            <em className="meta">{t.game.time}</em>
            <b className={time <= 5 && phase === 'playing' ? 'is-low' : ''}>{String(time).padStart(2, '0')}</b>
          </span>
          <span className="cg__stat">
            <em className="meta">{t.game.score}</em>
            <b>{score}</b>
          </span>
          <span className="cg__stat">
            <em className="meta">{t.game.best}</em>
            <b>{best}</b>
          </span>
        </div>

        <div className="cg__board" ref={boardRef}>
          <span className="cg__sky" aria-hidden />

          {phase === 'playing' && (
            <span
              className="cg__timebar"
              style={{ width: `${(time / DURATION) * 100}%` }}
              data-low={time <= 5 ? 'true' : undefined}
              aria-hidden
            />
          )}

          {ripples.map((r) => (
            <span key={r.id} className="cg__ripple" style={{ left: r.x, top: r.y }} aria-hidden />
          ))}

          {phase === 'playing' && (
            <button
              className="cg__tito"
              style={{ left: spot.x, top: spot.y, width: spot.size, height: spot.size * 1.12 }}
              onPointerDown={onCatch}
              aria-label={t.game.catchLabel}
            />
          )}

          {hearts.map((h) => (
            <span key={h.id} className="cg__heart" style={{ left: h.x, top: h.y }} aria-hidden>
              +1
            </span>
          ))}

          {phase === 'count' && (
            <div className="cg__overlay cg__overlay--count" aria-hidden>
              <span key={count} className="cg__count">
                {count}
              </span>
            </div>
          )}

          {phase === 'idle' && !showBoard && (
            <div className="cg__overlay">
              <span className="cg__peek" aria-hidden />
              <p className="cg__intro">{t.game.intro}</p>
              <div className="cg__introbtns">
                <button className="cg__btn cg__btn--primary" onClick={start} data-cursor="link">
                  {t.game.start} <span aria-hidden>→</span>
                </button>
                {hasLeaderboard && (
                  <button className="cg__btn" onClick={openBoard} data-cursor="link">
                    {t.game.viewRanking}
                  </button>
                )}
              </div>
            </div>
          )}

          {phase === 'idle' && showBoard && (
            <div className="cg__overlay cg__overlay--over">
              <span className="meta cg__ranks-title">{t.game.ranking}</span>
              <div className="cg__ranks cg__ranks--board">
                {top.length ? (
                  <ol>
                    {top.map((r, i) => (
                      <li key={`${r.name}-${r.created_at}`}>
                        <span className="cg__rankn">{i + 1}</span>
                        <b>{r.name}</b>
                        <em>{r.score}</em>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <span className="cg__ranks-empty">{t.game.rankingEmpty}</span>
                )}
              </div>
              <div className="cg__introbtns">
                <button className="cg__btn cg__btn--primary" onClick={start} data-cursor="link">
                  {t.game.start} <span aria-hidden>→</span>
                </button>
                <button className="cg__btn" onClick={() => setShowBoard(false)} data-cursor="link">
                  {t.game.back}
                </button>
              </div>
            </div>
          )}

          {(phase === 'ending' || phase === 'over') && (
            <div className="cg__overlay cg__overlay--over">
              <span className={`cg__medal ${isRecord ? 'is-record' : ''}`} aria-hidden>
                <svg className="cg__trophy" viewBox="0 0 64 64">
                  <defs>
                    <linearGradient id="cgGold" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ffe79a" />
                      <stop offset="52%" stopColor="#ffc23c" />
                      <stop offset="100%" stopColor="#e0891a" />
                    </linearGradient>
                  </defs>
                  <path d="M18 13 C7 13 7 30 21 32" fill="none" stroke="url(#cgGold)" strokeWidth="3.4" strokeLinecap="round" />
                  <path d="M46 13 C57 13 57 30 43 32" fill="none" stroke="url(#cgGold)" strokeWidth="3.4" strokeLinecap="round" />
                  <path d="M15 9 H49 V22 C49 33.5 41.8 41 32 41 C22.2 41 15 33.5 15 22 Z" fill="url(#cgGold)" />
                  <path d="M21 13 H29 C29 24 25 30 22.5 31.5 C19.5 28 19.5 20 21 13 Z" fill="rgba(255,255,255,0.28)" />
                  <rect x="28.5" y="41" width="7" height="8" fill="url(#cgGold)" />
                  <path d="M21 49 H43 L45 55 H19 Z" fill="url(#cgGold)" />
                  <rect x="17" y="55" width="30" height="4.5" rx="1.6" fill="url(#cgGold)" />
                </svg>
              </span>
              <span className="cg__over">{t.game.over}</span>
              <div className="cg__bigscore">
                <b>{score}</b>
                <em className="meta">{t.game.score}</em>
              </div>
              {isRecord && <span className="cg__newbest">✦ {t.game.newBest} ✦</span>}

              {phase === 'ending' && <span className="cg__ending-wait" aria-hidden />}

              {phase === 'over' && hasLeaderboard && score > 0 && (
                <div className="cg__lb">
                  {submitState !== 'done' && rank !== null && (
                    <span className="cg__rankline">
                      {t.game.youRank} <b>#{rank}</b>
                    </span>
                  )}

                  {visibleRows.length > 0 && (
                    <div className="cg__ranks">
                      <span className="meta cg__ranks-title">
                        {showFull ? t.game.ranking : t.game.around}
                      </span>
                      <ol>
                        {visibleRows.map((r, i) =>
                          r.divider ? (
                            <li key="div" className="cg__ranks-div" aria-hidden>
                              ···
                            </li>
                          ) : (
                            <li
                              key={i}
                              className={`${r.you ? 'is-you' : ''} ${r.ghost ? 'is-ghost' : ''}`.trim() || undefined}
                            >
                              <span className="cg__rankn">{r.pos}</span>
                              <b>{r.name}</b>
                              <em>{r.score}</em>
                            </li>
                          ),
                        )}
                      </ol>
                      {canToggle && (
                        <button
                          type="button"
                          className="cg__ranks-toggle"
                          onClick={() => setShowFull((v) => !v)}
                        >
                          {showFull ? t.game.viewMine : t.game.viewFull}
                        </button>
                      )}
                    </div>
                  )}

                  {submitState !== 'done' ? (
                    <>
                      <form className="cg__lbform" onSubmit={onSubmit}>
                        <span className="cg__lbfield">
                          <input
                            className="cg__lbinput"
                            value={name}
                            maxLength={MAX_NAME}
                            onChange={(e) => setName(e.target.value.slice(0, MAX_NAME))}
                            placeholder={t.game.namePlaceholder}
                            aria-label={t.game.namePlaceholder}
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck={false}
                            enterKeyHint="done"
                          />
                          <span className="cg__lbcount" aria-hidden>
                            {name.length}/{MAX_NAME}
                          </span>
                        </span>
                        <button
                          className="cg__lbbtn"
                          type="submit"
                          disabled={submitState === 'sending' || !name.trim()}
                        >
                          {submitState === 'sending' ? t.game.sending : t.game.submitScore}
                        </button>
                      </form>
                      {submitState === 'error' && <span className="cg__lberr">{t.game.lbError}</span>}
                    </>
                  ) : (
                    <span className="cg__lbdone">
                      ✓ {rank !== null ? `${t.game.youAreRanked} #${rank} ${t.game.ofBoard}` : t.game.submitted}
                    </span>
                  )}
                </div>
              )}

              {phase === 'over' && (
                <button className="cg__btn cg__btn--primary" onClick={start} data-cursor="link">
                  {t.game.again} <span aria-hidden>↺</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
