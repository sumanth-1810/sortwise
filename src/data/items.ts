import type { BinId, WasteItem } from '../types'

export const BINS: Record<
  BinId,
  { id: BinId; label: string; short: string; color: string; kidLabel: string }
> = {
  recycle: {
    id: 'recycle',
    label: 'Recycle',
    kidLabel: 'Recycling',
    short: 'Clean recyclables',
    color: '#2f6fed',
  },
  compost: {
    id: 'compost',
    label: 'Compost',
    kidLabel: 'Compost',
    short: 'Food & organics',
    color: '#2f8f4e',
  },
  landfill: {
    id: 'landfill',
    label: 'Landfill',
    kidLabel: 'Trash',
    short: 'Trash',
    color: '#5c6570',
  },
  ewaste: {
    id: 'ewaste',
    label: 'E-waste',
    kidLabel: 'E-waste',
    short: 'Electronics',
    color: '#c45c16',
  },
}

const BIN_ORDER: BinId[] = ['recycle', 'compost', 'landfill', 'ewaste']

export function normalizeBins(bins: BinId[]): BinId[] {
  const set = new Set(bins)
  return BIN_ORDER.filter((b) => set.has(b))
}

export function binsKey(bins: BinId[]): string {
  return normalizeBins(bins).join('+')
}

export function formatBins(bins: BinId[]): string {
  return normalizeBins(bins)
    .map((b) => BINS[b].kidLabel)
    .join(' + ')
}

export function formatBinsKey(key: string): string {
  const bins = key.split('+').filter(Boolean) as BinId[]
  return formatBins(bins)
}

export function sameBins(a: BinId[], b: BinId[]): boolean {
  return binsKey(a) === binsKey(b)
}

/** Buttons shown for a card — singles get 4 bins; mixed use curated combos. */
export function getAnswerOptions(item: WasteItem): BinId[][] {
  let opts: BinId[][]
  if (item.options && item.options.length > 0) {
    opts = item.options.map(normalizeBins)
    if (item.kind === 'mixed') {
      const comboCount = opts.filter((bins) => bins.length > 1).length
      if (comboCount < 2) {
        console.warn(
          `Mixed item "${item.id}" has fewer than 2 combo options`,
        )
      }
    }
  } else {
    opts = (['recycle', 'compost', 'landfill', 'ewaste'] as BinId[]).map(
      (b) => [b],
    )
  }

  // Shuffle so the correct answer isn't always in the same spot
  for (let i = opts.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[opts[i], opts[j]] = [opts[j], opts[i]]
  }
  return opts
}

function single(
  id: WasteItem['id'],
  name: string,
  trueBin: BinId,
  material: WasteItem['parts'][0]['material'],
  explanation: string,
  icon: WasteItem['icon'],
  accent: string,
): WasteItem {
  return {
    id,
    name,
    kind: 'single',
    icon,
    accent,
    explanation,
    trueBins: [trueBin],
    parts: [{ label: name, trueBin, material }],
  }
}

