import { useEffect } from 'react'

/**
 * Publishes the height of everything that isn't the canvas as `--chrome-h`,
 * so the stylesheet can work out how much room the canvas may take.
 *
 * This used to be a hard-coded estimate, which over-reserved and shrank the
 * canvas for no reason. Measuring keeps it honest as the panel, controls or
 * type sizes change.
 *
 * `offsetHeight` is used throughout because it reports layout pixels and so
 * is unaffected by the root `zoom`, unlike `getBoundingClientRect()`.
 */
export function useChromeHeight() {
  useEffect(() => {
    const read = () => {
      const q = (sel: string) => document.querySelector<HTMLElement>(sel)
      const header = q('.header')
      const tabs = q('.tabs')
      const panel = q('.panel')
      const stage = q('.stage')
      const inner = q('.stage-inner')
      const body = q('.stage-body')
      if (!header || !tabs || !panel || !stage || !inner || !body) return

      const pad = getComputedStyle(stage)
      const stagePad = parseFloat(pad.paddingTop) + parseFloat(pad.paddingBottom)

      /* Everything in the stage except the canvas row. This difference stays
         constant as the canvas resizes, so the value settles immediately
         rather than oscillating. */
      const aroundCanvas = inner.offsetHeight - body.offsetHeight

      const chrome =
        header.offsetHeight +
        tabs.offsetHeight +
        panel.offsetHeight +
        stagePad +
        aroundCanvas

      document.documentElement.style.setProperty('--chrome-h', `${Math.ceil(chrome)}px`)
    }

    read()
    window.addEventListener('resize', read)

    // The panel changes height when tabs switch or characters are added.
    const panel = document.querySelector('.panel')
    const ro = panel ? new ResizeObserver(read) : null
    if (panel && ro) ro.observe(panel)

    return () => {
      window.removeEventListener('resize', read)
      ro?.disconnect()
    }
  }, [])
}
