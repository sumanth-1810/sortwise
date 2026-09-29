# SortWise

A kid-friendly **waste sorting game** with a Minecraft-inspired UI. Players sort single items and mixed waste into the right bins (or combos), with levels that get harder based on performance.

## Features

- **Singles & mixed waste** — one tap answers; mixed items use combo choices (e.g. Compost + Trash)
- **Real item photos** + **icon + text** answer buttons
- **Levels 1–5** — Level 1 starts at **20 seconds** per item; time drops and decks get harder as you level up
- **Adaptive difficulty** — logistic regression predicts what you’re likely to miss and shapes the next round
- **Minecraft-style UI** — pixel fonts, beveled panels, inventory-like buttons

## Level timers

| Level | Seconds per item |
|-------|------------------|
| 1 | 20 |
| 2 | 16 |
| 3 | 13 |
| 4 | 10 |
| 5 | 8 |

Progression: **≥75%** accuracy → level up · **≤40%** → level down · otherwise stay.

## Live demo

https://sumanth-1810.github.io/sortwise/

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173/sortwise/](http://localhost:5173/sortwise/) (dev uses the same `/sortwise/` base as GitHub Pages).

```bash
npm run build    # production build
npm run preview  # preview production build
```

## Deploy

Pushes to `main` deploy automatically via GitHub Actions → GitHub Pages (workflow in `.github/workflows/deploy.yml`).

## Project structure

```
src/
  components/   # Home, Play, Results, ItemArt, BinGlyph
  data/         # Waste item bank + bin rules
  game/         # Scoring + level configs
  ml/           # Features, logistic regression, adaptive rounds, storage
public/items/   # Item photos
```

## Tech

- React + TypeScript + Vite
- Client-side ML (logistic regression) + `localStorage` for history/level

## License

Private / educational project unless otherwise noted.
