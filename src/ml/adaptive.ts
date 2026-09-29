import { itemMaterial, WASTE_ITEMS } from '../data/items'
import { getLevelConfig, type Level } from '../game/levels'
import type { WasteItem } from '../types'
import { buildFeatures, computePlayerStats } from './features'
import { predictMissProbability, type LogisticModel } from './logistic'
import { getMissModel, loadHistory } from './storage'

export interface RankedItem {
  item: WasteItem
  missProb: number
}

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function scoreItemMissProbability(
  item: WasteItem,
  model: LogisticModel,
): number {
  const stats = computePlayerStats(loadHistory())
  return predictMissProbability(
    model,
    buildFeatures({
      material: itemMaterial(item),
      isMixed: item.kind === 'mixed',
      stats,
    }),
  )
}

export function rankItemsByMissRisk(model = getMissModel()): RankedItem[] {
  return WASTE_ITEMS.map((item) => ({
    item,
    missProb: scoreItemMissProbability(item, model),
  })).sort((a, b) => b.missProb - a.missProb)
}

export function buildAdaptiveRound(level: Level): {
  deck: WasteItem[]
  hint: string
  secondsPerItem: number
  level: Level
} {
  const config = getLevelConfig(level)
  const size = config.roundSize
  const model = getMissModel()
  const ranked = rankItemsByMissRisk(model)

  // Higher levels pull more from the hard (high miss-risk) end
  const hardCut = Math.max(2, Math.ceil(ranked.length * 0.34))
  const midCut = Math.ceil(ranked.length * 0.67)
  const high = ranked.slice(0, hardCut)
  const mid = ranked.slice(hardCut, midCut)
  const easy = ranked.slice(midCut)

  const pick = (pool: RankedItem[], n: number, used: Set<string>) => {
    const available = shuffleInPlace(pool.filter((r) => !used.has(r.item.id)))
    const chosen: WasteItem[] = []
    for (const row of available) {
      if (chosen.length >= n) break
      chosen.push(row.item)
      used.add(row.item.id)
    }
    return chosen
  }

  const used = new Set<string>()
  const targetHigh = Math.max(1, Math.round(size * config.hardShare))
  const targetEasy = Math.max(
    1,
    Math.round(size * Math.max(0.15, 0.55 - config.hardShare)),
  )
  const targetMid = Math.max(0, size - targetHigh - targetEasy)

  const deck: WasteItem[] = [
    ...pick(high, targetHigh, used),
    ...pick(mid, targetMid, used),
    ...pick(easy, targetEasy, used),
  ]

  // Ensure enough mixed items for this level
  while (deck.filter((i) => i.kind === 'mixed').length < config.minMixed) {
    const mixedCandidates = shuffleInPlace(
      ranked.filter((r) => r.item.kind === 'mixed' && !used.has(r.item.id)),
    )
    if (mixedCandidates.length === 0) break
    const row = mixedCandidates[0]
    const replaceAt = deck.findIndex(
      (i) => i.kind === 'single' && !used.has(row.item.id),
    )
    // Prefer replacing an easy single
    const easyIdx = deck.findIndex((i) => i.kind === 'single')
    const idx = easyIdx >= 0 ? easyIdx : replaceAt
    if (idx < 0) {
      if (deck.length < size) {
        deck.push(row.item)
        used.add(row.item.id)
      } else break
    } else {
      used.delete(deck[idx].id)
      deck[idx] = row.item
      used.add(row.item.id)
    }
  }

  while (deck.length < size) {
    const leftover = ranked.find((r) => !used.has(r.item.id))
    if (!leftover) break
    deck.push(leftover.item)
    used.add(leftover.item.id)
  }

  const avg =
    deck.reduce((sum, item) => sum + scoreItemMissProbability(item, model), 0) /
    Math.max(1, deck.length)

  const mixedCount = deck.filter((i) => i.kind === 'mixed').length
  const hint = `Level ${level} · ${config.secondsPerItem}s each · ${mixedCount} mixed · risk ${(avg * 100) | 0}%`

  return {
    deck: shuffleInPlace(deck),
    hint,
    secondsPerItem: config.secondsPerItem,
    level,
  }
}
