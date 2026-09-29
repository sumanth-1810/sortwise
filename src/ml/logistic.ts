import { FEATURE_NAMES, type FeatureVector } from './features'

export interface LogisticModel {
  weights: number[]
  trainedOn: number
}

function sigmoid(z: number): number {
  if (z >= 20) return 1
  if (z <= -20) return 0
  return 1 / (1 + Math.exp(-z))
}

export function defaultModel(): LogisticModel {
  const weights = new Array(FEATURE_NAMES.length).fill(0)
  weights[0] = -0.6
  const names = FEATURE_NAMES as readonly string[]
  const idx = (name: string) => names.indexOf(name)
  weights[idx('mat_composite')] = 0.5
  weights[idx('mat_cardboard')] = 0.15
  weights[idx('mat_plastic')] = 0.1
  weights[idx('is_mixed')] = 0.55
  weights[idx('hist_material_miss')] = 0.8
  weights[idx('hist_overall_miss')] = 0.4
  weights[idx('hist_mixed_miss')] = 0.55
  return { weights, trainedOn: 0 }
}

export function predictMissProbability(
  model: LogisticModel,
  features: FeatureVector,
): number {
  let z = 0
  const n = Math.min(model.weights.length, features.length)
  for (let i = 0; i < n; i += 1) {
    z += model.weights[i] * features[i]
  }
  return sigmoid(z)
}

export function trainLogisticRegression(
  samples: { x: FeatureVector; y: 0 | 1 }[],
  options?: { epochs?: number; lr?: number; l2?: number; init?: LogisticModel },
): LogisticModel {
  const epochs = options?.epochs ?? 80
  const lr = options?.lr ?? 0.35
  const l2 = options?.l2 ?? 0.01
  const model = options?.init
    ? { weights: [...options.init.weights], trainedOn: samples.length }
    : defaultModel()

  if (samples.length === 0) return model

  const dim = FEATURE_NAMES.length
  if (model.weights.length !== dim) {
    model.weights = defaultModel().weights
  }

  for (let epoch = 0; epoch < epochs; epoch += 1) {
    const grad = new Array(dim).fill(0)

    for (const sample of samples) {
      const p = predictMissProbability(model, sample.x)
      const error = p - sample.y
      for (let i = 0; i < dim; i += 1) {
        grad[i] += error * (sample.x[i] ?? 0)
      }
    }

    const n = samples.length
    for (let i = 0; i < dim; i += 1) {
      const reg = i === 0 ? 0 : l2 * model.weights[i]
      model.weights[i] -= lr * (grad[i] / n + reg)
    }
  }

  model.trainedOn = samples.length
  return model
}
