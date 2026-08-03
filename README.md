# beautyofreve

A 16 × 8 grid proving Reve's range across subject matter and visual style.
Sweeping across cells leaves a trail of images that hold, then fade.

- **Columns (16)** — subject matter
- **Rows (8)** — visual style
- **128 cells**, each keyed by `(subject, style)`

## Setup

```bash
npm install
cp .env.example .env   # add your Reve API token
npm run dev
```

Frontend on `http://localhost:5176`, API backend on `:8787`.

To fill every empty cell in one go (~150 credits each, skips what's cached):

```bash
npm run generate:all
```

## Interaction

Hovering a cell snaps its image in at 90ms. On leave it holds for 450ms and
then fades over 650ms, so moving across the grid leaves a cascade rather than
a single reveal. Clicking a cell generates a fresh image for it.

## Architecture

The Reve API key never reaches the browser. The React app calls
`POST /api/generate` with a `(subject, style)` pair; the Express server in
`server/` builds the prompt, calls Reve, and returns an image URL.

Generated images are downscaled to 1024px WebP (Reve returns 4096px PNGs at
~2.5MB) and written to `generated/`. A cell is only ever generated once —
every later visit serves the cached file.

Two things worth knowing before changing this:

- **Assets are served by Express at `/api/assets/*`, not from Vite's
  `public/`.** Vite only indexes `public/` at startup, so images written
  mid-session would 404 until a restart.
- **The directory listing *is* the manifest.** `GET /api/manifest` derives
  state from `readdir(generated/)` rather than a JSON file, so the batch
  script and the server can both write images without racing.

`shared/grid.js` holds the subjects, styles, and prompt template, and is the
single source of truth for both the client and the server.

## Fonts

The UI asks for **Forma DJR Deck**, resolved from the locally installed
family. No font files are bundled — the copies used in development are trial
cuts, which aren't licensed for web embedding or redistribution. To ship the
font on a deployed site, add licensed `.woff2` files under `src/fonts/` and
matching `@font-face` rules in `src/styles.css`.
