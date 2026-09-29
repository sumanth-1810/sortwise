import { useState, type CSSProperties } from 'react'
import { BINS } from '../data/items'
import {
  getLevelConfig,
  loadSelectedLevel,
  loadUnlockedLevel,
  saveSelectedLevel,
  type Level,
} from '../game/levels'
import type { BinId } from '../types'
import { BinGlyph } from './BinGlyph'

interface HomeProps {
  onStart: () => void
}

export function Home({ onStart }: HomeProps) {
  const unlocked = loadUnlockedLevel()
  const [selected, setSelected] = useState<Level>(() => loadSelectedLevel())
  const config = getLevelConfig(selected)

  function selectLevel(lv: Level) {
    if (lv > unlocked) return
    saveSelectedLevel(lv)
    setSelected(lv)
  }

  return (
    <div className="screen home">
      <div className="home-atmosphere" aria-hidden />
      <header className="home-header">
        <p className="brand">SORTWISE</p>
        <h1 className="home-title">Sort the junk blocks.</h1>
        <p className="home-lede">
          Craft cleaner biomes! Singles go in one chest. Mixed loot needs a
          combo — like Compost + Trash.
        </p>
        <p className="level-banner">
          Level {selected} · {config.label} · {config.secondsPerItem}s per item
        </p>
      </header>

      <div className="level-track" aria-label="Levels 1 to 5">
        {([1, 2, 3, 4, 5] as Level[]).map((lv) => {
          const locked = lv > unlocked
          const isSelected = lv === selected
          const cleared = lv < unlocked
          return (
            <button
              key={lv}
              type="button"
              disabled={locked}
              title={
                locked
                  ? `Locked — clear Level ${lv - 1} first`
                  : `Play Level ${lv}`
              }
              className={`level-pip ${isSelected ? 'active' : ''} ${cleared ? 'cleared' : ''} ${locked ? 'locked' : ''}`}
              onClick={() => selectLevel(lv)}
            >
              {lv}
            </button>
          )
        })}
      </div>
      <p className="level-hint">
        Tap an unlocked level to replay it. Higher levels stay locked until you
        clear the one before.
      </p>

      <div className="bin-preview" aria-hidden>
        {(Object.keys(BINS) as BinId[]).map((id) => (
          <div
            key={id}
            className="bin-chip"
            style={{ '--bin': BINS[id].color } as CSSProperties}
          >
            <BinGlyph bin={id} size={18} />
            {BINS[id].kidLabel}
          </div>
        ))}
      </div>

      <div className="home-actions">
        <button type="button" className="btn btn-primary" onClick={onStart}>
          Start Level {selected}!
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          disabled
          title="Coming later"
        >
          Scan item (CV — soon)
        </button>
      </div>

      <p className="home-note">
        Score ≥75% on your highest level to unlock the next · ≤40% can drop
        unlock
      </p>
    </div>
  )
}
