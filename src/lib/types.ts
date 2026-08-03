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
}

export type SceneState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; url: string }
  | { status: 'error'; message: string }
