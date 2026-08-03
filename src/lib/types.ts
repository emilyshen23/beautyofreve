export type Sticker = {
  id: string
  name: string
  category?: string
  src: string
  custom?: boolean
}

/** A sticker placed on the canvas. Coordinates are in canvas design space
 *  (954 x 431), not screen pixels, so the layout survives a window resize. */
export type Placed = {
  uid: string
  stickerId: string
  name: string
  src: string
  x: number
  y: number
  w: number
  h: number
  rot: number
  /** Pinned in place — drag, resize and rotate are all refused. */
  locked?: boolean
}

/* The finished image lives in its own `background` state rather than here,
   since it persists as the canvas backdrop across further rounds. */
export type SceneState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
