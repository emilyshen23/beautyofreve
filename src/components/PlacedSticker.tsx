import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { Placed } from '../lib/types'

type Props = {
  item: Placed
  selected: boolean
  onSelect: () => void
  onChange: (patch: Partial<Placed>) => void
  canvasEl: HTMLElement | null
}

type Corner = 'nw' | 'ne' | 'sw' | 'se'

const DEG = 180 / Math.PI

export default function PlacedSticker({ item, selected, onSelect, onChange, canvasEl }: Props) {
  const [dragging, setDragging] = useState(false)
  const start = useRef({ x: 0, y: 0, item })

  /* All three gestures share one pointer-capture loop; only the math differs.
     Coordinates stay in canvas space so a resized window can't skew them. */
  function begin(e: React.PointerEvent, mode: 'move' | Corner | 'rotate') {
    e.stopPropagation()
    onSelect()
    const el = e.currentTarget as HTMLElement
    el.setPointerCapture(e.pointerId)
    setDragging(true)

    const rect = canvasEl?.getBoundingClientRect()
    const scale = rect ? rect.width / (canvasEl?.offsetWidth ?? rect.width) : 1
    start.current = { x: e.clientX, y: e.clientY, item }

    const centre = {
      x: (rect?.left ?? 0) + (item.x + item.w / 2) * scale,
      y: (rect?.top ?? 0) + (item.y + item.h / 2) * scale,
    }
    const startAngle = Math.atan2(e.clientY - centre.y, e.clientX - centre.x) * DEG

    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - start.current.x) / scale
      const dy = (ev.clientY - start.current.y) / scale
      const s = start.current.item

      if (mode === 'move') {
        onChange({ x: s.x + dx, y: s.y + dy })
        return
      }

      if (mode === 'rotate') {
        const angle = Math.atan2(ev.clientY - centre.y, ev.clientX - centre.x) * DEG
        let next = s.rot + (angle - startAngle)
        if (ev.shiftKey) next = Math.round(next / 15) * 15
        onChange({ rot: next })
        return
      }

      // Aspect-locked resize. Project the drag onto the diagonal so the corner
      // tracks the cursor even when the sticker is rotated.
      const signX = mode === 'ne' || mode === 'se' ? 1 : -1
      const signY = mode === 'sw' || mode === 'se' ? 1 : -1
      const rad = (s.rot * Math.PI) / 180
      const local = dx * Math.cos(rad) + dy * Math.sin(rad)
      const localY = -dx * Math.sin(rad) + dy * Math.cos(rad)
      const delta = (local * signX + localY * signY) / 2

      const ratio = s.h / s.w
      const w = Math.max(24, s.w + delta)
      const h = w * ratio
      onChange({
        w,
        h,
        x: s.x + (s.w - w) / 2,
        y: s.y + (s.h - h) / 2,
      })
    }

    const up = () => {
      setDragging(false)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
    }

    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
  }

  return (
    <motion.div
      className={`placed${dragging ? ' dragging' : ''}`}
      style={{
        left: item.x,
        top: item.y,
        width: item.w,
        height: item.h,
        rotate: item.rot,
        zIndex: selected ? 2 : 1,
      }}
      // The landing bounce: it should read as physically settling, not appearing.
      initial={{ scale: 1.08, opacity: 0.85 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
    >
      <img src={item.src} alt={item.name} draggable={false} />
      <div className="placed-hit" onPointerDown={(e) => begin(e, 'move')} />

      {selected && (
        <div className="placed-frame">
          {(['nw', 'ne', 'sw', 'se'] as Corner[]).map((c) => (
            <div key={c} className={`handle ${c}`} onPointerDown={(e) => begin(e, c)} />
          ))}
          <div className="handle rotate" onPointerDown={(e) => begin(e, 'rotate')} />
        </div>
      )}
    </motion.div>
  )
}
