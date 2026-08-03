export const SUBJECTS = [
  { id: 'butterfly', label: 'Butterfly', block: 'A butterfly' },
  { id: 'tennis-racket', label: 'Tennis racket', block: 'A tennis racket' },
  { id: 'birthday-card', label: 'Birthday card', block: 'A birthday card' },
  { id: 'gradient-waves', label: 'Gradient waves', block: 'Gradient waves' },
  { id: 'sneaker', label: 'Sneaker', block: 'A sneaker' },
  { id: 'coffee-cup', label: 'Coffee cup', block: 'A coffee cup' },
  { id: 'perfume-bottle', label: 'Perfume bottle', block: 'A perfume bottle' },
  { id: 'rose', label: 'Rose', block: 'A rose' },
  { id: 'vintage-car', label: 'Vintage car', block: 'A vintage car' },
  { id: 'city-skyline', label: 'City skyline', block: 'A city skyline' },
  { id: 'human-portrait', label: 'Human portrait', block: 'A human portrait' },
  { id: 'cat', label: 'Cat', block: 'A cat' },
  { id: 'acoustic-guitar', label: 'Acoustic guitar', block: 'An acoustic guitar' },
  { id: 'cocktail-glass', label: 'Cocktail glass', block: 'A cocktail glass' },
  { id: 'mountain-landscape', label: 'Mountain landscape', block: 'A mountain landscape' },
  { id: 'typographic-lettering', label: 'Typographic lettering', block: 'Typographic lettering' },
]

export const STYLES = [
  {
    id: 'clean-minimal',
    label: 'Clean minimal',
    block:
      'flat vector illustration, 2-3 flat colors only, no gradients or texture, generous negative space, soft solid background',
  },
  {
    id: 'retro',
    label: 'Retro',
    block:
      '1970s screen-print poster style, warm halftone texture, mustard/rust/cream palette, bold flat outlines',
  },
  {
    id: 'cartoon',
    label: 'Cartoon',
    block:
      'playful rounded illustration, bold black outlines, flat cel-shaded color, slightly exaggerated proportions, white background',
  },
  {
    id: 'photorealistic',
    label: 'Photorealistic',
    block:
      'studio product photography, soft directional lighting, shallow depth of field, neutral seamless backdrop',
  },
  {
    id: 'watercolor',
    label: 'Watercolor',
    block:
      'loose watercolor painting, visible paper texture, soft bleeding pigment edges, pastel palette, white background',
  },
  {
    id: 'risograph',
    label: 'Risograph',
    block:
      'two-layer risograph print, slight layer misregistration, limited spot-color palette, visible print grain, off-white paper',
  },
  {
    id: '3d-render',
    label: '3D render',
    block:
      'soft clay-style 3D render, matte materials, gentle ambient occlusion, pastel gradient backdrop',
  },
  {
    id: 'line-art',
    label: 'Line art',
    block:
      'single continuous line drawing, no fill color, white background, minimal cross-hatch shading only',
  },
]

const COMPOSITION_RULE = 'Centered, isolated on a white background, no text, no watermark.'

export function buildPrompt(subjectId, styleId) {
  const subject = SUBJECTS.find((s) => s.id === subjectId)
  const style = STYLES.find((s) => s.id === styleId)
  if (!subject || !style) return null
  return `${subject.block}, ${style.block}.\n\n${COMPOSITION_RULE}`
}

export const cellKey = (subjectId, styleId) => `${subjectId}--${styleId}`
