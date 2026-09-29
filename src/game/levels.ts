export type Level = 1 | 2 | 3 | 4 | 5

export interface LevelConfig {
  level: Level
  label: string
  secondsPerItem: number
  roundSize: number
  /** Share of round from high miss-risk items (0–1) */
  hardShare: number
  /** Minimum mixed items in the round */
  minMixed: number
}

/** Level 1 is generous; higher levels squeeze time and raise hard/mixed share. */
export const LEVELS: Record<Level, LevelConfig> = {
  1: {
    level: 1,
    label: 'Beginner',
    secondsPerItem: 20,
    roundSize: 8,
    hardShare: 0.2,
    minMixed: 1,
  },
  2: {
    level: 2,
    label: 'Explorer',
    secondsPerItem: 16,
    roundSize: 8,
    hardShare: 0.35,
    minMixed: 2,
  },
  3: {
    level: 3,
    label: 'Sorter',
    secondsPerItem: 13,
    roundSize: 8,
    hardShare: 0.5,
    minMixed: 2,
  },
  4: {
    level: 4,
    label: 'Pro',
    secondsPerItem: 10,
    roundSize: 8,
    hardShare: 0.6,
    minMixed: 3,
  },
  5: {
    level: 5,
    label: 'Master',
    secondsPerItem: 8,
    roundSize: 8,
    hardShare: 0.75,
    minMixed: 3,
  },
}

const LEVEL_KEY = 'sortwise_level_v1'

export function clampLevel(n: number): Level {
  return Math.min(5, Math.max(1, Math.round(n))) as Level
}

export function loadLevel(): Level {
  try {
    const raw = localStorage.getItem(LEVEL_KEY)
    if (!raw) return 1
    return clampLevel(Number(raw))
  } catch {
    return 1
  }
}

export function saveLevel(level: Level): void {
  localStorage.setItem(LEVEL_KEY, String(level))
}

export function getLevelConfig(level: Level = loadLevel()): LevelConfig {
  return LEVELS[level]
}

export type LevelChange = 'up' | 'down' | 'same'

/**
 * Promote/demote from round accuracy (and mixed accuracy if present).
 * ≥75% → up · ≤40% → down · otherwise stay
 */
export function nextLevelFromPerformance(
  current: Level,
  accuracy: number,
  mixedAccuracy?: number | null,
): { level: Level; change: LevelChange; reason: string } {
  let target = current as number
  let change: LevelChange = 'same'
  let reason = 'Keep practicing this level'

  const mixedOk =
    mixedAccuracy == null || Number.isNaN(mixedAccuracy)
      ? true
      : mixedAccuracy >= 0.5

  if (accuracy >= 0.75 && mixedOk && current < 5) {
    target = current + 1
    change = 'up'
    reason = `Nice work (${Math.round(accuracy * 100)}%) — level up!`
  } else if (accuracy >= 0.75 && current === 5) {
    reason = `Master clear (${Math.round(accuracy * 100)}%) — stay on Level 5`
  } else if (accuracy <= 0.4 && current > 1) {
    target = current - 1
    change = 'down'
    reason = `Tough round (${Math.round(accuracy * 100)}%) — easier level next`
  } else if (accuracy <= 0.4) {
    reason = `Keep going (${Math.round(accuracy * 100)}%) — still Level 1`
  }

  const level = clampLevel(target)
  saveLevel(level)
  return { level, change, reason }
}
