import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import StickerSheet from './components/StickerSheet'
import PlacedSticker from './components/PlacedSticker'
import { CaretDown, ArrowUp, Download } from './components/icons'
import { flattenCanvas, CANVAS_W, CANVAS_H } from './lib/flatten'
import { SCENE_STYLES } from '../shared/scene.js'
import { BIOMES } from '../shared/biomes.js'
import { STICKERS } from '../shared/stickers.js'
import type { Placed, Sticker, SceneState } from './lib/types'

const DEFAULT_SIZE = 120
const uid = () => Math.random().toString(36).slice(2, 9)

/* The 72 built-ins are committed static assets, so the sheet is available
   without a backend — that's what makes the static deploy worth anything.
   Only custom characters and bringing a scene to life need the server. */
const BUILT_IN: Sticker[] = STICKERS.map((s: Omit<Sticker, 'src'>) => ({
  ...s,
  src: `${import.meta.env.BASE_URL}stickers/${s.id}.webp`,
}))
const CHARACTERS = BUILT_IN.filter((s) => !s.magic)
const MAGIC = BUILT_IN.filter((s) => s.magic)

type Biome = { id: string; label: string; scene: string }
const BIOME_LIST: Biome[] = BIOMES
const biomeSrc = (id: string) => `${import.meta.env.BASE_URL}biomes/${id}.webp`

