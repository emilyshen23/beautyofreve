import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

/** The 68 built-in stickers: static, committed, served by Vite. */
export const STICKER_DIR = join(root, 'public', 'stickers')

/* Written at runtime, so served by Express rather than Vite — Vite only
   indexes public/ at startup and would 404 anything added mid-session. */
export const CUSTOM_DIR = join(root, 'generated', 'custom')
export const SCENE_DIR = join(root, 'generated', 'scenes')

const REVE_URL = 'https://api.reve.com/v2/image/create'

export function requireToken() {
  const token = process.env.REVE_API_TOKEN
  if (!token) {
    console.error('Missing REVE_API_TOKEN. Copy .env.example to .env and add your key.')
    process.exit(1)
  }
  return token
}

/** One raw Reve call. Returns the decoded image plus credit accounting. */
export async function callReve({ prompt, aspectRatio = '1:1', references, postprocessing }) {
  const res = await fetch(REVE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${requireToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      aspect_ratio: aspectRatio,
      ...(references ? { references } : {}),
      ...(postprocessing ? { postprocessing } : {}),
    }),
  })

  if (!res.ok) {
    const detail = await res.text()
    throw Object.assign(new Error(detail.slice(0, 300)), {
      status: res.status,
      retryAfter: Number(res.headers.get('retry-after')) || null,
    })
  }

  const body = await res.json()
  if (body.content_violation) {
    throw Object.assign(new Error('Content policy violation'), { status: 422 })
  }
  if (!body.image) throw Object.assign(new Error('No image in Reve response'), { status: 502 })

  return { buffer: Buffer.from(body.image, 'base64'), creditsRemaining: body.credits_remaining }
}

/* remove_background is a safety net: the prompt already asks for transparency,
   but this guarantees a clean alpha channel for compositing on the canvas. */
const CUTOUT = [{ process: 'remove_background' }]

/**
 * Generates one die-cut sticker. Reve returns a 4096px PNG (~2.5MB); stickers
 * never render larger than a few hundred px, so they're stored as 512px WebP
 * with the alpha channel preserved.
 */
export async function generateSticker(name, { nature = true, dir = CUSTOM_DIR, id } = {}) {
  const { stickerPrompt, slugify } = await import('../shared/stickers.js')
  const { buffer, creditsRemaining } = await callReve({
    prompt: stickerPrompt(name, { nature }),
    postprocessing: CUTOUT,
  })

  const webp = await sharp(buffer)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 90, alphaQuality: 100 })
    .toBuffer()

  const file = `${id ?? slugify(name)}.webp`
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, file), webp)

  return { file, creditsRemaining }
}
