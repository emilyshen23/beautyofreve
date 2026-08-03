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
  const name = String(req.body?.name ?? '').trim()
  if (!name) return res.status(400).json({ error: 'Name required' })

  try {
    // Custom stickers aren't constrained to nature, but wear the same treatment.
    const id = `${slugify(name)}-${Date.now().toString(36)}`
    await generateSticker(name, { nature: false, dir: CUSTOM_DIR, id })
    console.log(`minted sticker ${id}`)
    res.json({ sticker: { id, name, src: `/api/assets/${id}.webp`, custom: true } })
  } catch (err) {
    console.error('mint failed:', err.message)
    res.status(err.status ?? 500).json({ error: err.message })
  }
})

app.post('/api/craft', async (req, res) => {
  const { styleId, reference, names } = req.body ?? {}
  const prompt = buildScenePrompt(styleId, names ?? [])

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

const port = process.env.REVE_SERVER_PORT ?? 8787
app.listen(port, () => console.log(`reve backend on http://localhost:${port}`))
