import { useEffect, useRef } from 'react'

/**
 * The grainy gradient the whole craft table sits on.
 *
 * Idle, it swirls on its own. On pointer movement the layers drift toward the
 * cursor at different rates. Everything moves via `transform`/`translate`, so
 * it stays on the compositor and never repaints a full-screen gradient.
 */
export default function Backdrop() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    const onMove = (e: PointerEvent) => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        // -1..1 from the centre of the viewport.
        const px = (e.clientX / window.innerWidth) * 2 - 1
        const py = (e.clientY / window.innerHeight) * 2 - 1
        el.style.setProperty('--px', px.toFixed(3))
        el.style.setProperty('--py', py.toFixed(3))
      })
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  /* Two counter-rotating layers at unrelated speeds. Their interference is
     what makes the motion feel organic rather than like one thing turning,
     and because the periods don't divide evenly the pattern doesn't visibly
     repeat. They also parallax by different amounts, so the swirl has depth
     as it follows the pointer. */
  return (
    <div className="page-backdrop" ref={ref} aria-hidden="true">
      <div className="swirl swirl-a" />
      <div className="swirl swirl-b" />
    </div>
  )
}
