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

const UNLOCKED_KEY = 'sortwise_level_v1'
const SELECTED_KEY = 'sortwise_selected_level_v1'

export function clampLevel(n: number): Level {
  return Math.min(5, Math.max(1, Math.round(n))) as Level
}

/** Highest level the player has unlocked (can play 1..unlocked). */
export function loadUnlockedLevel(): Level {
  try {
    const raw = localStorage.getItem(UNLOCKED_KEY)
    if (!raw) return 1
    return clampLevel(Number(raw))
  } catch {
    return 1
  }
}

export function saveUnlockedLevel(level: Level): void {
  localStorage.setItem(UNLOCKED_KEY, String(level))
}

/** Level chosen on the home screen to play next. */
export function loadSelectedLevel(): Level {
  try {
    const unlocked = loadUnlockedLevel()
    const raw = localStorage.getItem(SELECTED_KEY)
    if (!raw) return unlocked
    return clampLevel(Math.min(Number(raw), unlocked))
  } catch {
    return loadUnlockedLevel()
  }
}

export function saveSelectedLevel(level: Level): void {
  const unlocked = loadUnlockedLevel()
  const capped = clampLevel(Math.min(level, unlocked))
  localStorage.setItem(SELECTED_KEY, String(capped))
}

/** @deprecated use loadSelectedLevel / loadUnlockedLevel */
export function loadLevel(): Level {
  return loadSelectedLevel()
}

/** @deprecated use saveUnlockedLevel / saveSelectedLevel */
export function saveLevel(level: Level): void {
  saveUnlockedLevel(level)
  saveSelectedLevel(level)
}

export function getLevelConfig(level: Level = loadSelectedLevel()): LevelConfig {
  return LEVELS[level]
}

export type LevelChange = 'up' | 'down' | 'same'

/**
 * Update unlock + selection from round performance.
 * - Level up only when clearing your current highest unlocked level (≥75%).
 * - Bad runs (≤40%) on the highest unlocked level can drop unlock by 1.
 * - Replaying an earlier unlocked level does not change unlock progress.
 */
export function nextLevelFromPerformance(
  playedLevel: Level,
  accuracy: number,
  mixedAccuracy?: number | null,
): { level: Level; change: LevelChange; reason: string } {
  const unlocked = loadUnlockedLevel()
  let newUnlocked = unlocked as number
  let selected = playedLevel as number
  let change: LevelChange = 'same'
  let reason = `Keep practicing Level ${playedLevel}`

  const mixedOk =
    mixedAccuracy == null || Number.isNaN(mixedAccuracy)
      ? true
      : mixedAccuracy >= 0.5

  const atFrontier = playedLevel >= unlocked

  if (accuracy >= 0.75 && mixedOk) {
    if (atFrontier && unlocked < 5) {
      newUnlocked = unlocked + 1
      selected = newUnlocked
      change = 'up'
      reason = `Nice work (${Math.round(accuracy * 100)}%) — unlocked Level ${newUnlocked}!`
    } else if (atFrontier && unlocked === 5) {
      reason = `Master clear (${Math.round(accuracy * 100)}%) — stay on Level 5`
      selected = 5
    } else {
      reason = `Nice practice on Level ${playedLevel} (${Math.round(accuracy * 100)}%)`
      selected = playedLevel
    }
  } else if (accuracy <= 0.4) {
    if (atFrontier && unlocked > 1) {
      newUnlocked = unlocked - 1
      selected = newUnlocked
      change = 'down'
      reason = `Tough round (${Math.round(accuracy * 100)}%) — back to Level ${newUnlocked}`
    } else if (atFrontier) {
      reason = `Keep going (${Math.round(accuracy * 100)}%) — still Level 1`
      selected = 1
    } else {
      reason = `Practice round on Level ${playedLevel} — unlock stays at ${unlocked}`
      selected = playedLevel
    }
  }

  const level = clampLevel(newUnlocked)
  saveUnlockedLevel(level)
  saveSelectedLevel(clampLevel(selected))
  return { level: clampLevel(selected), change, reason }
}
