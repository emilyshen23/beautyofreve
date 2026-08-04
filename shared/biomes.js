// Five nature backdrops the story can be set in. Each is generated once and
// shipped as a static plate, so switching between them is instant.
//
// The plates are deliberately calm and uncluttered: they are a stage, not the
// show. Characters get dropped on top and will not blend at first — that is
// fine. "Bring it to life" is the step that fuses backdrop and cast into one
// coherent painting.

export const BIOMES = [
  {
    id: 'forest',
    label: 'Enchanted forest',
    scene: 'a sun-dappled enchanted forest clearing',
    plate:
      'A wide enchanted forest clearing: tall mossy trees framing the edges, ' +
      'shafts of golden sunlight falling through the canopy, a soft carpet of ' +
      'ferns and glowing motes in the air. Deep emerald and moss greens with ' +
      'warm honey light.',
  },
  {
    id: 'meadow',
    label: 'Flower meadow',
    scene: 'a bright wildflower meadow under a summer sky',
    plate:
      'A wide rolling wildflower meadow: soft grass scattered with daisies, ' +
      'poppies and cornflowers, gentle hills receding into the distance, and a ' +
      'big open summer sky with fat white clouds. Fresh spring greens, sky ' +
      'blue and cheerful pops of petal color.',
  },
  {
    id: 'snow',
    label: 'Snowy mountains',
    scene: 'a quiet snowy mountain valley',
    plate:
      'A wide snowy mountain valley: soft rolling drifts of snow, dark green ' +
      'pines dusted white, jagged peaks catching pink alpenglow on the horizon, ' +
      'and a pale winter sky. Cool whites, powder blues and lilac shadows with ' +
      'a warm blush of low sun.',
  },
  {
    id: 'reef',
    label: 'Coral reef',
    scene: 'a sunlit underwater coral reef',
    plate:
      'A wide sunlit underwater coral reef: rippling shafts of light coming ' +
      'down through clear water, soft sandy seabed, waving kelp and rounded ' +
      'coral heads along the edges, tiny bubbles drifting up. Turquoise and ' +
      'aquamarine water with coral pink and warm sand.',
  },
  {
    id: 'desert',
    label: 'Desert oasis',
    scene: 'a warm desert oasis at golden hour',
    plate:
      'A wide desert oasis at golden hour: rippled apricot sand dunes, a calm ' +
      'blue pool ringed with palms, distant red rock mesas, and a vast peach ' +
      'and lilac sky. Warm ochre, terracotta and gold with cool turquoise water.',
  },
]

/**
 * The plates are backdrops, not scenes: anything with a face would fight the
 * characters the user drops on top, and a busy centre would bury them.
 */
export const biomePrompt = (biome) =>
  `${biome.plate} Painted as a soft, warm children's-storybook backdrop: ` +
  `gentle painterly brushwork, inviting light, and a calm uncluttered middle ` +
  `of the frame so characters can be placed on top of it later. Absolutely no ` +
  `animals, no people, no creatures, no characters of any kind — landscape ` +
  `only. Nothing frightening or gloomy. Wide 2:1 composition, no text, no ` +
  `watermark.`
