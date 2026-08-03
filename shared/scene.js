// The "ultimate generation" — Reve repaints the whole arrangement as one scene.

export const SCENE_STYLES = [
  {
    id: 'photorealistic',
    label: 'Photorealistic',
    name: 'photorealistic',
    block:
      'Photorealistic rendering, natural outdoor lighting, real depth of field, ' +
      'fine organic textures, cinematic color grading.',
  },
  {
    id: 'storybook',
    label: 'Storybook illustration',
    name: 'storybook illustration',
    block:
      'Storybook illustration style, soft painterly textures, warm inviting color ' +
      'palette, gentle confident linework, whimsical children’s-book atmosphere.',
  },
  {
    id: 'minimal-ad',
    label: 'Minimal advertisement',
    name: 'minimal advertisement',
    block:
      'Minimal advertisement style, clean simplified background, generous negative ' +
      'space, bold simple shapes, polished commercial product-photography lighting.',
  },
]

/**
 * The flattened canvas is sent as reference frame 1, so the prompt only has to
 * describe intent — never coordinates. Spatial language is unreliable; the
 * reference image carries the layout.
 */
export function buildScenePrompt(styleId, stickerNames, { continuing = false } = {}) {
  const style = SCENE_STYLES.find((s) => s.id === styleId)
  if (!style) return null

  /* Continuing rounds hand Reve an already-painted scene with fresh stickers
     laid on top, so the instruction is to absorb the new elements rather than
     to repaint everything from a flat sticker collage. */
  if (continuing) {
    return (
      `<frame1> shows an already-painted ${style.name} scene with new flat ` +
      `sticker cut-outs placed on top of it: ${stickerNames.join(', ')}. Keep ` +
      `the existing painted scene essentially as it is, and repaint only the ` +
      `newly added elements so they belong naturally inside it — matching its ` +
      `lighting, perspective, scale, and texture, and casting appropriate ` +
      `shadows. Keep each new element at the position and size shown. Nothing ` +
      `in the final image should look like a flat sticker pasted on top. ` +
      `${style.block} No text, no watermark.`
    )
  }

  return (
    `Using the composition shown in <frame1> as the layout guide, create one ` +
    `cohesive, unified ${style.name} scene that naturally brings together ` +
    `everything shown: ${stickerNames.join(', ')}. Keep the relative placement, ` +
    `scale, and arrangement of each element close to the reference, but fully ` +
    `repaint everything into one atmospheric, connected scene — do not leave the ` +
    `elements looking like separate flat stickers pasted on top of each other. ` +
    `${style.block} No text, no watermark.`
  )
}
