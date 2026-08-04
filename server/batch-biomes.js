// Pre-generates the five biome backdrop plates into public/biomes/.
// Run once; the results are committed and shipped as static assets.
//
//   npm run biomes

import { readdir } from 'node:fs/promises'
import { BIOMES } from '../shared/biomes.js'
import { BIOME_DIR, generateBiome, requireToken } from './reve.js'

requireToken()

const existing = new Set(
  (await readdir(BIOME_DIR).catch(() => []))
    .filter((f) => f.endsWith('.webp'))
    .map((f) => f.replace(/\.webp$/, '')),
)

const queue = BIOMES.filter((b) => !existing.has(b.id))
console.log(
  `${BIOMES.length - queue.length}/${BIOMES.length} cached — ` +
    `generating ${queue.length} (~${queue.length * 150} credits)`,
)

const failed = []
let done = 0

// Sequential: only five, and it keeps the log readable.
for (const biome of queue) {
  try {
    const { creditsRemaining } = await generateBiome(biome)
    done++
    console.log(`[${done}/${queue.length}] ${biome.id} — ${creditsRemaining} credits left`)
  } catch (err) {
    failed.push({ id: biome.id, error: err.message })
    console.error(`FAILED ${biome.id}: ${err.message}`)
  }
}

console.log(`\ndone: ${done} generated, ${failed.length} failed`)
if (failed.length) process.exit(1)
