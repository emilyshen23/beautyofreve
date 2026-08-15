import { useEffect, useRef } from 'react'

/**
 * The grainy gradient the whole craft table sits on.
 *
 * Idle, it drifts on its own via CSS keyframes. On pointer movement the whole
 * layer parallaxes gently toward the cursor — done with `translate` rather
 * than by moving the gradient stops, so it stays on the compositor and never
 * repaints a full-screen blurred surface.
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

  return <div className="page-backdrop" ref={ref} aria-hidden="true" />
}
