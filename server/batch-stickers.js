// Pre-generates the 68 built-in nature stickers into public/stickers/.
// Run once; the results are committed and shipped as static assets.
//
//   npm run stickers
//
// Skips anything already on disk, so it is safe to re-run after a failure.

import { readdir } from 'node:fs/promises'
import { STICKERS } from '../shared/stickers.js'
import { STICKER_DIR, generateSticker, requireToken } from './reve.js'

requireToken()

const CONCURRENCY = 3
const MAX_ATTEMPTS = 3

const existing = new Set(
  (await readdir(STICKER_DIR).catch(() => []))
    .filter((f) => f.endsWith('.webp'))
    .map((f) => f.replace(/\.webp$/, '')),
)

const queue = STICKERS.filter((s) => !existing.has(s.id))
const todo = queue.length
// Counts roster members only — the directory can also hold stickers left
// behind by an earlier roster, which are not "cached" for this run.
const cached = STICKERS.length - todo
console.log(
  `${cached}/${STICKERS.length} cached — generating ${todo} (~${todo * 150} credits)`,
)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let done = 0
const failed = []

async function worker() {
  for (;;) {
    const sticker = queue.shift()
    if (!sticker) return

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const { creditsRemaining } = await generateSticker(sticker.name, {
          dir: STICKER_DIR,
          id: sticker.id,
        })
        done++
        console.log(`[${done}/${todo}] ${sticker.id} — ${creditsRemaining} credits left`)
        break
      } catch (err) {
        const retryable = err.status === 429 || err.status >= 500
        if (!retryable || attempt === MAX_ATTEMPTS) {
          failed.push({ id: sticker.id, error: err.message })
          console.error(`FAILED ${sticker.id}: ${err.message}`)
          break
        }
        const wait = (err.retryAfter ?? 2 ** attempt) * 1000
        console.warn(`retry ${sticker.id} in ${wait}ms (${err.status})`)
        await sleep(wait)
      }
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker))

console.log(`\ndone: ${done} generated, ${failed.length} failed`)
if (failed.length) {
  for (const f of failed) console.log(`  ${f.id}: ${f.error}`)
  console.log('Re-run to retry the failures — cached stickers are skipped.')
  process.exit(1)
}
