import type { Placed } from './types'

export const CANVAS_W = 954
export const CANVAS_H = 431

/* Reve is asked for 2:1 (the closest supported ratio to the 954x431 canvas),
   so the reference is rendered at 2:1 with the composition centred. Sending a
   reference whose shape matches the request keeps the layout from being
   squashed to fit. */
const OUT_W = 1908
const OUT_H = 954

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Could not load ${src}`))
    img.src = src
  })

/**
 * Renders every placed sticker at its real position, size, and rotation onto a
 * white canvas. This flattened image is what gets sent to Reve as the layout
 * guide — far more reliable than describing coordinates in words.
 */
export async function flattenCanvas(placed: Placed[]): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = OUT_W
  canvas.height = OUT_H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D unavailable')

  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, OUT_W, OUT_H)

  const scale = OUT_W / CANVAS_W
  const yOffset = (OUT_H - CANVAS_H * scale) / 2

  const images = await Promise.all(placed.map((p) => loadImage(p.src)))

  placed.forEach((p, i) => {
    const cx = (p.x + p.w / 2) * scale
    const cy = (p.y + p.h / 2) * scale + yOffset

    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate((p.rot * Math.PI) / 180)
    ctx.drawImage(images[i], (-p.w / 2) * scale, (-p.h / 2) * scale, p.w * scale, p.h * scale)
    ctx.restore()
  })

  // Strip the data: prefix — the API wants raw base64.
  return canvas.toDataURL('image/png').split(',')[1]
}
