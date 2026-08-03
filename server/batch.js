// Fills every empty cell in the 16x8 grid. Skips cells already on disk, so it
// is safe to re-run after a failure or interruption.
//
//   npm run generate:all
//
// Each generation costs 150 credits; a full 128-cell run costs ~19,200.

import { readdir } from 'node:fs/promises'
import { SUBJECTS, STYLES, cellKey } from '../shared/grid.js'
import { ASSET_DIR, generateCell, requireToken } from './generate.js'

requireToken()

const CONCURRENCY = 3
const MAX_ATTEMPTS = 3

const existing = new Set(
  (await readdir(ASSET_DIR).catch(() => []))
    .filter((f) => f.endsWith('.webp'))
    .map((f) => f.replace(/\.webp$/, '')),
)

const queue = []
for (const subject of SUBJECTS) {
  for (const style of STYLES) {
    if (!existing.has(cellKey(subject.id, style.id))) queue.push([subject.id, style.id])
  }
}

const total = SUBJECTS.length * STYLES.length
console.log(`${existing.size}/${total} cached — generating ${queue.length} (~${queue.length * 150} credits)`)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const todo = queue.length
let done = 0
const failed = []

async function worker() {
  for (;;) {
    const job = queue.shift()
    if (!job) return
    const [subject, style] = job
    const key = cellKey(subject, style)

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const { creditsRemaining } = await generateCell(subject, style)
        done++
        console.log(`[${done}/${todo}] ${key} — ${creditsRemaining} credits left`)
        break
      } catch (err) {
        // 429 tells us how long to wait; other 5xx get a plain backoff.
        const retryable = err.status === 429 || err.status >= 500
        if (!retryable || attempt === MAX_ATTEMPTS) {
          failed.push({ key, error: err.message })
          console.error(`FAILED ${key}: ${err.message}`)
          break
        }
        const wait = (err.retryAfter ?? 2 ** attempt) * 1000
        console.warn(`retry ${key} in ${wait}ms (${err.status})`)
        await sleep(wait)
      }
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker))

console.log(`\ndone: ${done} generated, ${failed.length} failed`)
if (failed.length) {
  for (const f of failed) console.log(`  ${f.key}: ${f.error}`)
  console.log('Re-run to retry the failures — cached cells are skipped.')
  process.exit(1)
}
