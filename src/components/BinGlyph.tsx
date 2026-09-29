import type { BinId } from '../types'
import { BINS } from '../data/items'

interface BinGlyphProps {
  bin: BinId
  size?: number
}

/** Clear pictorial bin symbols paired with text labels on answers. */
export function BinGlyph({ bin, size = 28 }: BinGlyphProps) {
  const color = BINS[bin].color
  return (
    <span className="bin-glyph" style={{ width: size, height: size }} aria-hidden>
      <svg viewBox="0 0 32 32" width={size} height={size}>
        <rect width="32" height="32" rx="2" fill={color} stroke="#000" strokeWidth="2" />
        {bin === 'recycle' && (
          <g fill="none" stroke="#fff" strokeWidth="2.4" strokeLinejoin="round">
            <path d="M16 6l4 7h-8z" fill="#fff" stroke="none" />
            <path d="M9 20l-4-7h8" />
            <path d="M23 20l4-7h-8" />
            <path d="M12 13l-3 7h6z" fill="#fff" stroke="none" />
            <path d="M20 13l3 7h-6z" fill="#fff" stroke="none" />
          </g>
        )}
        {bin === 'compost' && (
          <g fill="#fff">
            <ellipse cx="16" cy="22" rx="9" ry="4" />
            <path d="M16 8c-3 5-8 8-8 13h16c0-5-5-8-8-13z" />
          </g>
        )}
        {bin === 'landfill' && (
          <g fill="#fff">
            <path d="M8 12h16l-1.8 13H9.8z" />
            <rect x="11" y="8" width="10" height="4" />
            <path d="M14 16v6M18 16v6" stroke={color} strokeWidth="2" />
          </g>
        )}
        {bin === 'ewaste' && (
          <g>
            <rect x="9" y="8" width="14" height="16" rx="1" fill="#fff" />
            <rect x="11" y="10" width="10" height="8" fill={color} />
            <circle cx="16" cy="21" r="1.4" fill={color} />
          </g>
        )}
      </svg>
    </span>
  )
}

interface AnswerVisualProps {
  bins: BinId[]
}

export function AnswerVisual({ bins }: AnswerVisualProps) {
  return (
    <span className="answer-visual">
      {bins.map((bin, i) => (
        <span key={`${bin}-${i}`} className="answer-visual-pair">
          {i > 0 && <span className="answer-plus">+</span>}
          <BinGlyph bin={bin} size={26} />
        </span>
      ))}
    </span>
  )
}
