// The 78 pre-generated stickers: 66 characters plus 12 "magic" effects.
// These ship as static transparent assets, so browsing the sheet never hits
// the API.
//
// Six characters are flagged mood: 'mischievous'. They are deliberately
// scattered through the ordinary cast rather than grouped, so a child finds
// them while browsing instead of on a "villains" shelf. The flag drives no UI
// — the difference lives entirely in the artwork's palette and expression.
//
// The sheet is a 20-column grid. The characters fill the left 17 columns and
// the 12 magic stickers occupy the right 3 — see StickerSheet.

export const STICKER_CATEGORIES = [
  {
    id: 'woodland',
    label: 'Woodland',
    names: [
      'Fox', 'Rabbit', { name: 'Sneaky shadow fox', mood: 'mischievous' },
      'Squirrel', 'Deer', 'Hedgehog', 'Raccoon', 'Beaver',
      { name: 'Grouchy rock troll', mood: 'mischievous' },
      'Chipmunk', 'Wolf', 'Bear cub',
    ],
  },
  {
    id: 'savanna',
    label: 'Savanna & jungle',
    names: [
      'Elephant', 'Lion cub', 'Tiger cub', 'Giraffe', 'Zebra',
      'Monkey', 'Sloth', 'Panda', 'Red panda', 'Koala',
    ],
  },
  {
    id: 'birds',
    label: 'Birds',
    names: [
      'Owl', 'Hummingbird', 'Swan', 'Flamingo', 'Toucan', 'Peacock',
      { name: 'Sly shadow crow', mood: 'mischievous' },
      'Penguin', 'Puffin', 'Parrot', 'Duckling',
    ],
  },
  {
    id: 'sea',
    label: 'Sea & water',
    names: [
      'Seahorse', 'Jellyfish', 'Crab', 'Turtle',
      { name: 'Grumpy storm cloud', mood: 'mischievous' },
      'Octopus', 'Otter', 'Whale', 'Dolphin', 'Seal pup', 'Narwhal',
    ],
  },
  {
    id: 'small',
    label: 'Small creatures',
    names: [
      'Butterfly', 'Bee', { name: 'Spooky bat', mood: 'mischievous' },
      'Ladybug', 'Dragonfly', 'Snail', 'Caterpillar', 'Frog',
      { name: 'Prickly thornbush creature', mood: 'mischievous' },
      'Mouse', 'Bat', 'Grasshopper',
    ],
  },
  {
    id: 'farm',
    label: 'Farm & friends',
    names: [
      'Cat', 'Puppy', 'Pony', 'Piglet', 'Lamb',
      'Calf', 'Rooster', 'Llama', 'Donkey', 'Goat kid',
    ],
  },
  {
    // Atmosphere rather than cast: these are the effects a scene is sprinkled
    // with. Flagged so the sheet can give them their own treatment.
    id: 'magic',
    label: 'Magic',
    magic: true,
    names: [
      'Fireflies', 'Floating dandelion seeds', 'Sunbeam rays', 'Sparkling pollen dust',
      'Swirling autumn leaves', 'Twinkling stars', 'Soft rainbow arc', 'Glowing mushroom spores',
      'Gentle wind swirl', 'Morning dew sparkles', 'Falling snow flurries', 'Ripple water sparkle',
    ],
  },
]

export const slugify = (name) =>
  name.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export const STICKERS = STICKER_CATEGORIES.flatMap((c) =>
  c.names.map((entry) => {
    const { name, mood } = typeof entry === 'string' ? { name: entry } : entry
    return {
      id: slugify(name),
      name,
      category: c.id,
      ...(c.magic ? { magic: true } : {}),
      ...(mood ? { mood } : {}),
    }
  }),
)

/* Shared die-cut treatment, so every sticker sits together on one sheet
   whether it's a character, an effect, or something the user invented. */
const CUTOUT =
  'The subject is fully traced with a thick white sticker-cut border around ' +
  'its silhouette, like a die-cut vinyl sticker peeled off a sheet. Background ' +
  'must be fully transparent, no background color, no scene, no cast shadow. ' +
  'Centered, square 1:1 composition, no text, no watermark.'

const SCREEN_PRINT =
  '1970s screen-print style: bold flat colors, a subtle halftone or grain ' +
  'texture, soft confident ink outline.'

/**
 * `kind` picks the framing:
 *   animal      — a nature-themed character
 *   mischievous — the same, but cooler, darker and visibly up to something
 *   magic       — a luminous effect motif, drawn as a cluster not a scene
 *   custom      — whatever the user typed, in the same house style
 */
export const stickerPrompt = (name, { kind = 'animal' } = {}) => {
  if (kind === 'mischievous') {
    return (
      `${name}, a single storybook character sticker in a cool, shadowy ` +
      `${SCREEN_PRINT} Shift the palette cooler and darker than usual — dusky ` +
      `purples, slate grays and muted mossy greens rather than warm tones. Give ` +
      `it a big, exaggerated, comically grumpy or sly expression: furrowed brow, ` +
      `a crooked sideways smirk, narrowed mischievous eyes. It must still read ` +
      `as cute, rounded and huggable — a storybook trickster a child would ` +
      `giggle at, never frightening, threatening or monstrous. No sharp teeth, ` +
      `no glowing red eyes. ${CUTOUT}`
    )
  }

  if (kind === 'magic') {
    return (
      `${name}, a single magical effect sticker in a warm ${SCREEN_PRINT} Render it as a ` +
      `decorative floating motif — a graceful cluster or arc of the effect ` +
      `itself, with a soft luminous glow, delicate highlights and a light ` +
      `scattering of sparkles. No characters, no creatures, no landscape, no ` +
      `ground: just the effect, isolated. ${CUTOUT}`
    )
  }

  const subject = kind === 'animal' ? 'a single nature-themed sticker' : 'a single sticker'
  return `${name}, ${subject} illustration in a warm ${SCREEN_PRINT} ${CUTOUT}`
}
