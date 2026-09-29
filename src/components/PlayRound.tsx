import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import {
  BINS,
  binsKey,
  formatBins,
  getAnswerOptions,
  itemMaterial,
  sameBins,
} from '../data/items'
import {
  scoreAttempt,
  summarizeRound,
} from '../game/logic'
import { getLevelConfig, loadLevel, nextLevelFromPerformance } from '../game/levels'
import { buildAdaptiveRound } from '../ml/adaptive'
import { appendAttempts, retrainMissModel } from '../ml/storage'
import type {
  Attempt,
  BinId,
  ItemOutcome,
  RoundResult,
  WasteItem,
} from '../types'
import { ItemArt } from './ItemArt'
import { AnswerVisual, BinGlyph } from './BinGlyph'

interface PlayRoundProps {
  onFinish: (result: RoundResult) => void
}

type FeedbackState = {
  correct: boolean
  chosen: BinId[]
  item: WasteItem
  points: number
  attempts: Attempt[]
  outcomes: ItemOutcome[]
  score: number
  isLast: boolean
}

export function PlayRound({ onFinish }: PlayRoundProps) {
  const level = useMemo(() => loadLevel(), [])
  const { deck, hint, secondsPerItem } = useMemo(
    () => buildAdaptiveRound(level),
    [level],
  )
  const levelConfig = getLevelConfig(level)
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [outcomes, setOutcomes] = useState<ItemOutcome[]>([])
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [timeLeft, setTimeLeft] = useState(secondsPerItem)

  const startedAt = useRef(Date.now())
  const locked = useRef(false)
  const streakRef = useRef(0)
  const scoreRef = useRef(0)
  const attemptsRef = useRef<Attempt[]>([])
  const outcomesRef = useRef<ItemOutcome[]>([])
  const secondsRef = useRef(secondsPerItem)

  const item = deck[index]
  const options = useMemo(
    () => (item ? getAnswerOptions(item) : []),
    [item],
  )

  useEffect(() => {
    secondsRef.current = secondsPerItem
  }, [secondsPerItem])

  useEffect(() => {
    streakRef.current = streak
  }, [streak])
  useEffect(() => {
    scoreRef.current = score
  }, [score])
  useEffect(() => {
    attemptsRef.current = attempts
  }, [attempts])
  useEffect(() => {
    outcomesRef.current = outcomes
  }, [outcomes])

  useEffect(() => {
    startedAt.current = Date.now()
    setTimeLeft(secondsPerItem)
    locked.current = false
  }, [index, secondsPerItem])

  useEffect(() => {
    if (feedback) return undefined
    const id = window.setInterval(() => {
      const limit = secondsRef.current
      const elapsed = (Date.now() - startedAt.current) / 1000
      const left = Math.max(0, limit - elapsed)
      setTimeLeft(left)
      if (left <= 0 && !locked.current) {
        locked.current = true
        resolveChoice(null)
      }
    }, 50)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedback, index])

  function resolveChoice(chosen: BinId[] | null) {
    const current = deck[index]
    if (!current) return

    const timeMs = Date.now() - startedAt.current
    const timedOut = chosen === null
    const chosenBins: BinId[] = timedOut ? ['landfill'] : chosen
    const correct = !timedOut && sameBins(chosenBins, current.trueBins)
    const { points, newStreak } = scoreAttempt(
      correct,
      timeMs,
      streakRef.current,
      secondsRef.current,
    )

    const attempt: Attempt = {
      itemId: current.id,
      chosenKey: binsKey(chosenBins),
      correctKey: binsKey(current.trueBins),
      material: itemMaterial(current),
      isMixed: current.kind === 'mixed',
      correct,
      timeMs,
    }

    const outcome: ItemOutcome = {
      itemId: current.id,
      allCorrect: correct,
      points,
      attempts: [attempt],
    }

    const nextAttempts = [...attemptsRef.current, attempt]
    const nextOutcomes = [...outcomesRef.current, outcome]
    const nextScore = scoreRef.current + points

    attemptsRef.current = nextAttempts
    outcomesRef.current = nextOutcomes
    scoreRef.current = nextScore
    streakRef.current = newStreak

    setAttempts(nextAttempts)
    setOutcomes(nextOutcomes)
    setScore(nextScore)
    setStreak(newStreak)
    setFeedback({
      correct,
      chosen: chosenBins,
      item: current,
      points,
      attempts: nextAttempts,
      outcomes: nextOutcomes,
      score: nextScore,
      isLast: index + 1 >= deck.length,
    })
  }

  function handleOption(bins: BinId[]) {
    if (locked.current || feedback) return
    locked.current = true
    resolveChoice(bins)
  }

  function handleContinue() {
    if (!feedback) return
    if (feedback.isLast) {
      appendAttempts(feedback.attempts)
      retrainMissModel()
      const accuracy =
        feedback.attempts.filter((a) => a.correct).length /
        Math.max(1, feedback.attempts.length)
      const mixed = feedback.attempts.filter((a) => a.isMixed)
      const mixedAccuracy =
        mixed.length === 0
          ? null
          : mixed.filter((a) => a.correct).length / mixed.length
      const progression = nextLevelFromPerformance(
        level,
        accuracy,
        mixedAccuracy,
      )
      onFinish(
        summarizeRound(feedback.attempts, feedback.outcomes, feedback.score, {
          adaptiveHint: hint,
          level,
          nextLevel: progression.level,
          levelChange: progression.change,
          levelReason: progression.reason,
          secondsPerItem,
        }),
      )
      return
    }
    setFeedback(null)
    setIndex((i) => i + 1)
  }

  if (!item) return null

  const progress = ((index + (feedback ? 1 : 0)) / deck.length) * 100

  return (
    <div className="screen play">
      <header className="play-hud">
        <div className="hud-stat">
          <span className="hud-label">Level</span>
          <strong>{level}</strong>
        </div>
        <div className="hud-stat">
          <span className="hud-label">Score</span>
          <strong>{score}</strong>
        </div>
        <div className="hud-stat">
          <span className="hud-label">Item</span>
          <strong>
            {index + 1}/{deck.length}
          </strong>
        </div>
      </header>

      <div className="progress-track" aria-hidden>
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {!feedback ? (
        <>
          <div className="timer-wrap">
            <div
              className={`timer-ring ${timeLeft < 3 ? 'urgent' : ''}`}
              style={
                {
                  '--p': `${(timeLeft / secondsPerItem) * 100}%`,
                } as CSSProperties
              }
            >
              <span>{Math.ceil(timeLeft)}</span>
            </div>
            <p className="prompt">
              Lv {level} · {levelConfig.label} · {secondsPerItem}s
              <br />
              {item.kind === 'mixed'
                ? 'Mixed — pick the right combo'
                : 'Where does this go?'}
            </p>
          </div>

          <article
            className="item-card"
            style={{ '--accent': item.accent } as CSSProperties}
          >
            {item.kind === 'mixed' && (
              <p className="mixed-badge">Mixed waste</p>
            )}
            <ItemArt icon={item.icon} title={item.name} />
            <h2 className="item-name">{item.name}</h2>
            {item.kind === 'mixed' && (
              <ul className="parts-list">
                {item.parts.map((part) => (
                  <li key={part.label}>{part.label}</li>
                ))}
              </ul>
            )}
          </article>

          <div className="bin-grid" role="group" aria-label="Sorting answers">
            {options.map((bins) => {
              const key = binsKey(bins)
              const isCombo = bins.length > 1
              return (
                <button
                  key={key}
                  type="button"
                  className={`bin-btn ${isCombo ? 'bin-btn-combo' : ''}`}
                  style={
                    {
                      '--bin': isCombo
                        ? BINS[bins[0]].color
                        : BINS[bins[0]].color,
                    } as CSSProperties
                  }
                  onClick={() => handleOption(bins)}
                >
                  <AnswerVisual bins={bins} />
                  <span className="bin-btn-label">{formatBins(bins)}</span>
                  <span className="bin-btn-short">
                    {isCombo
                      ? 'Sort into both'
                      : BINS[bins[0]].short}
                  </span>
                </button>
              )
            })}
          </div>
        </>
      ) : (
        <div className={`feedback ${feedback.correct ? 'ok' : 'bad'}`}>
          <p className="feedback-badge">
            {feedback.correct ? 'Great job!' : 'Oops — not quite'}
            <span className="feedback-points">
              {feedback.points >= 0 ? `+${feedback.points}` : feedback.points}
            </span>
          </p>
          <h2 className="feedback-title">{feedback.item.name}</h2>
          <p className="feedback-bins">
            <span className="feedback-choice-row">
              You chose <AnswerVisual bins={feedback.chosen} />
              <strong>{formatBins(feedback.chosen)}</strong>
            </span>
            {!feedback.correct && (
              <span className="feedback-choice-row">
                Right answer <AnswerVisual bins={feedback.item.trueBins} />
                <strong>{formatBins(feedback.item.trueBins)}</strong>
              </span>
            )}
          </p>
          <p className="feedback-why">{feedback.item.explanation}</p>
          {feedback.item.kind === 'mixed' && (
            <ul className="parts-feedback">
              {feedback.item.parts.map((part) => (
                <li key={part.label}>
                  <BinGlyph bin={part.trueBin} size={20} />
                  {part.label} → {BINS[part.trueBin].kidLabel}
                </li>
              ))}
            </ul>
          )}
          <button type="button" className="btn btn-primary" onClick={handleContinue}>
            {feedback.isLast ? 'See results' : 'Next item'}
          </button>
        </div>
      )}
    </div>
  )
}