export default function App() {
  const [stickers] = useState<Sticker[]>(CHARACTERS)
  const [custom, setCustom] = useState<Sticker[]>([])
  const [apiOnline, setApiOnline] = useState(false)
  const [tab, setTab] = useState<'sheet' | 'own'>('sheet')

  const [placed, setPlaced] = useState<Placed[]>([])
  const [selected, setSelected] = useState<string | null>(null)

  const [styleId, setStyleId] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scene, setScene] = useState<SceneState>({ status: 'idle' })
  /** The last crafted image, kept as the canvas backdrop so work can continue. */
  const [background, setBackground] = useState<string | null>(null)
  const [biome, setBiome] = useState<Biome | null>(null)

  const [prompt, setPrompt] = useState('')
  const [minting, setMinting] = useState(false)
  const [justMinted, setJustMinted] = useState<string | null>(null)

  const [ghost, setGhost] = useState<{ src: string; x: number; y: number } | null>(null)
  const dragged = useRef<Sticker | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const clipboard = useRef<Placed | null>(null)

  useEffect(() => {
    fetch('/api/stickers')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('no backend'))))
      .then((d) => {
        setCustom(d.custom ?? [])
        setApiOnline(true)
      })
      .catch(() => setApiOnline(false))
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
        // The duplicate starts unlocked, or it would land immovable.
        const copy = {
          ...clipboard.current,
          uid: uid(),
          x: clipboard.current.x + 24,
          y: clipboard.current.y + 24,
          locked: false,
        }
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
    if (!canCraft) return
    setScene({ status: 'loading' })
    setSelected(null)
    try {
      const reference = await flattenCanvas(placed, backdrop)
      const res = await fetch('/api/craft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          styleId,
          reference,
          names: [...new Set(placed.map((p) => p.name))],
          mode: craftMode,
          setting: biome?.scene,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      /* The result becomes the new backdrop and the stickers are cleared —
         they've been absorbed into the painting. Dropping more on top and
         crafting again continues from here. */
      setBackground(data.image)
      setPlaced([])
      setScene({ status: 'idle' })
    } catch (err) {
      setScene({ status: 'error', message: (err as Error).message })
    }
  }

  async function downloadPng() {
    if (!background) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = background
    await new Promise((res, rej) => {
      img.onload = res
      img.onerror = rej
    })

    // Scenes are stored as WebP; re-encode so the download is a real PNG.
    const c = document.createElement('canvas')
    c.width = img.naturalWidth
    c.height = img.naturalHeight
    c.getContext('2d')?.drawImage(img, 0, 0)

    const blob = await new Promise<Blob | null>((res) => c.toBlob(res, 'image/png'))
    if (!blob) return

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'nature-craft.png'
    a.click()
    URL.revokeObjectURL(url)
  }

  const chosen = SCENE_STYLES.find((s) => s.id === styleId)

  /* With a scene already on the canvas and no new stickers, Craft restyles it
     — otherwise picking a different style after a craft would do nothing. */
  const craftMode = background ? (placed.length ? 'add' : 'restyle') : 'compose'
  /* What is actually showing behind the stickers: a finished scene once one
     exists, otherwise the chosen biome plate. */
  const backdrop = background ?? (biome ? biomeSrc(biome.id) : null)
  const hasSubject = placed.length > 0 || Boolean(background)
  const canCraft =
    apiOnline && Boolean(styleId) && hasSubject && scene.status !== 'loading'

  const craftHint = canCraft
    ? null
    : !apiOnline
      ? 'Bringing scenes to life needs the local server'
      : !hasSubject
        ? 'Bring a character to the story'
        : !styleId
          ? 'Pick a style first'
          : null

  return (
    <div className="app">
      <header className="header">
        <span>Reve</span>
        <span className="muted">your home for storytelling</span>
      </header>

      <div className="stage">
        <div className="stage-inner">
          <div className="stage-top">
            <button
              className={`icon-btn${background ? ' ready' : ''}`}
              disabled={!background}
              aria-label="Download scene as PNG"
              title={background ? 'Download as PNG' : undefined}
              onClick={downloadPng}
            >
              <Download />
            </button>
          </div>

          <div className="stage-body">
          <div
            className="canvas"
            ref={canvasRef}
            onPointerDown={() => setSelected(null)}
            style={{ ['--canvas-w' as string]: CANVAS_W, ['--canvas-h' as string]: CANVAS_H }}
          >
            {backdrop && (
              <motion.img
                key={backdrop}
                className="scene-img"
                src={backdrop}
                alt={background ? 'Crafted scene' : (biome?.label ?? '')}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
              />
            )}

            {/* Stickers sit on top of any crafted backdrop, so more can be
                added and the whole thing crafted again. */}
            {scene.status !== 'loading' &&
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

            {scene.status === 'error' && <p className="canvas-note">{scene.message}</p>}
          </div>

          {/* Switching biomes just swaps the plate behind the stickers. They
              won't match it, and that's fine — Bring it to life is what fuses
              backdrop and cast into one painting. */}
          <div className="biomes" role="group" aria-label="Story setting">
            {BIOME_LIST.map((b) => (
              <button
                key={b.id}
                className={`biome${biome?.id === b.id ? ' on' : ''}`}
                aria-pressed={biome?.id === b.id}
                title={b.label}
                onClick={() => setBiome((cur) => (cur?.id === b.id ? null : b))}
              >
                <img src={biomeSrc(b.id)} alt={b.label} draggable={false} />
              </button>
            ))}
          </div>
          </div>

          <div className="controls-row">
            {craftHint && <span className="craft-hint">{craftHint}</span>}
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

            <button
              className={`craft${canCraft ? ' enabled' : ''}`}
              disabled={!canCraft}
              onClick={craft}
              title={craftHint ?? undefined}
            >
              Bring it to life
              <ArrowUp />
            </button>
            </div>
          </div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab${tab === 'sheet' ? ' active' : ''}`} onClick={() => setTab('sheet')}>
          Character sheet
        </button>
        <button className={`tab${tab === 'own' ? ' active' : ''}`} onClick={() => setTab('own')}>
          Your characters
        </button>
      </div>

      <div className="panel">
        {tab === 'sheet' ? (
          <StickerSheet stickers={stickers} magic={MAGIC} onDragStart={startDrag} />
        ) : !apiOnline ? (
          <div className="own">
            <p className="own-note">
              Making characters needs the local server. Run <code>npm run dev</code> to create your own.
            </p>
          </div>
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
        placeholder="Create your own character"
        disabled={busy}
      />
      <button className={`submit${ready ? ' ready' : ''}`} type="submit" disabled={!ready} aria-label="Create character">
        <ArrowUp />
      </button>
    </form>
  )
}