export const WASTE_ITEMS: WasteItem[] = [
  single(
    'aluminum-can',
    'Aluminum soda can',
    'recycle',
    'metal',
    'Empty metal cans go in recycling.',
    'aluminum-can',
    '#d4a017',
  ),
  single(
    'water-bottle',
    'Plastic water bottle',
    'recycle',
    'plastic',
    'Empty plastic bottles go in recycling.',
    'water-bottle',
    '#4aa3df',
  ),
  single(
    'glass-jar',
    'Glass pasta jar',
    'recycle',
    'glass',
    'Clean glass jars go in recycling.',
    'glass-jar',
    '#7ec8a3',
  ),
  single(
    'newspaper',
    'Newspaper',
    'recycle',
    'paper',
    'Clean paper goes in recycling.',
    'newspaper',
    '#8b7355',
  ),
  single(
    'cardboard-box',
    'Clean cardboard box',
    'recycle',
    'cardboard',
    'Clean dry cardboard goes in recycling.',
    'cardboard-box',
    '#c4a574',
  ),
  single(
    'yogurt-cup',
    'Yogurt cup (rinsed)',
    'recycle',
    'plastic',
    'A rinsed yogurt cup can go in recycling.',
    'yogurt-cup',
    '#f0e6d8',
  ),
  single(
    'tin-can',
    'Steel soup can',
    'recycle',
    'metal',
    'Empty soup cans go in recycling.',
    'tin-can',
    '#9aa0a6',
  ),
  single(
    'banana-peel',
    'Banana peel',
    'compost',
    'organic',
    'Fruit peels go in compost.',
    'banana-peel',
    '#f5d76e',
  ),
  single(
    'apple-core',
    'Apple core',
    'compost',
    'organic',
    'Apple cores go in compost.',
    'apple-core',
    '#d64545',
  ),
  single(
    'coffee-grounds',
    'Coffee grounds',
    'compost',
    'organic',
    'Coffee grounds go in compost.',
    'coffee-grounds',
    '#5c4033',
  ),
  single(
    'veggie-scraps',
    'Vegetable scraps',
    'compost',
    'organic',
    'Veggie scraps go in compost.',
    'veggie-scraps',
    '#e67e22',
  ),
  single(
    'eggshells',
    'Eggshells',
    'compost',
    'organic',
    'Eggshells go in compost.',
    'eggshells',
    '#f5f0e6',
  ),
  single(
    'plastic-bag',
    'Plastic grocery bag',
    'landfill',
    'plastic',
    'Soft plastic bags do not go in recycling — put them in trash.',
    'plastic-bag',
    '#85c1e9',
  ),
  single(
    'chip-bag',
    'Chip bag',
    'landfill',
    'composite',
    'Chip bags are mixed materials — trash.',
    'chip-bag',
    '#f4d03f',
  ),
  single(
    'styrofoam',
    'Styrofoam takeout box',
    'landfill',
    'plastic',
    'Styrofoam usually goes in the trash.',
    'styrofoam',
    '#fafafa',
  ),
  single(
    'coffee-cup',
    'Disposable coffee cup',
    'landfill',
    'composite',
    'Most coffee cups have a lining — trash, not recycling.',
    'coffee-cup',
    '#6d4c41',
  ),
  single(
    'wrapper',
    'Candy wrapper',
    'landfill',
    'plastic',
    'Candy wrappers go in the trash.',
    'wrapper',
    '#e91e63',
  ),
  single(
    'broken-mug',
    'Broken ceramic mug',
    'landfill',
    'other',
    'Broken mugs are not glass recycling — trash.',
    'broken-mug',
    '#a1887f',
  ),
  single(
    'phone',
    'Old smartphone',
    'ewaste',
    'electronics',
    'Phones go to e-waste, never in the trash.',
    'phone',
    '#212121',
  ),
  single(
    'battery',
    'AA batteries',
    'ewaste',
    'electronics',
    'Batteries go to e-waste.',
    'battery',
    '#27ae60',
  ),
  single(
    'earbuds',
    'Broken earbuds',
    'ewaste',
    'electronics',
    'Earbuds go to e-waste.',
    'earbuds',
    '#34495e',
  ),
  single(
    'cfl-bulb',
    'CFL light bulb',
    'ewaste',
    'electronics',
    'Special bulbs go to e-waste.',
    'cfl-bulb',
    '#fff59d',
  ),

  // Mixed — one tap, combo answer
  {
    id: 'pizza-box-with-slice',
    name: 'Pizza box with a slice left',
    kind: 'mixed',
    icon: 'pizza-box-slice',
    accent: '#c0392b',
    explanation:
      'Food goes to compost. The greasy box goes to trash — not recycling.',
    trueBins: ['compost', 'landfill'],
    parts: [
      { label: 'Pizza slice', trueBin: 'compost', material: 'organic' },
      { label: 'Greasy box', trueBin: 'landfill', material: 'cardboard' },
    ],
    // Always ≥2 combo choices so the correct mix isn't the only multi-bin button
    options: [
      ['compost', 'landfill'],
      ['compost', 'recycle'],
      ['recycle', 'landfill'],
      ['recycle'],
    ],
  },
  {
    id: 'lunch-tray',
    name: 'Lunch tray with leftovers',
    kind: 'mixed',
    icon: 'lunch-tray',
    accent: '#16a085',
    explanation: 'Food → compost. Plastic tray → trash.',
    trueBins: ['compost', 'landfill'],
    parts: [
      { label: 'Leftover veggies', trueBin: 'compost', material: 'organic' },
      { label: 'Plastic tray', trueBin: 'landfill', material: 'plastic' },
    ],
    options: [
      ['compost', 'landfill'],
      ['compost', 'recycle'],
      ['recycle', 'landfill'],
      ['landfill'],
    ],
  },
  {
    id: 'jar-with-sauce',
    name: 'Jar with leftover pasta sauce',
    kind: 'mixed',
    icon: 'jar-sauce',
    accent: '#8e4410',
    explanation: 'Scrape food to compost, then the clean jar goes to recycling.',
    trueBins: ['compost', 'recycle'],
    parts: [
      { label: 'Sauce / noodles', trueBin: 'compost', material: 'organic' },
      { label: 'Glass jar', trueBin: 'recycle', material: 'glass' },
    ],
    options: [
      ['compost', 'recycle'],
      ['compost', 'landfill'],
      ['recycle', 'landfill'],
      ['recycle'],
    ],
  },
  {
    id: 'takeout-bag',
    name: 'Takeout with fries and napkin',
    kind: 'mixed',
    icon: 'takeout-bag',
    accent: '#d35400',
    explanation: 'Food and soiled napkin → compost. Greasy plastic → trash.',
    trueBins: ['compost', 'landfill'],
    parts: [
      { label: 'Fries + napkin', trueBin: 'compost', material: 'organic' },
      { label: 'Plastic container', trueBin: 'landfill', material: 'plastic' },
    ],
    options: [
      ['compost', 'landfill'],
      ['recycle', 'compost'],
      ['recycle', 'landfill'],
      ['landfill'],
    ],
  },
  {
    id: 'gift-box',
    name: 'Gift wrap with plastic bow',
    kind: 'mixed',
    icon: 'gift-box',
    accent: '#8e44ad',
    explanation: 'Plain paper wrap → recycling. Plastic bow → trash.',
    trueBins: ['recycle', 'landfill'],
    parts: [
      { label: 'Wrapping paper', trueBin: 'recycle', material: 'paper' },
      { label: 'Plastic bow', trueBin: 'landfill', material: 'plastic' },
    ],
    options: [
      ['recycle', 'landfill'],
      ['compost', 'recycle'],
      ['compost', 'landfill'],
      ['recycle'],
    ],
  },
  {
    id: 'desk-cleanout',
    name: 'Broken toy with batteries',
    kind: 'mixed',
    icon: 'toy-batteries',
    accent: '#2980b9',
    explanation: 'Batteries → e-waste. Broken plastic toy → trash.',
    trueBins: ['ewaste', 'landfill'],
    parts: [
      { label: 'Batteries', trueBin: 'ewaste', material: 'electronics' },
      { label: 'Plastic toy', trueBin: 'landfill', material: 'plastic' },
    ],
    options: [
      ['ewaste', 'landfill'],
      ['ewaste', 'recycle'],
      ['recycle', 'landfill'],
      ['landfill'],
    ],
  },
  {
    id: 'picnic-plate',
    name: 'Paper plate with apple core',
    kind: 'mixed',
    icon: 'picnic-plate',
    accent: '#27ae60',
    explanation: 'Apple core → compost. Used paper plate → trash.',
    trueBins: ['compost', 'landfill'],
    parts: [
      { label: 'Apple core', trueBin: 'compost', material: 'organic' },
      { label: 'Paper plate', trueBin: 'landfill', material: 'paper' },
    ],
    options: [
      ['compost', 'landfill'],
      ['compost', 'recycle'],
      ['recycle', 'landfill'],
      ['compost'],
    ],
  },
  {
    id: 'yogurt-with-foil',
    name: 'Yogurt cup with foil lid',
    kind: 'mixed',
    icon: 'yogurt-foil',
    accent: '#f7c948',
    explanation: 'Clean foil lid and rinsed cup both go to recycling.',
    trueBins: ['recycle'],
    parts: [
      { label: 'Foil lid', trueBin: 'recycle', material: 'metal' },
      { label: 'Yogurt cup', trueBin: 'recycle', material: 'plastic' },
    ],
    options: [
      ['recycle'],
      ['recycle', 'landfill'],
      ['compost', 'recycle'],
      ['compost', 'landfill'],
    ],
  },
]

export function getItemById(id: string): WasteItem | undefined {
  return WASTE_ITEMS.find((item) => item.id === id)
}

export function itemMaterial(item: WasteItem): WasteItem['parts'][0]['material'] {
  if (item.kind === 'mixed') return 'composite'
  return item.parts[0]?.material ?? 'other'
}
