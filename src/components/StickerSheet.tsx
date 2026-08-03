import { useState } from 'react'
import type { Sticker } from '../lib/types'

type Props = {
  stickers: Sticker[]
  /** Cells reserved for in-flight custom generations. */
  pending?: number
  /** Set for the sticker that just finished, so its label shows unprompted. */
  highlightId?: string | null
  minCells?: number
  onDragStart: (sticker: Sticker, e: React.PointerEvent) => void
}

const COLS = 18

export default function StickerSheet({
  stickers,
  pending = 0,
  highlightId,
  minCells,
  onDragStart,
}: Props) {
  const [hovered, setHovered] = useState<string | null>(null)

  const filled = stickers.length + pending
  const total = Math.max(minCells ?? 0, Math.ceil(filled / COLS) * COLS || COLS)

  return (
    <div className="sheet">
      {Array.from({ length: total }, (_, i) => {
        const sticker = stickers[i]
        const isPending = !sticker && i < filled

        return (
          <div
            key={i}
            className="sheet-cell"
            onMouseEnter={() => sticker && setHovered(sticker.id)}
            onMouseLeave={() => setHovered(null)}
          >
            {sticker && (
              <>
                <img
                  src={sticker.src}
                  alt={sticker.name}
                  draggable={false}
                  onPointerDown={(e) => onDragStart(sticker, e)}
                />
                {(hovered === sticker.id || highlightId === sticker.id) && (
                  <span className="name-label">{sticker.name}</span>
                )}
              </>
            )}
            {isPending && <span className="grain tile" style={{ position: 'absolute', inset: 6 }} />}
          </div>
        )
      })}
    </div>
  )
}
