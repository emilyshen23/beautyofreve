import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import StickerSheet from './components/StickerSheet'
import PlacedSticker from './components/PlacedSticker'
import { CaretDown, ArrowUp, Download } from './components/icons'
import { flattenCanvas, CANVAS_W, CANVAS_H } from './lib/flatten'
import { SCENE_STYLES } from '../shared/scene.js'
import type { Placed, Sticker, SceneState } from './lib/types'

const DEFAULT_SIZE = 120
const uid = () => Math.random().toString(36).slice(2, 9)

export default function App() {
  const [stickers, setStickers] = useState<Sticker[]>([])
  const [custom, setCustom] = useState<Sticker[]>([])
  const [tab, setTab] = useState<'sheet' | 'own'>('sheet')

  const [placed, setPlaced] = useState<Placed[]>([])
  const [selected, setSelected] = useState<string | null>(null)

  const [styleId, setStyleId] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scene, setScene] = useState<SceneState>({ status: 'idle' })

  const [prompt, setPrompt] = useState('')
  const [minting, setMinting] = useState(false)
  const [justMinted, setJustMinted] = useState<string | null>(null)

  const [ghost, setGhost] = useState<{ src: string; x: number; y: number } | null>(null)
  const dragged = useRef<Sticker | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const clipboard = useRef<Placed | null>(null)

  useEffect(() => {
    fetch('/api/stickers')
      .then((r) => r.json())
      .then((d) => {
        setStickers(d.stickers ?? [])
        setCustom(d.custom ?? [])
      })
      .catch(() => {})
  }, [])

  /* Drag from the sheet onto the canvas. Pointer events (rather than HTML5
     drag-and-drop) so the ghost and the landing bounce stay under our control. */
  const startDrag = useCallback((sticker: Sticker, e: React.PointerEvent) => {
    e.preventDefault()
    dragged.current = sticker
    setGhost({ src: sticker.src, x: e.clientX, y: e.clientY })

    const move = (ev: PointerEvent) => setGhost({ src: sticker.src, x: ev.clientX, y: ev.clientY })

    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      setGhost(null)

      const rect = canvasRef.current?.getBoundingClientRect()
      dragged.current = null
      if (!rect) return

      const inside =
        ev.clientX >= rect.left && ev.clientX <= rect.right &&
        ev.clientY >= rect.top && ev.clientY <= rect.bottom
      if (!inside) return

      // Screen -> canvas design space, so layout survives a resize.
      const scale = CANVAS_W / rect.width
      const x = (ev.clientX - rect.left) * scale - DEFAULT_SIZE / 2
      const y = (ev.clientY - rect.top) * scale - DEFAULT_SIZE / 2

      const item: Placed = {
        uid: uid(),
        stickerId: sticker.id,
        name: sticker.name,
        src: sticker.src,
        x, y, w: DEFAULT_SIZE, h: DEFAULT_SIZE, rot: 0,
      }
      setPlaced((p) => [...p, item])
      setSelected(item.uid)
      setScene({ status: 'idle' })
    }

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }, [])

  const update = useCallback((uidKey: string, patch: Partial<Placed>) => {
    setPlaced((p) => p.map((it) => (it.uid === uidKey ? { ...it, ...patch } : it)))
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT') return

      const item = placed.find((p) => p.uid === selected)
      const meta = e.metaKey || e.ctrlKey

      if (meta && e.key === 'c' && item) {
        clipboard.current = item
      } else if (meta && e.key === 'v' && clipboard.current) {
        e.preventDefault()
        const copy = { ...clipboard.current, uid: uid(), x: clipboard.current.x + 24, y: clipboard.current.y + 24 }
        setPlaced((p) => [...p, copy])
        setSelected(copy.uid)
      } else if ((e.key === 'Backspace' || e.key === 'Delete') && item) {
        e.preventDefault()
        setPlaced((p) => p.filter((it) => it.uid !== item.uid))
        setSelected(null)
      } else if (e.key === 'Escape') {
        setSelected(null)
        setMenuOpen(false)
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [placed, selected])

  async function mint() {
    const name = prompt.trim()
    if (!name || minting) return

    setMinting(true)
    setPrompt('')
    try {
      const res = await fetch('/api/stickers/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCustom((c) => [...c, data.sticker])
      setJustMinted(data.sticker.id)
      setTimeout(() => setJustMinted(null), 2600)
    } catch {
      /* surfaced by the input returning to its resting state */
    } finally {
      setMinting(false)
    }
  }

  async function craft() {
    if (!styleId || !placed.length || scene.status === 'loading') return
    setScene({ status: 'loading' })
    setSelected(null)
    try {
      const reference = await flattenCanvas(placed)
      const res = await fetch('/api/craft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          styleId,
          reference,
          names: [...new Set(placed.map((p) => p.name))],
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setScene({ status: 'done', url: data.image })
    } catch (err) {
      setScene({ status: 'error', message: (err as Error).message })
    }
  }

  const chosen = SCENE_STYLES.find((s) => s.id === styleId)
  const canCraft = Boolean(styleId) && placed.length > 0 && scene.status !== 'loading'
  const done = scene.status === 'done'

  return (
    <div className="app">
      <header className="header">
        <span>Reve</span>
        <span className="muted">your home for digital collages</span>
      </header>

      <div className="stage">
        <div className="stage-inner">
          <div className="stage-top">
            <a
              className={`icon-btn${done ? ' ready' : ''}`}
              href={done ? scene.url : undefined}
              download={done ? 'nature-craft.webp' : undefined}
              aria-disabled={!done}
              aria-label="Download scene"
              onClick={(e) => !done && e.preventDefault()}
            >
              <Download />
            </a>
          </div>

          <div
            className="canvas"
            ref={canvasRef}
            onPointerDown={() => setSelected(null)}
            style={{ ['--canvas-w' as string]: CANVAS_W, ['--canvas-h' as string]: CANVAS_H }}
          >
            {/* Placed stickers stay mounted under the result so "edit and
                regenerate" needs no extra bookkeeping. */}
            {!done && scene.status !== 'loading' &&
              placed.map((item) => (
                <PlacedSticker
                  key={item.uid}
                  item={item}
                  selected={selected === item.uid}
                  onSelect={() => setSelected(item.uid)}
                  onChange={(patch) => update(item.uid, patch)}
                  canvasEl={canvasRef.current}
                />
              ))}

            <AnimatePresence>
              {scene.status === 'loading' && (
                <motion.div
                  className="grain full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                />
              )}
            </AnimatePresence>

            {done && (
              <motion.img
                className="scene-img"
                src={scene.url}
                alt="Crafted scene"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              />
            )}
          </div>

          <div className="controls">
            <div className="select-style">
              <button
                className={`chip ${chosen ? 'chosen' : 'placeholder'}`}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((o) => !o)}
              >
                {chosen?.label ?? 'Select style'}
                <CaretDown />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    className="style-menu"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
                  >
                    {SCENE_STYLES.map((s) => (
                      <button
                        key={s.id}
                        aria-selected={s.id === styleId}
                        onClick={() => {
                          setStyleId(s.id)
                          setMenuOpen(false)
                        }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button className={`craft${canCraft ? ' enabled' : ''}`} disabled={!canCraft} onClick={craft}>
              Craft
              <ArrowUp />
            </button>
          </div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab${tab === 'sheet' ? ' active' : ''}`} onClick={() => setTab('sheet')}>
          Sticker sheet
        </button>
        <button className={`tab${tab === 'own' ? ' active' : ''}`} onClick={() => setTab('own')}>
          Own stickers
        </button>
      </div>

      <div className="panel">
        {tab === 'sheet' ? (
          <StickerSheet stickers={stickers} onDragStart={startDrag} />
        ) : custom.length || minting ? (
          <div className="own-filled">
            <StickerSheet
              stickers={custom}
              pending={minting ? 1 : 0}
              highlightId={justMinted}
              onDragStart={startDrag}
            />
            <div className="own-bar">
              <MintInput value={prompt} onChange={setPrompt} onSubmit={mint} busy={minting} />
            </div>
          </div>
        ) : (
          <div className="own">
            <MintInput value={prompt} onChange={setPrompt} onSubmit={mint} busy={minting} />
          </div>
        )}
      </div>

      {ghost && <img className="ghost" src={ghost.src} alt="" style={{ left: ghost.x, top: ghost.y }} />}
    </div>
  )
}

type MintProps = {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  busy: boolean
}

function MintInput({ value, onChange, onSubmit, busy }: MintProps) {
  const ready = value.trim().length > 0 && !busy
  return (
    <form
      className="own-empty"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
    >
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        // Belt-and-braces alongside the form's implicit submission.
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            if (ready) onSubmit()
          }
        }}
        placeholder="Create your own sticker"
        disabled={busy}
      />
      <button className={`submit${ready ? ' ready' : ''}`} type="submit" disabled={!ready} aria-label="Create sticker">
        <ArrowUp />
      </button>
    </form>
  )
}
