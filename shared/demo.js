// Pre-rendered scenes for demoing without the API.
//
// Each entry pairs a specific arrangement — a backdrop, a time of day and a
// cast — with the finished painting that arrangement produced when it was
// crafted for real. When a child (or a camera) reproduces one of these
// arrangements, Craft recognises it and shows the saved painting instead of
// calling Reve. Everything else still goes to the API as normal.
//
// Matching is deliberately forgiving, because nobody can re-place stickers
// pixel-for-pixel on camera:
//
//   - Position, size, rotation and z-order are all ignored.
//   - Duplicates are ignored — three butterflies or one both match `butterfly`.
//   - Magic stickers are ignored entirely, so the swirl is optional.
//   - The chosen style is ignored; `style` below only records which one the
//     saved painting was rendered in, so the demo can pre-select it.
//
// Craft never calls the API. It always resolves to one of these paintings,
// falling back by how closely the arrangement fits:
//
//   1. the exact cast, on the right backdrop at the right time of day
//   2. failing that, whatever is saved for this backdrop at this time of day
//   3. failing that, whatever is saved for this backdrop at all
//
// So the three arrangements below land on their own painting, and anything
// else placed on those three backdrops still gets a picture rather than an
// error. Backdrops with nothing saved resolve to null, and the button says so
// rather than revealing something unrelated.

import { STICKERS } from './stickers.js'

const MAGIC_IDS = new Set(STICKERS.filter((s) => s.magic).map((s) => s.id))

export const DEMO_SCENES = [
  {
    id: 'forest-night',
    biomeId: 'forest',
    night: true,
    cast: ['grouchy-rock-troll', 'deer', 'butterfly'],
    style: 'realistic',
    image: 'demo/forest-night.webp',
  },
  {
    id: 'reef',
    biomeId: 'reef',
    night: false,
    cast: ['dolphin', 'whale', 'narwhal'],
    style: 'watercolor',
    image: 'demo/reef.webp',
  },
  {
    id: 'desert',
    biomeId: 'desert',
    night: false,
    cast: ['flamingo', 'monkey', 'elephant', 'giraffe'],
    style: 'fairytale',
    image: 'demo/desert.webp',
  },
]

const sameCast = (a, b) => a.size === b.size && [...a].every((id) => b.has(id))

/**
 * The arrangement currently on the canvas, as a set of character ids.
 * @param {Array<{ stickerId: string }>} placed
 */
const castOf = (placed) =>
  new Set(placed.map((p) => p.stickerId).filter((id) => !MAGIC_IDS.has(id)))

/**
 * The painting this arrangement should resolve to, or null if nothing is
 * saved for this backdrop. See the fallback order at the top of the file.
 * @param {Array<{ stickerId: string }>} placed
 * @param {{ biomeId?: string | null, night?: boolean }} setting
 */
export function matchDemo(placed, { biomeId, night = false } = {}) {
  if (!biomeId) return null

  const here = DEMO_SCENES.filter((d) => d.biomeId === biomeId)
  if (!here.length) return null

  const cast = castOf(placed ?? [])
  const atThisHour = here.filter((d) => d.night === Boolean(night))

  return (
    atThisHour.find((d) => sameCast(cast, new Set(d.cast))) ??
    atThisHour[0] ??
    here[0]
  )
}

/* The same idea for "Dream up a new character": one saved sticker, keyed on
   what the child types. Anything that mentions a turtle gets the wise old
   turtle back; anything else still goes to the API to be drawn for real. */
export const DEMO_CHARACTERS = [
  {
    id: 'wise-turtle',
    name: 'Wise smiling turtle',
    keywords: ['turtle'],
    image: 'demo/wise-turtle.webp',
  },
]

/**
 * The saved sticker this description asks for, or null.
 * @param {string} text
 */
export function matchDemoCharacter(text) {
  const words = String(text ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ')
  if (!words.trim()) return null

  return DEMO_CHARACTERS.find((c) => c.keywords.every((k) => words.includes(k))) ?? null
}
