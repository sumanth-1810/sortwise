import type { CSSProperties } from 'react'
import { BINS } from '../data/items'
import { getLevelConfig, loadLevel, type Level } from '../game/levels'
import type { BinId } from '../types'
import { BinGlyph } from './BinGlyph'

interface HomeProps {
  onStart: () => void
}

export function Home({ onStart }: HomeProps) {
  const level = loadLevel()
  const config = getLevelConfig(level)

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
          Level {level} · {config.label} · {config.secondsPerItem}s per item
        </p>
      </header>

      <div className="level-track" aria-label="Levels 1 to 5">
        {([1, 2, 3, 4, 5] as Level[]).map((lv) => (
          <div
            key={lv}
            className={`level-pip ${lv === level ? 'active' : ''} ${lv < level ? 'cleared' : ''}`}
          >
            {lv}
          </div>
        ))}
      </div>

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
          Start crafting!
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
        Score ≥75% to level up · ≤40% drops a level · time gets tighter up high
      </p>
    </div>
  )
}
