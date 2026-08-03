// The 68 pre-generated nature stickers. These ship as static transparent
// assets — browsing the sheet never hits the API.

export const STICKER_CATEGORIES = [
  {
    id: 'animals',
    label: 'Animals',
    names: [
      'Fox', 'Rabbit', 'Squirrel', 'Deer', 'Hedgehog',
      'Raccoon', 'Otter', 'Mountain goat', 'Bear cub',
    ],
  },
  {
    id: 'birds',
    label: 'Birds',
    names: [
      'Sparrow', 'Owl', 'Hummingbird', 'Robin',
      'Swan', 'Flamingo', 'Toucan', 'Peacock',
    ],
  },
  {
    id: 'insects',
    label: 'Insects & small creatures',
    names: [
      'Butterfly', 'Bee', 'Ladybug', 'Dragonfly',
      'Snail', 'Caterpillar', 'Firefly', 'Spider',
    ],
  },
  {
    id: 'water',
    label: 'Water creatures',
    // The spec called for 8 here but listed 7; Octopus fills the gap with a
    // silhouette that stays readable at sticker size.
    names: [
      'Fish', 'Seahorse', 'Jellyfish', 'Crab',
      'Starfish', 'Turtle', 'Coral', 'Octopus',
    ],
  },
  {
    id: 'plants',
    label: 'Trees & plants',
    names: [
      'Oak tree', 'Pine tree', 'Palm tree', 'Cactus',
      'Fern', 'Bamboo stalk', 'Bonsai tree', 'Leafy vine',
    ],
  },
  {
    id: 'flowers',
    label: 'Flowers',
    names: [
      'Sunflower', 'Rose', 'Tulip', 'Daisy',
      'Lavender sprig', 'Lotus flower', 'Cherry blossom branch', 'Wildflower bouquet',
    ],
  },
  {
    id: 'sky',
    label: 'Sky & landscape',
    names: [
      'Sun', 'Moon', 'Cloud', 'Rainbow', 'Lightning bolt',
      'Raindrop', 'Snowflake', 'Mountain peak', 'Waterfall',
    ],
  },
  {
    id: 'ground',
    label: 'Ground & misc nature',
    names: [
      'Mushroom', 'Pinecone', 'Acorn', 'Autumn leaf', 'Feather',
      'Seashell', 'River stone', 'Honeycomb', 'Beehive', "Bird's nest with eggs",
    ],
  },
  {
    // Appended last so they fill the four empty cells in the bottom-right
    // without shifting any existing sticker's position in the sheet.
    id: 'extra',
    label: 'More nature',
    names: ['Frog', 'Wolf', 'Dandelion', 'Lily pad'],
  },
]

export const slugify = (name) =>
  name.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export const STICKERS = STICKER_CATEGORIES.flatMap((c) =>
  c.names.map((name) => ({ id: slugify(name), name, category: c.id })),
)

/* Shared visual treatment, so custom stickers sit next to the built-in 68.
   The only difference between the two templates is whether the subject is
   introduced as nature-themed. */
const STICKER_STYLE =
  'sticker illustration in a warm 1970s screen-print style: bold flat colors, ' +
  'a subtle halftone or grain texture, soft confident ink outline. The subject ' +
  'is fully traced with a thick white sticker-cut border around its silhouette, ' +
  'like a die-cut vinyl sticker peeled off a sheet. Background must be fully ' +
  'transparent, no background color, no scene, no cast shadow. Centered, ' +
  'square 1:1 composition, no text, no watermark.'

export const stickerPrompt = (name, { nature = true } = {}) =>
  `${name}, a single ${nature ? 'nature-themed ' : ''}${STICKER_STYLE}`
