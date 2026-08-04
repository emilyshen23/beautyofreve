// The "ultimate generation" — Reve repaints the whole arrangement as one scene.

/**
 * Appended to every prompt in every mode, so the result stays warm and
 * child-friendly whichever style is picked. This is the one clause that must
 * never be dropped: it does the safety work (nothing frightening) *and* the
 * charm work (kind faces, readable subjects, cheerful light).
 */
const CHILD_FRIENDLY =
  'Make it delightful for a young child: joyful, gentle and full of wonder — ' +
  'the kind of picture a kid would want to linger over and point at. Warm ' +
  'inviting light, soft rounded forms, and any creature given a kind, friendly, ' +
  'expressive face with big gentle eyes. Keep every element clearly readable ' +
  'and generously spaced, with one obvious focal point rather than a busy, ' +
  'crowded scene. Bright cheerful colors that still sit together harmoniously. ' +
  'Add small charming details worth discovering on a second look. Absolutely ' +
  'nothing frightening, sad, gloomy or unsettling: no bared teeth, no menacing ' +
  'eyes, no darkness, decay or danger, no text and no watermark.'

export const SCENE_STYLES = [
  {
    id: 'fairytale',
    label: 'Fairytale',
    name: 'fairytale storybook',
    block:
      'Hand-painted fairytale storybook illustration, like a treasured ' +
      'children’s picture book: soft painterly brushwork with visible texture, ' +
      'warm glowing magical light, tiny drifting sparkles and floating pollen ' +
      'motes catching the sun. Rich storybook color — deep mossy greens, honey ' +
      'golds, dusky rose and twilight blue. Cozy enchanted-woodland atmosphere ' +
      'with a gentle sense that something wonderful is about to happen.',
  },
  {
    id: 'watercolor',
    label: 'Watercolor',
    name: 'watercolor painting',
    block:
      'Loose, luminous watercolor painting on textured cold-press paper: soft ' +
      'translucent washes, pigment blooming and bleeding softly at the edges, ' +
      'wet-on-wet skies, and bare white paper left breathing through the ' +
      'lightest areas. A fresh pastel palette — sky blue, leaf green, apricot ' +
      'and soft pink — with delicate confident linework and no hard outlines. ' +
      'Light, dreamy and unmistakably hand-made.',
  },
  {
    id: 'realistic',
    label: 'Realistic',
    name: 'realistic photographic',
    block:
      'Photorealistic rendering in warm natural daylight: soft golden-hour sun, ' +
      'gentle rim light, and true-to-life texture in fur, feathers, bark, ' +
      'petals and water. Shallow natural depth of field with a softly blurred ' +
      'background, clean believable color and crisp fine detail. Bright, airy ' +
      'and welcoming — the feel of a beautiful nature documentary still, never ' +
      'moody or harsh.',
  },
]

/**
 * Three modes, because the reference image means something different each time:
 *   compose — a flat sticker collage, to be painted into one scene
 *   add     — a finished scene with new cut-outs laid on top
 *   restyle — a finished scene to be repainted in a different style
 */
export function buildScenePrompt(styleId, stickerNames, { mode = 'compose', setting } = {}) {
  const style = SCENE_STYLES.find((s) => s.id === styleId)
  if (!style) return null

  if (mode === 'restyle') {
    return (
      `<frame1> shows a finished scene. Repaint it completely as a ` +
      `${style.name} scene, keeping the same composition: the same subjects, in ` +
      `the same positions, at the same relative scale. Change only the rendering ` +
      `treatment. ${style.block} ${CHILD_FRIENDLY}`
    )
  }

  /* Continuing rounds hand Reve an already-painted scene with fresh stickers
     laid on top, so the instruction is to absorb the new elements rather than
     to repaint everything from a flat sticker collage. */
  if (mode === 'add') {
    return (
      `<frame1> shows an already-painted ${style.name} scene with new flat ` +
      `sticker cut-outs placed on top of it: ${stickerNames.join(', ')}. Keep ` +
      `the existing painted scene essentially as it is, and repaint only the ` +
      `newly added elements so they belong naturally inside it — matching its ` +
      `lighting, perspective, scale and texture, and casting appropriate ` +
      `shadows. Keep each new element at the position and size shown. Nothing ` +
      `in the final image should look like a flat sticker pasted on top. ` +
      `${style.block} ${CHILD_FRIENDLY}`
    )
  }

  /* <frame1> is a backdrop with flat cut-outs sitting on top of it, and they
     will not match — different lighting, different scale, no shadows. Saying
     so plainly is what turns the collage into one painting. */
  const inSetting = setting ? ` The scene is set in ${setting}.` : ''

  return (
    `Using the composition shown in <frame1> as the layout guide, create one ` +
    `cohesive, unified ${style.name} scene that naturally brings together ` +
    `everything shown: ${stickerNames.join(', ')}.${inSetting} The reference is ` +
    `a rough collage — flat sticker cut-outs laid over a backdrop, not yet ` +
    `blended. Keep the relative placement, scale and arrangement of each ` +
    `element close to the reference, but fully repaint everything, backdrop and ` +
    `characters alike, into one atmospheric, connected picture. Unify the ` +
    `lighting so a single light source falls across everything, ground each ` +
    `character with a soft contact shadow, adjust scale so nothing floats or ` +
    `looks pasted, and let the setting wrap around them. Nothing in the final ` +
    `image should read as a flat sticker on top of a photo. ` +
    `${style.block} ${CHILD_FRIENDLY}`
  )
}
