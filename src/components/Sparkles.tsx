import { motion } from 'framer-motion'

/**
 * A one-shot burst fired where a sticker lands. Deliberately short and
 * non-blocking: it confirms the drop happened without making the child wait
 * for an animation before they can move the sticker.
 *
 * Offsets are generated once per burst and passed in, so a re-render can't
 * reshuffle particles mid-flight.
 */
export type Tone = 'plain' | 'magic' | 'mischief'
export type Burst = { id: string; x: number; y: number; seeds: number[]; tone: Tone }

const COUNT = 10

export const makeBurst = (x: number, y: number, tone: Tone = 'plain'): Burst => ({
  id: Math.random().toString(36).slice(2, 9),
  x,
  y,
  tone,
  seeds: Array.from({ length: COUNT }, () => Math.random()),
})

export default function Sparkles({ burst }: { burst: Burst }) {
  return (
    <div
      className={`sparkles tone-${burst.tone}`}
      style={{ left: burst.x, top: burst.y, right: 'auto', bottom: 'auto' }}
    >
      {burst.seeds.map((seed, i) => {
        const angle = (i / COUNT) * Math.PI * 2 + seed
        const distance = 34 + seed * 30
        return (
          <motion.span
            key={i}
            className="sparkle"
            style={{ left: 0, top: 0 }}
            initial={{ x: 0, y: 0, scale: 0.3, opacity: 0 }}
            animate={{
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance,
              scale: [0.3, 1, 0.2],
              opacity: [0, 1, 0],
            }}
            transition={{ duration: 0.6 + seed * 0.2, ease: [0.23, 1, 0.32, 1] }}
          />
        )
      })}
    </div>
  )
}
