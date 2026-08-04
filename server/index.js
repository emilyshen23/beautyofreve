import express from 'express'
import { existsSync } from 'node:fs'
import { readdir, mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { STICKERS, slugify } from '../shared/stickers.js'
import { buildScenePrompt } from '../shared/scene.js'
import {
  CUSTOM_DIR,
  SCENE_DIR,
  STICKER_DIR,
  callReve,
  generateSticker,
  requireToken,
} from './reve.js'

requireToken()

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

/* Every generation spends 150 credits, and a public URL means anyone can
   press Craft. This caps what a single caller can burn. Set
   RATE_LIMIT_PER_HOUR=0 to disable it for local use. */
const RATE_LIMIT = Number(process.env.RATE_LIMIT_PER_HOUR ?? 12)
const WINDOW_MS = 60 * 60 * 1000
const hits = new Map()

function overLimit(req) {
  if (!RATE_LIMIT) return false
  const ip = String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim() || req.ip
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)

  if (recent.length >= RATE_LIMIT) {
    hits.set(ip, recent)
    return true
  }
  recent.push(now)
  hits.set(ip, recent)
  return false
}

const app = express()
// The flattened canvas reference arrives as base64 and runs a few MB.
app.use(express.json({ limit: '25mb' }))
app.use('/api/assets', express.static(CUSTOM_DIR, { immutable: true, maxAge: '1y' }))
app.use('/api/scenes', express.static(SCENE_DIR, { immutable: true, maxAge: '1y' }))

/* Which of the 68 actually made it to disk. A sticker missing its file is
   omitted rather than rendered as a broken image. */
const onDisk = async (dir) =>
  new Set(
    (await readdir(dir).catch(() => []))
      .filter((f) => f.endsWith('.webp'))
      .map((f) => f.replace(/\.webp$/, '')),
  )

app.get('/api/stickers', async (_req, res) => {
  const [builtIn, customFiles] = await Promise.all([onDisk(STICKER_DIR), onDisk(CUSTOM_DIR)])

  res.json({
    stickers: STICKERS.filter((s) => builtIn.has(s.id)).map((s) => ({
      ...s,
      src: `/stickers/${s.id}.webp`,
    })),
    custom: [...customFiles].map((id) => ({
      id,
      name: id.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase()),
      src: `/api/assets/${id}.webp`,
      custom: true,
    })),
  })
})

app.post('/api/stickers/custom', async (req, res) => {
  if (overLimit(req)) return res.status(429).json({ error: 'Hourly limit reached — try again later' })

  const name = String(req.body?.name ?? '').trim()
  if (!name) return res.status(400).json({ error: 'Name required' })

  try {
    // Custom characters aren't constrained to nature, but wear the same treatment.
    const id = `${slugify(name)}-${Date.now().toString(36)}`
    await generateSticker(name, { kind: 'custom', dir: CUSTOM_DIR, id })
    console.log(`minted sticker ${id}`)
    res.json({ sticker: { id, name, src: `/api/assets/${id}.webp`, custom: true } })
  } catch (err) {
    console.error('mint failed:', err.message)
    res.status(err.status ?? 500).json({ error: err.message })
  }
})

app.post('/api/craft', async (req, res) => {
  // Checked first, so probing with malformed bodies can't sidestep the cap.
  if (overLimit(req)) return res.status(429).json({ error: 'Hourly limit reached — try again later' })

  const { styleId, reference, names, mode, setting } = req.body ?? {}
  const prompt = buildScenePrompt(styleId, names ?? [], { mode, setting })

  if (!prompt) return res.status(400).json({ error: 'Unknown style' })
  if (!reference) return res.status(400).json({ error: 'Missing canvas reference' })

  try {
    const { buffer, creditsRemaining } = await callReve({
      prompt,
      // Closest supported ratio to the 954x431 canvas.
      aspectRatio: '2:1',
      references: [{ data: reference }],
    })

    const webp = await sharp(buffer).resize(1908, 954).webp({ quality: 88 }).toBuffer()
    const file = `scene-${Date.now().toString(36)}.webp`
    await mkdir(SCENE_DIR, { recursive: true })
    await writeFile(join(SCENE_DIR, file), webp)

    console.log(`crafted ${file} — ${creditsRemaining} credits left`)
    res.json({ image: `/api/scenes/${file}` })
  } catch (err) {
    console.error('craft failed:', err.message)
    res.status(err.status ?? 500).json({ error: err.message })
  }
})

if (existsSync(join(root, 'dist'))) {
  app.use(express.static(join(root, 'dist')))
}

/* REVE_SERVER_PORT wins so dev can pin 8787: some dev tooling exports PORT
   for the front end, and the API must not land on Vite's port. Hosts
   (Render, Railway, Fly) set only PORT. */
const port = process.env.REVE_SERVER_PORT ?? process.env.PORT ?? 8787
app.listen(port, () => console.log(`reve backend listening on ${port}`))
