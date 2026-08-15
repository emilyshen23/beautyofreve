import { play, setEnabled, setVolume } from 'cuelume'

/**
 * Every sound the app makes, named by the moment rather than the cue, so the
 * palette can be re-tuned in one place.
 *
 * Cuelume synthesises these live — there are no audio files to ship. Playback
 * is a silent no-op until the browser has had a user gesture, which it always
 * has here: nothing makes noise before the child touches something.
 */
const CUES = {
  hoverCharacter: 'tick',      // sweeping the sheet, throttled by cuelume
  pickUp: 'press',             // lifting a character off the sheet
  drop: 'sparkle',             // landing one — pairs with the sparkle burst
  grab: 'press',               // taking hold of one already on the canvas
  lock: 'ready',               // "rising lock-on", literally a lock
  unlock: 'droplet',
  duplicate: 'release',
  remove: 'droplet',
  button: 'toggle',            // tabs, menus, the look picker
  setting: 'page',             // switching backdrops, like turning a page
  bringToLife: 'arrival',      // the big one: a rising harmonic portal
  done: 'success',
  failed: 'error',
} as const

export type Moment = keyof typeof CUES

let on = true

/** Children's software should be audible by default, but not loud. */
setVolume(0.45)

export function cue(moment: Moment, volume?: number) {
  if (!on) return
  play(CUES[moment], volume === undefined ? undefined : { volume })
}

export function soundOn() {
  return on
}

export function toggleSound() {
  on = !on
  setEnabled(on)
  // Confirm re-enabling with the sound itself.
  if (on) play(CUES.button)
  return on
}
