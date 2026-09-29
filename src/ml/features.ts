import type { Attempt, MaterialCategory } from '../types'

export const MATERIALS: MaterialCategory[] = [
  'metal',
  'plastic',
  'glass',
  'paper',
  'cardboard',
  'organic',
  'composite',
  'electronics',
  'other',
]

export const FEATURE_NAMES = [
  'bias',
  ...MATERIALS.map((m) => `mat_${m}`),
  'is_mixed',
  'hist_material_miss',
  'hist_overall_miss',
  'hist_mixed_miss',
] as const

export type FeatureVector = number[]

export interface PlayerStats {
  overallMissRate: number
  mixedMissRate: number
  materialMissRate: Record<MaterialCategory, number>
  attemptCount: number
}

export function emptyPlayerStats(): PlayerStats {
  const materialMissRate = Object.fromEntries(
    MATERIALS.map((m) => [m, 0.35]),
  ) as Record<MaterialCategory, number>

  return {
    overallMissRate: 0.35,
    mixedMissRate: 0.45,
    materialMissRate,
    attemptCount: 0,
  }
}

export function computePlayerStats(history: Attempt[]): PlayerStats {
  const stats = emptyPlayerStats()
  if (history.length === 0) return stats

  const matWrong = Object.fromEntries(MATERIALS.map((m) => [m, 0])) as Record<
    MaterialCategory,
    number
  >
  const matTotal = Object.fromEntries(MATERIALS.map((m) => [m, 0])) as Record<
    MaterialCategory,
    number
  >

  let wrong = 0
  let mixedWrong = 0
  let mixedTotal = 0

  for (const a of history) {
    matTotal[a.material] += 1
    if (!a.correct) {
      wrong += 1
      matWrong[a.material] += 1
    }
    if (a.isMixed) {
      mixedTotal += 1
      if (!a.correct) mixedWrong += 1
    }
  }

  stats.attemptCount = history.length
  stats.overallMissRate = wrong / history.length
  stats.mixedMissRate = mixedTotal === 0 ? 0.45 : mixedWrong / mixedTotal

  for (const m of MATERIALS) {
    stats.materialMissRate[m] =
      matTotal[m] === 0 ? stats.overallMissRate : matWrong[m] / matTotal[m]
  }

  return stats
}

export function buildFeatures(args: {
  material: MaterialCategory
  isMixed: boolean
  stats: PlayerStats
}): FeatureVector {
  const { material, isMixed, stats } = args
  const x: number[] = [1]

  for (const m of MATERIALS) {
    x.push(m === material ? 1 : 0)
  }

  x.push(isMixed ? 1 : 0)
  x.push(stats.materialMissRate[material])
  x.push(stats.overallMissRate)
  x.push(stats.mixedMissRate)

  return x
}
