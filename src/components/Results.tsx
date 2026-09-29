import { formatBins, formatBinsKey, getItemById } from '../data/items'
import { confusionByMaterial } from '../game/logic'
import { loadHistory } from '../ml/storage'
import type { BinId, RoundResult } from '../types'
import { ItemArt } from './ItemArt'
import { AnswerVisual } from './BinGlyph'

interface ResultsProps {
  result: RoundResult
  onReplay: () => void
  onHome: () => void
}

export function Results({ result, onReplay, onHome }: ResultsProps) {
  const correctSteps = result.attempts.filter((a) => a.correct).length
  const itemsRight = result.itemOutcomes.filter((o) => o.allCorrect).length
  const confusion = confusionByMaterial(result.attempts)
  const misses = result.attempts.filter((a) => !a.correct)
  const historyCount = loadHistory().length

  return (
    <div className="screen results">
      <header className="results-header">
        <p className="brand">SORTWISE</p>
        <h1 className="results-title">Quest complete!</h1>
        <p className="results-lede">
          {Math.round(result.accuracy * 100)}% right · {result.score} points ·
          best streak {result.maxStreak}
        </p>
        {result.level != null && (
          <p className={`level-result level-${result.levelChange ?? 'same'}`}>
            Level {result.level}
            {result.nextLevel != null && result.nextLevel !== result.level
              ? ` → Level ${result.nextLevel}`
              : ''}
            {result.secondsPerItem != null
              ? ` · ${result.secondsPerItem}s timer`
              : ''}
            {result.levelReason ? ` — ${result.levelReason}` : ''}
          </p>
        )}
        {result.adaptiveHint && (
          <p className="adaptive-hint">{result.adaptiveHint}</p>
        )}
      </header>

      <div className="stat-row">
        <div className="stat-block">
          <span className="stat-value">
            {correctSteps}/{result.attempts.length}
          </span>
          <span className="stat-label">Sorted right</span>
        </div>
        <div className="stat-block">
          <span className="stat-value">
            {itemsRight}/{result.itemOutcomes.length}
          </span>
          <span className="stat-label">Items clean</span>
        </div>
        <div className="stat-block">
          <span className="stat-value">{result.score}</span>
          <span className="stat-label">Score</span>
        </div>
      </div>

      <section className="panel">
        <h2 className="panel-title">What to practice more</h2>
        {confusion.length === 0 ? (
          <p className="panel-empty">Awesome — no weak spots this round!</p>
        ) : (
          <ul className="confusion-list">
            {confusion.map((row) => (
              <li key={row.material}>
                <span className="confusion-name">{row.material}</span>
                <span className="confusion-bar" aria-hidden>
                  <span style={{ width: `${row.rate * 100}%` }} />
                </span>
                <span className="confusion-rate">
                  {row.wrong}/{row.total} missed
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="panel-ml-note">
          The game remembers your last {historyCount} sorts and uses miss
          prediction to pick trickier practice next time.
        </p>
      </section>

      {misses.length > 0 && (
        <section className="panel">
          <h2 className="panel-title">Let&apos;s look again</h2>
          <ul className="miss-list">
            {misses.map((attempt) => {
              const item = getItemById(attempt.itemId)
              if (!item) return null
              return (
                <li key={`${attempt.itemId}-${attempt.timeMs}`}>
                  <div className="miss-art">
                    <ItemArt icon={item.icon} title={item.name} />
                  </div>
                  <div>
                    <strong>{item.name}</strong>
                    <p className="miss-answer-row">
                      <span>You:</span>
                      {attempt.timedOut || attempt.chosenKey === 'timeout' ? (
                        <span>Didn&apos;t pick (time up)</span>
                      ) : (
                        <>
                          <AnswerVisual
                            bins={
                              attempt.chosenKey
                                .split('+')
                                .filter(Boolean) as BinId[]
                            }
                          />
                          <span>{formatBinsKey(attempt.chosenKey)}</span>
                        </>
                      )}
                    </p>
                    <p className="miss-answer-row">
                      <span>Correct:</span>
                      <AnswerVisual bins={item.trueBins} />
                      <span>{formatBins(item.trueBins)}</span>
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <div className="home-actions">
        <button type="button" className="btn btn-primary" onClick={onReplay}>
          Play again
        </button>
        <button type="button" className="btn btn-ghost" onClick={onHome}>
          Back home
        </button>
      </div>
    </div>
  )
}
