# beautyofreve — Nature Sticker Craft

A drag-and-drop sticker collage tool. Pick from 78 pre-generated stickers (or
make your own characters), arrange them freely on a canvas, then Reve
reinterprets the whole arrangement as one cohesive scene in the style you pick.

The sheet is 68 animal characters — the sort a child would put in a storybook —
plus 12 "magic" effects (fireflies, sunbeams, drifting dandelion seeds). The
magic stickers sit in the right-hand columns, marked by the same gradient the
canvas shows while a scene is generating.

Six characters are flagged `mood: 'mischievous'` — a grumpy storm cloud, a sly
shadow crow and friends, drawn in a cooler, darker palette with exaggerated
grumpy expressions. They're scattered through the ordinary cast rather than
grouped, so a child discovers them while browsing instead of finding a
"villains" shelf. The flag drives no UI; the difference lives in the artwork.

Two deploys:

- **GitHub Pages** — https://emilyshen23.github.io/beautyofreve/ — static only.
  The sheet and canvas work; Craft and custom stickers don't, because there's
  no server there.
- **Render** — the full app, including Craft. See [Deploying](#deploying).

The metaphor is a craft table: stickers you cut, arrange, and hand off to be
repainted as a single image. The generate step isn't editing a photo — it's
Reve looking at a composition and painting something new from it.

## Setup

```bash
npm install
cp .env.example .env   # add your Reve API token
npm run dev
```

Frontend on `http://localhost:5176`, API backend on `:8787`.

## The canvas

Each placed sticker is an independent object:

- **Drag** from the sheet onto the canvas — lands with a short settle (1.08 → 1)
- **Click** to select — blue bounding box, four corner handles, rotate handle
- **Resize** from any corner, aspect-locked, growing about the centre
- **Rotate** from the handle above the box (hold <kbd>Shift</kbd> to snap to 15°)
- **Duplicate** with <kbd>Cmd</kbd>+<kbd>C</kbd> / <kbd>V</kbd>, offset 24px
- **Delete** with <kbd>Backspace</kbd>, deselect with <kbd>Esc</kbd>
- **Lock** from the badge that appears on hover — a locked sticker keeps its
  position and offers no handles until unlocked

Positions are stored in canvas design space (954 × 431), not screen pixels, so
an arrangement survives a window resize.

## Settings

Five nature backdrops — enchanted forest, flower meadow, snowy mountains,
coral reef, desert oasis — sit in a rail beside the canvas. Each is a static
plate generated once into `public/biomes/`:

```bash
npm run biomes
```

Picking one swaps it in behind the characters. It deliberately won't match
them: the plate is painted, the characters are flat die-cut cut-outs, and
nothing casts a shadow. That mismatch is expected — the plate is a stage, not
the show. **Bring it to life** is the step that fuses backdrop and cast into
one picture, and the compose prompt says so outright, asking for unified
lighting, contact shadows and corrected scale. In testing, an owl left
floating in mid-air came back perched on a branch.

## How Craft works

Rather than describing coordinates in words — which models follow unreliably —
the canvas is flattened client-side into a single image and sent to Reve as a
reference frame. The prompt then only has to describe *intent*; the reference
carries the layout. In testing this held placement closely: a sun dropped
upper-left came back as a sun upper-left.

Reve is asked for `2:1`, the closest supported ratio to the 954 × 431 canvas,
and the reference is rendered at 2:1 so the composition isn't squashed to fit.

A craft call takes roughly **60 seconds**.

**Crafting is iterative.** The result becomes the canvas backdrop and the
stickers clear, because they've been absorbed into the painting. Drop more
stickers on top and craft again: the flattened reference then carries the
finished scene *plus* the new cut-outs, and the prompt switches to asking Reve
to keep the existing painting and blend only the new elements into it.

The download button re-encodes the scene to PNG in the browser (scenes are
stored as WebP).

## Generating the stickers

The 80 built-ins are generated once and committed to `public/stickers/`:

```bash
npm run stickers
```

Skips anything already on disk, so it's safe to re-run after a failure. Each
generation costs 150 credits (~12,000 for a full run). Custom characters from the
**Your characters** tab are live calls, one per submission, cached in
`generated/custom/`.

Every sticker — built-in or custom — is generated with `remove_background` as a
safety net so the alpha channel is clean for compositing, then stored as 512px
WebP with transparency.

## Architecture

The Reve API key never reaches the browser. The React app calls the Express
server in `server/`, which builds prompts and talks to Reve.

- `GET  /api/stickers` — manifest, derived from what's actually on disk
- `POST /api/stickers/custom` — mint one custom sticker
- `POST /api/craft` — flattened canvas + style → one generated scene

`shared/stickers.js` and `shared/scene.js` hold the catalog, prompt templates,
and style blocks, and are the single source of truth for client and server.

Two things worth knowing before changing this:

- **Built-in stickers live in `public/stickers/` (served by Vite); anything
  written at runtime lives in `generated/` and is served by Express.** Vite
  only indexes `public/` at startup, so images written mid-session would 404
  until a restart.
- **The canvas sets `isolation: isolate`.** Placed stickers carry a `z-index`;
  without a stacking context they escape into the root and cover the style
  menu below the canvas.
- **The page renders at `zoom: 0.75`.** All pointer maths converts through
  `getBoundingClientRect()` against layout width, so it stays correct under
  zoom — don't swap in hard-coded pixel assumptions.

## Deploying

### Render (full app)

`render.yaml` is a blueprint, so Render configures everything from the repo:

1. Sign in to [render.com](https://render.com) with GitHub.
2. **New → Blueprint**, pick the `beautyofreve` repo.
3. Render reads `render.yaml` and prompts for `REVE_API_TOKEN` — paste the key
   there. It is stored as a secret and never committed (`sync: false`).
4. Deploy.

The key stays server-side; the browser only ever calls `/api/*`.

Two things about the free plan: the service sleeps after ~15 minutes idle, so
the first request afterwards takes roughly a minute; and the filesystem resets
on restart, so custom stickers and crafted scenes are not durable. Attach a
Render Disk (or swap `generated/` for object storage) if they need to persist.

### Protecting credits

A public URL means anyone can press Craft, and every generation spends 150
credits. `RATE_LIMIT_PER_HOUR` (default 12) caps generations per IP per hour,
counted before request validation so malformed probes can't sidestep it. Set
it to `0` to disable locally.

### GitHub Pages (front end only)

`.github/workflows/pages.yml` builds with `GITHUB_PAGES=1` (which sets the
`/beautyofreve/` base path) and publishes `dist` on every push to `main`. The
backend is never part of that build.

## Fonts

The UI asks for **Forma DJR Deck**, resolved from the locally installed family.
No font files are bundled — the copies used in development are trial cuts,
which aren't licensed for web embedding or redistribution. To ship the font on
a deployed site, add licensed `.woff2` files under `src/fonts/` and matching
`@font-face` rules in `src/styles.css`.

## Previous experiment

`shared/grid.js`, `server/batch.js`, and the 128 images in `generated/` are
from the earlier 16 × 8 style-range grid. Nothing in the current app uses them;
they're kept because the images were already generated. `npm run generate:all`
still runs that batch.
