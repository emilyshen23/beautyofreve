// The 72 pre-generated stickers — all animals, chosen to be the cast a child
// would want in a storybook. These ship as static transparent assets, so
// browsing the sheet never hits the API.

export const STICKER_CATEGORIES = [
  {
    id: 'woodland',
    label: 'Woodland',
    names: [
      'Fox', 'Rabbit', 'Squirrel', 'Deer', 'Hedgehog', 'Raccoon',
      'Badger', 'Beaver', 'Chipmunk', 'Porcupine', 'Wolf', 'Bear cub',
    ],
  },
  {
    id: 'savanna',
    label: 'Savanna & jungle',
    names: [
      'Elephant', 'Lion cub', 'Tiger cub', 'Giraffe', 'Zebra', 'Hippo',
      'Monkey', 'Sloth', 'Meerkat', 'Panda', 'Red panda', 'Koala',
    ],
  },
  {
    id: 'birds',
    label: 'Birds',
    names: [
      'Sparrow', 'Owl', 'Hummingbird', 'Robin', 'Swan', 'Flamingo',
      'Toucan', 'Peacock', 'Penguin', 'Puffin', 'Parrot', 'Duckling',
    ],
  },
  {
    id: 'sea',
    label: 'Sea & water',
    names: [
      'Fish', 'Seahorse', 'Jellyfish', 'Crab', 'Starfish', 'Turtle',
      'Octopus', 'Otter', 'Whale', 'Dolphin', 'Seal pup', 'Narwhal',
    ],
  },
  {
    id: 'small',
    label: 'Small creatures',
    names: [
      'Butterfly', 'Bee', 'Ladybug', 'Dragonfly', 'Snail', 'Caterpillar',
      'Firefly', 'Spider', 'Frog', 'Mouse', 'Bat', 'Grasshopper',
    ],
  },
  {
    id: 'farm',
    label: 'Farm & friends',
    names: [
      'Cat', 'Puppy', 'Pony', 'Piglet', 'Lamb', 'Calf',
      'Rooster', 'Llama', 'Donkey', 'Goat kid', 'Mountain goat', 'Tortoise',
    ],
  },
]

export const slugify = (name) =>
  name.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export const STICKERS = STICKER_CATEGORIES.flatMap((c) =>
  c.names.map((name) => ({ id: slugify(name), name, category: c.id })),
)

/* Shared visual treatment, so custom stickers sit next to the built-in 72.
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
