# beautyofreve

A 16 × 8 grid proving Reve's range across subject matter and visual style.
Hover a cell to flicker in its image; click to fire a fresh generation.

- **Rows (16)** — subject matter
- **Columns (8)** — visual style
- **128 cells**, each keyed by `(subject, style)`

## Setup

```bash
npm install
cp .env.example .env   # add your Reve API token
npm run dev
```

Frontend on `http://localhost:5176`, API backend on `:8787`.

## Architecture

The Reve API key never reaches the browser. The React app calls
`POST /api/generate` with a `(subject, style)` pair; the Express server in
`server/` builds the prompt, calls Reve, and returns an image URL.

Generated images are downscaled to 1024px WebP (Reve returns 4096px PNGs at
~2.5MB) and written to `generated/`, with `data/manifest.json` tracking which
cells are populated. A cell is only ever generated once — every later visit
serves the cached file.

Assets are served by Express at `/api/assets/*` rather than from Vite's
`public/`, because Vite only indexes `public/` at startup and would 404 on
images created mid-session.

`shared/grid.js` holds the subjects, styles, and prompt template, and is the
single source of truth for both the client and the server.

## Cost

Each generation costs 150 credits.
