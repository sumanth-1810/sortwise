import type { Attempt } from '../types'
import {
  buildFeatures,
  computePlayerStats,
  type FeatureVector,
} from './features'
import {
  defaultModel,
  trainLogisticRegression,
  type LogisticModel,
} from './logistic'

const HISTORY_KEY = 'sortwise_attempt_history_v2'
const MODEL_KEY = 'sortwise_miss_model_v2'
const MAX_HISTORY = 400

export function loadHistory(): Attempt[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Attempt[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveHistory(history: Attempt[]): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-MAX_HISTORY)))
}

export function appendAttempts(newAttempts: Attempt[]): Attempt[] {
  const next = [...loadHistory(), ...newAttempts].slice(-MAX_HISTORY)
  saveHistory(next)
  return next
}

export function loadModel(): LogisticModel {
  try {
    const raw = localStorage.getItem(MODEL_KEY)
    if (!raw) return defaultModel()
    const parsed = JSON.parse(raw) as LogisticModel
    if (!parsed?.weights?.length) return defaultModel()
    return parsed
  } catch {
    return defaultModel()
  }
}

export function saveModel(model: LogisticModel): void {
  localStorage.setItem(MODEL_KEY, JSON.stringify(model))
}

function samplesFromHistory(history: Attempt[]): { x: FeatureVector; y: 0 | 1 }[] {
  const stats = computePlayerStats(history)
  return history.map((attempt) => ({
    x: buildFeatures({
      material: attempt.material,
      isMixed: attempt.isMixed,
      stats,
    }),
    y: attempt.correct ? 0 : 1,
  }))
}

export function retrainMissModel(): LogisticModel {
  const history = loadHistory()
  const samples = samplesFromHistory(history)
  const model =
    samples.length < 8
      ? defaultModel()
      : trainLogisticRegression(samples, { init: defaultModel() })
  saveModel(model)
  return model
}

export function getMissModel(): LogisticModel {
  const existing = loadModel()
  if (existing.trainedOn > 0) return existing
  return retrainMissModel()
}
