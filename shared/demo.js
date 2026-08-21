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
// What must match: the backdrop, day-vs-night, and the exact set of characters.
// Adding a character not in the list, or leaving one out, falls through to the
// real API — a wrong scene appearing would be worse than a slow one.

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
 * Returns the demo scene this arrangement reproduces, or null.
 * @param {Array<{ stickerId: string }>} placed
 * @param {{ biomeId?: string | null, night?: boolean }} setting
 */
export function matchDemo(placed, { biomeId, night = false } = {}) {
  if (!biomeId || !placed?.length) return null
  const cast = castOf(placed)
  if (!cast.size) return null

  return (
    DEMO_SCENES.find(
      (d) =>
        d.biomeId === biomeId &&
        d.night === Boolean(night) &&
        sameCast(cast, new Set(d.cast)),
    ) ?? null
  )
}
