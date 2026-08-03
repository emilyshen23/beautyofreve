import express from 'express'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { buildPrompt, cellKey } from '../shared/grid.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const MANIFEST = join(root, 'data', 'manifest.json')
// Served by Express, not Vite: Vite's dev server only indexes public/ at
// startup, so images written mid-session would 404 until a restart.
const ASSET_DIR = join(root, 'generated')
const REVE_URL = 'https://api.reve.com/v2/image/create'

const token = process.env.REVE_API_TOKEN
if (!token) {
  console.error('Missing REVE_API_TOKEN. Copy .env.example to .env and add your key.')
  process.exit(1)
}

const readManifest = async () => {
  try {
    return JSON.parse(await readFile(MANIFEST, 'utf8'))
  } catch {
    return {}
  }
}

const inFlight = new Map()

async function generate(subject, style) {
  const prompt = buildPrompt(subject, style)
  if (!prompt) throw Object.assign(new Error('Unknown subject or style'), { status: 400 })

  const res = await fetch(REVE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, aspect_ratio: '1:1' }),
  })

  if (!res.ok) {
    const detail = await res.text()
    throw Object.assign(new Error(detail.slice(0, 500)), { status: res.status })
  }

  // Reve returns either JSON with a base64 image field or raw image bytes.
  const body = await res.json()
  if (body.content_violation) {
    throw Object.assign(new Error('Content policy violation'), { status: 422 })
  }
  if (!body.image) throw Object.assign(new Error('No image in Reve response'), { status: 502 })

  // Reve returns a 4096px PNG (~2.5MB); the grid only ever shows it small.
  const webp = await sharp(Buffer.from(body.image, 'base64'))
    .resize(1024, 1024)
    .webp({ quality: 82 })
    .toBuffer()

  const file = `${cellKey(subject, style)}.webp`
  await mkdir(ASSET_DIR, { recursive: true })
  await writeFile(join(ASSET_DIR, file), webp)

  const manifest = await readManifest()
  manifest[cellKey(subject, style)] = { image: `/api/assets/${file}`, generated: true }
  await mkdir(dirname(MANIFEST), { recursive: true })
  await writeFile(MANIFEST, JSON.stringify(manifest, null, 2))

  console.log(`generated ${file} — ${body.credits_remaining} credits left`)
  return `/api/assets/${file}`
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
