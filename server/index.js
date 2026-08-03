import express from 'express'
import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cellKey } from '../shared/grid.js'
import { ASSET_DIR, generateCell, requireToken } from './generate.js'

requireToken()

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// The directory listing is the manifest. Deriving it means the batch script and
// the server can both write images without racing over a shared JSON file.
const readManifest = async () => {
  const files = await readdir(ASSET_DIR).catch(() => [])
  return Object.fromEntries(
    files
      .filter((f) => f.endsWith('.webp'))
      .map((f) => [f.replace(/\.webp$/, ''), { image: `/api/assets/${f}`, generated: true }]),
  )
}

const inFlight = new Map()

async function generate(subject, style) {
  const { url, creditsRemaining } = await generateCell(subject, style)
  console.log(`generated ${url} — ${creditsRemaining} credits left`)
  return url
}

const app = express()
app.use(express.json())
app.use('/api/assets', express.static(ASSET_DIR, { immutable: true, maxAge: '1y' }))

app.get('/api/manifest', async (_req, res) => {
  res.json(await readManifest())
})

app.post('/api/generate', async (req, res) => {
  const { subject, style } = req.body ?? {}
  const key = cellKey(subject, style)

  if (!inFlight.has(key)) {
    inFlight.set(
      key,
      generate(subject, style).finally(() => inFlight.delete(key)),
    )
  }

  try {
    res.json({ image: await inFlight.get(key) })
  } catch (err) {
    console.error(`generate ${key} failed:`, err.message)
    res.status(err.status ?? 500).json({ error: err.message })
  }
})

if (existsSync(join(root, 'dist'))) {
  app.use(express.static(join(root, 'dist')))
}

const port = process.env.REVE_SERVER_PORT ?? 8787
app.listen(port, () => console.log(`reve backend on http://localhost:${port}`))
