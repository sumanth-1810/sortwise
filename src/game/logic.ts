import { WASTE_ITEMS } from '../data/items'
import type { Attempt, ItemOutcome, RoundResult } from '../types'
import type { Level, LevelChange } from './levels'

export const BASE_POINTS = 100
export const SPEED_BONUS_MAX = 40
export const STREAK_BONUS = 12
export const WRONG_PENALTY = 25

/** @deprecated use level config — kept so old imports don't break mid-edit */
export const SECONDS_PER_STEP = 20
export const ROUND_SIZE = 8

export function scoreAttempt(
  correct: boolean,
  timeMs: number,
  streakBefore: number,
  secondsPerItem: number,
): { points: number; newStreak: number } {
  if (!correct) {
    return { points: -WRONG_PENALTY, newStreak: 0 }
  }

  const timeLimitMs = secondsPerItem * 1000
  const speedRatio = Math.max(0, 1 - timeMs / timeLimitMs)
  const speedBonus = Math.round(SPEED_BONUS_MAX * speedRatio)
  const streakBonus = streakBefore * STREAK_BONUS
  return {
    points: BASE_POINTS + speedBonus + streakBonus,
    newStreak: streakBefore + 1,
  }
}

export function summarizeRound(
  attempts: Attempt[],
  itemOutcomes: ItemOutcome[],
  score: number,
  extras?: {
    adaptiveHint?: string
    level?: Level
    nextLevel?: Level
    levelChange?: LevelChange
    levelReason?: string
    secondsPerItem?: number
  },
): RoundResult {
  const correctSteps = attempts.filter((a) => a.correct).length
  let streak = 0
  let maxStreak = 0
  for (const attempt of attempts) {
    if (attempt.correct) {
      streak += 1
      maxStreak = Math.max(maxStreak, streak)
    } else {
      streak = 0
    }
  }

  const mixed = attempts.filter((a) => a.isMixed)
  const mixedAccuracy =
    mixed.length === 0
      ? null
      : mixed.filter((a) => a.correct).length / mixed.length

  return {
    attempts,
    itemOutcomes,
    score,
    accuracy: attempts.length === 0 ? 0 : correctSteps / attempts.length,
    maxStreak,
    adaptiveHint: extras?.adaptiveHint,
    level: extras?.level,
    nextLevel: extras?.nextLevel,
    levelChange: extras?.levelChange,
    levelReason: extras?.levelReason,
    secondsPerItem: extras?.secondsPerItem,
    mixedAccuracy,
  }
}

export interface ConfusionRow {
  material: string
  wrong: number
  total: number
  rate: number
}

export function confusionByMaterial(attempts: Attempt[]): ConfusionRow[] {
  const map = new Map<string, { wrong: number; total: number }>()

  for (const attempt of attempts) {
    const entry = map.get(attempt.material) ?? { wrong: 0, total: 0 }
    entry.total += 1
    if (!attempt.correct) entry.wrong += 1
    map.set(attempt.material, entry)
  }

  return [...map.entries()]
    .map(([material, { wrong, total }]) => ({
      material,
      wrong,
      total,
      rate: wrong / total,
    }))
    .filter((row) => row.wrong > 0)
    .sort((a, b) => b.rate - a.rate || b.wrong - a.wrong)
}

export function itemDisplayName(itemId: string): string {
  return WASTE_ITEMS.find((i) => i.id === itemId)?.name ?? itemId
}
