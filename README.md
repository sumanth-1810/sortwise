# SortWise

A child-friendly **waste sorting game**. Players sort single items and mixed waste into the right bins (or combos), with levels that get harder based on performance.

## Features

- **Singles & mixed waste** — one tap answers; mixed items use combo choices (e.g. Compost + Trash)
- **Real item photos** + **icon + text** answer buttons
- **Levels 1–5** — Level 1 starts at **20 seconds** per item; time drops and decks get harder as you level up
- **Adaptive difficulty** — logistic regression predicts what you’re likely to miss and shapes the next round
- **Scan** — point the camera at one item and get a single bin (Recycling, Compost, Trash, or E-waste). Scan is not a quiz: no timer, no score, and it does not change your level


## Level timers

| Level | Seconds per item |
|-------|------------------|
| 1 | 20 |
| 2 | 16 |
| 3 | 13 |
| 4 | 10 |
| 5 | 8 |

Progression: **≥75%** accuracy → level up · **≤40%** → level down · otherwise stay.

## Scan

On the home screen, **Scan item** opens the camera. **Check item** snaps one frame and names one bin.

The quiz and Scan are separate. Quiz answers come from labeled cards. Scan answers come from a small image model running in the browser.

### Where the model was trained

The model was trained **locally on this Mac**, not on GitHub and not in the cloud. A Python script downloaded a sample of public photos, trained a Keras MobileNetV2, and converted the weights to ONNX. GitHub Pages only hosts the finished file.

| Piece | Where it is |
|---|---|
| Training photos | Local folder `/tmp/sortwise-scan-data` (400 images per bin). Not in the git repo. |
| Training script and Keras weights | `/tmp/train_sortwise_scan.py` and `/tmp/sortwise-scan.keras`. Not in the git repo. |
| Shipped model | `public/model/scan.onnx` and `public/model/labels.json` |
| Live files | [scan.onnx](https://sumanth-1810.github.io/sortwise/model/scan.onnx) · [labels.json](https://sumanth-1810.github.io/sortwise/model/labels.json) |
| Browser code | `src/components/Scan.tsx` (ONNX Runtime Web) |

The photos came from the Hugging Face dataset [steveharianto/waste-garbage-management-dataset](https://huggingface.co/datasets/steveharianto/waste-garbage-management-dataset), grouped into four bins:

| Bin | Source folders |
|---|---|
| Recycling | paper, cardboard, metal, plastic, glass |
| Compost | biological |
| E-waste | battery |
| Trash | trash, clothes, shoes |

That set is why Scan often says Recycling or Trash. E-waste was only batteries, and Compost was only one food-scrap folder, so earbuds, produce, and cups were not really in the training photos.

## Future scope

- Train on a **better dataset**: handheld photos of the items people actually point at (earbuds, phones, cables, peels, produce, dirty cups, wrappers, bottles, cans, paper), with the object filling the frame.
- Train a **better model** than a frozen MobileNetV2 head, so Scan is less likely to collapse onto Recycling and Trash.

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
  components/   # Home, Play, Results, Scan, ItemArt, BinGlyph
  data/         # Waste item bank + bin rules
  game/         # Scoring + level configs
  ml/           # Features, logistic regression, adaptive rounds, storage
public/items/   # Quiz item photos
public/model/   # Scan ONNX model + class labels
```

## Tech

- React + TypeScript + Vite
- Client-side ML (logistic regression) + `localStorage` for history/level
- Scan: ONNX Runtime Web, model trained locally with TensorFlow Keras (MobileNetV2)

## License

Private / educational project unless otherwise noted.
