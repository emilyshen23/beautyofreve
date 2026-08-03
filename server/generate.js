import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { buildPrompt, cellKey } from '../shared/grid.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// Served by Express, not Vite: Vite's dev server only indexes public/ at
// startup, so images written mid-session would 404 until a restart.
export const ASSET_DIR = join(root, 'generated')

const REVE_URL = 'https://api.reve.com/v2/image/create'

export function requireToken() {
  const token = process.env.REVE_API_TOKEN
  if (!token) {
    console.error('Missing REVE_API_TOKEN. Copy .env.example to .env and add your key.')
    process.exit(1)
  }
  return token
}

/** Generates one cell, writes it to ASSET_DIR, returns its public URL. */
export async function generateCell(subject, style) {
  const prompt = buildPrompt(subject, style)
  if (!prompt) throw Object.assign(new Error('Unknown subject or style'), { status: 400 })

  const res = await fetch(REVE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${requireToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, aspect_ratio: '1:1' }),
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

  // Reve returns a 4096px PNG (~2.5MB); the grid only ever shows it small.
  const webp = await sharp(Buffer.from(body.image, 'base64'))
    .resize(1024, 1024)
    .webp({ quality: 82 })
    .toBuffer()

  const file = `${cellKey(subject, style)}.webp`
  await mkdir(ASSET_DIR, { recursive: true })
  await writeFile(join(ASSET_DIR, file), webp)

  return { url: `/api/assets/${file}`, creditsRemaining: body.credits_remaining }
}
