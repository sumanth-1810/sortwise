export type BinId = 'recycle' | 'compost' | 'landfill' | 'ewaste'

export type MaterialCategory =
  | 'metal'
  | 'plastic'
  | 'glass'
  | 'paper'
  | 'cardboard'
  | 'organic'
  | 'composite'
  | 'electronics'
  | 'other'

/** Key into SVG illustrations in ItemArt. */
export type IconId =
  | 'aluminum-can'
  | 'water-bottle'
  | 'glass-jar'
  | 'newspaper'
  | 'cardboard-box'
  | 'yogurt-cup'
  | 'tin-can'
  | 'banana-peel'
  | 'apple-core'
  | 'coffee-grounds'
  | 'veggie-scraps'
  | 'eggshells'
  | 'plastic-bag'
  | 'chip-bag'
  | 'styrofoam'
  | 'coffee-cup'
  | 'wrapper'
  | 'broken-mug'
  | 'phone'
  | 'battery'
  | 'earbuds'
  | 'cfl-bulb'
  | 'pizza-box-slice'
  | 'lunch-tray'
  | 'jar-sauce'
  | 'takeout-bag'
  | 'gift-box'
  | 'toy-batteries'
  | 'picnic-plate'
  | 'yogurt-foil'

export interface WastePart {
  label: string
  trueBin: BinId
  material: MaterialCategory
}

export interface WasteItem {
  id: string
  name: string
  kind: 'single' | 'mixed'
  icon: IconId
  accent: string
  explanation: string
  /** For singles: one bin. For mixed: the correct combo (order does not matter). */
  trueBins: BinId[]
  /** Parts kids are sorting (shown in feedback for mixed). */
  parts: WastePart[]
  /**
   * Answer buttons for this card.
   * Singles usually omit this (defaults to the four bins).
   * Mixed: include the correct combo plus a few clear wrong options.
   */
  options?: BinId[][]
}

export interface Attempt {
  itemId: string
  /** Bin key like "compost+landfill", or "timeout" if time ran out */
  chosenKey: string
  correctKey: string
  material: MaterialCategory
  isMixed: boolean
  correct: boolean
  timeMs: number
  timedOut?: boolean
}

export interface ItemOutcome {
  itemId: string
  allCorrect: boolean
  points: number
  attempts: Attempt[]
}

export interface RoundResult {
  attempts: Attempt[]
  itemOutcomes: ItemOutcome[]
  score: number
  accuracy: number
  maxStreak: number
  adaptiveHint?: string
  level?: 1 | 2 | 3 | 4 | 5
  nextLevel?: 1 | 2 | 3 | 4 | 5
  levelChange?: 'up' | 'down' | 'same'
  levelReason?: string
  secondsPerItem?: number
  mixedAccuracy?: number | null
}

export type Screen = 'home' | 'play' | 'results' | 'scan'
