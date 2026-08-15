import { useState } from 'react'
import { cue } from '../lib/sound'
import type { Sticker } from '../lib/types'

type Props = {
  stickers: Sticker[]
  /** Rendered as a block down the right-hand columns, with their own treatment. */
  magic?: Sticker[]
  /** Cells reserved for in-flight custom generations. */
  pending?: number
  /** Set for the sticker that just finished, so its label shows unprompted. */
  highlightId?: string | null
  onDragStart: (sticker: Sticker, e: React.PointerEvent) => void
}

const COLS = 20
const MAGIC_COLS = 3
const MAIN_COLS = COLS - MAGIC_COLS

type Cell = { sticker?: Sticker; magic?: boolean }

/**
 * The grid fills row by row, so magic stickers appended to a flat list would
 * land at the end of the last row. Interleaving them per row instead puts them
 * in the right-hand columns as a block.
 */
function buildCells(main: Sticker[], magic: Sticker[], pending: number): Cell[] {
  const filled = main.length + pending

  if (!magic.length) {
    const total = Math.max(Math.ceil(filled / COLS), 1) * COLS
    return Array.from({ length: total }, (_, i) => ({ sticker: main[i] }))
  }

  const rows = Math.max(Math.ceil(filled / MAIN_COLS), Math.ceil(magic.length / MAGIC_COLS), 1)
  const cells: Cell[] = []

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < MAIN_COLS; c++) cells.push({ sticker: main[r * MAIN_COLS + c] })
    for (let c = 0; c < MAGIC_COLS; c++) {
      cells.push({ sticker: magic[r * MAGIC_COLS + c], magic: true })
    }
  }
  return cells
}

export default function StickerSheet({
  stickers,
  magic = [],
  pending = 0,
  highlightId,
  onDragStart,
}: Props) {
  const [hovered, setHovered] = useState<string | null>(null)

  const cells = buildCells(stickers, magic, pending)
  const filled = stickers.length + pending

  return (
    <div className="sheet" style={{ ["--sheet-cols" as string]: COLS }}>
      {cells.map((cell, i) => {
        const { sticker } = cell
        // Only main-column cells can hold an in-flight custom generation.
        const isPending = !cell.magic && !sticker && i - Math.floor(i / COLS) * MAGIC_COLS < filled

        return (
          <div
            key={i}
            className={`sheet-cell${cell.magic ? ' magic' : ''}`}
            onMouseEnter={() => {
              if (!sticker) return
              cue('hoverCharacter')
              setHovered(sticker.id)
            }}
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
