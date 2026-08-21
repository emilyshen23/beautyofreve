import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import StickerSheet from './components/StickerSheet'
import PlacedSticker from './components/PlacedSticker'
import {
  CaretDown, Download, DropHere, Paw, Star, Palette, Wand, SoundOn, SoundOff,
  Sun, Moon, Trash,
} from './components/icons'
import { cue, cueDrop, soundOn, toggleSound } from './lib/sound'
import { useChromeHeight } from './lib/useChromeHeight'
import Sparkles, { makeBurst, type Burst } from './components/Sparkles'
import MakeCharacter from './components/MakeCharacter'
import { flattenCanvas, CANVAS_W, CANVAS_H } from './lib/flatten'
import { SCENE_STYLES } from '../shared/scene.js'
import { BIOMES } from '../shared/biomes.js'
import { STICKERS } from '../shared/stickers.js'
import type { Placed, Sticker, SceneState } from './lib/types'

const DEFAULT_SIZE = 120
const uid = () => Math.random().toString(36).slice(2, 9)

/* A craft takes about a minute. Left as a bare gradient that reads as "stuck"
   to a child, so the wait narrates what is supposedly happening. */
const WORKING_CAPTIONS = [
  'Mixing the colors…',
  'Waking up your characters…',
  'Painting the sky…',
  'Adding the tiny details…',
  'Almost there…',
]

/* The 72 built-ins are committed static assets, so the sheet is available
   without a backend — that's what makes the static deploy worth anything.
   Only custom characters and bringing a scene to life need the server. */
const BUILT_IN: Sticker[] = STICKERS.map((s: Omit<Sticker, 'src'>) => ({
  ...s,
  src: `${import.meta.env.BASE_URL}stickers/${s.id}.webp`,
}))
const CHARACTERS = BUILT_IN.filter((s) => !s.magic)
const MAGIC = BUILT_IN.filter((s) => s.magic)

type Biome = { id: string; label: string; scene: string; sceneNight: string }
const BIOME_LIST: Biome[] = BIOMES
const biomeSrc = (id: string, night = false) =>
  `${import.meta.env.BASE_URL}biomes/${id}${night ? '-night' : ''}.webp`

export default function App() {
  useChromeHeight()

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
  const [night, setNight] = useState(false)

  const [prompt, setPrompt] = useState('')
  const [minting, setMinting] = useState(false)
  const [making, setMaking] = useState<string | null>(null)
  const [justMinted, setJustMinted] = useState<string | null>(null)

  const [sound, setSound] = useState(soundOn())
  const [caption, setCaption] = useState(0)
  const [bursts, setBursts] = useState<Burst[]>([])
  const [ghost, setGhost] = useState<{ src: string; x: number; y: number } | null>(null)
  const dragged = useRef<Sticker | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const clipboard = useRef<Placed | null>(null)

  /* Both plates for every backdrop are fetched and decoded up front. Without
     this the first switch to night shows a blank frame while the new file
     loads, which is what made toggling feel abrupt. */
  useEffect(() => {
    for (const b of BIOME_LIST) {
      for (const isNight of [false, true]) {
        const img = new Image()
        img.src = biomeSrc(b.id, isNight)
      }
    }
  }, [])

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
    cue('pickUp')
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

      const tone = sticker.magic
        ? 'magic'
        : sticker.mood === 'mischievous'
          ? 'mischief'
          : 'plain'
      cueDrop(tone)
      const burst = makeBurst(x + DEFAULT_SIZE / 2, y + DEFAULT_SIZE / 2, tone)
      setBursts((b) => [...b, burst])
      setTimeout(() => setBursts((b) => b.filter((x) => x.id !== burst.id)), 1000)
    }

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }, [])

  const update = useCallback((uidKey: string, patch: Partial<Placed>) => {
    setPlaced((p) => p.map((it) => (it.uid === uidKey ? { ...it, ...patch } : it)))
  }, [])

  /* Shared by the on-canvas toolbar and the keyboard shortcuts, so the two
     can't drift apart. Duplicates start unlocked or they'd land immovable. */
  const duplicate = useCallback((item: Placed) => {
    cue('duplicate')
    const copy = { ...item, uid: uid(), x: item.x + 26, y: item.y + 26, locked: false }
    setPlaced((p) => [...p, copy])
    setSelected(copy.uid)
  }, [])

  const remove = useCallback((uidKey: string) => {
    cue('remove')
    setPlaced((p) => p.filter((it) => it.uid !== uidKey))
    setSelected(null)
  }, [])

  // Advance the waiting caption while a craft is in flight.
  useEffect(() => {
    if (scene.status !== 'loading') return
    setCaption(0)
    const id = setInterval(
      () => setCaption((c) => Math.min(c + 1, WORKING_CAPTIONS.length - 1)),
      11000,
    )
    return () => clearInterval(id)
  }, [scene.status])

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
        duplicate(clipboard.current)
      } else if ((e.key === 'Backspace' || e.key === 'Delete') && item) {
        e.preventDefault()
        remove(item.uid)
      } else if (e.key === 'Escape') {
        setSelected(null)
        setMenuOpen(false)
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [placed, selected, duplicate, remove])

  async function mint() {
    const name = prompt.trim()
    if (!name || minting) return

    setMinting(true)
    setMaking(name)
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
      setMaking(null)
    }
  }

  async function craft() {
    if (!canCraft) return
    cue('bringToLife')
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
          setting: biome ? (night ? biome.sceneNight : biome.scene) : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      /* The result becomes the new backdrop and the stickers are cleared —
         they've been absorbed into the painting. Dropping more on top and
         crafting again continues from here. */
      cue('done')
      setBackground(data.image)
      setPlaced([])
      setScene({ status: 'idle' })
    } catch (err) {
      cue('failed')
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
  const backdrop = background ?? (biome ? biomeSrc(biome.id, night) : null)
  const hasSubject = placed.length > 0 || Boolean(background)
  const canCraft =
    apiOnline && Boolean(styleId) && hasSubject && scene.status !== 'loading'

  const craftHint = canCraft
    ? null
    : !apiOnline
      ? 'Needs the local server'
      : !hasSubject
        ? 'Drag a character up here'
        : !styleId
          ? 'Pick a style first'
          : null

  return (
    <div className="app">
      <header className="header">
        <strong>Reve</strong>
        <span className="muted">your home for storytelling</span>
      </header>

      <div className="stage">
        <div className="stage-inner">
          <div className="stage-top">
            <button
              className="icon-btn"
              disabled={!placed.length && !background && !biome}
              title="Start again"
              onClick={() => {
                cue('remove')
                setPlaced([])
                setSelected(null)
                setBackground(null)
                setBiome(null)
                setScene({ status: 'idle' })
              }}
            >
              <Trash />
            </button>

            <button
              className="icon-btn"
              aria-pressed={sound}
              title={sound ? 'Turn sounds off' : 'Turn sounds on'}
              onClick={() => setSound(toggleSound())}
            >
              {sound ? <SoundOn /> : <SoundOff />}
            </button>

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
            {/* Both plates stay mounted through the change, so day/night
                crossfades instead of cutting to an empty canvas and back. */}
            <AnimatePresence initial={false}>
              {backdrop && (
                <motion.img
                  key={backdrop}
                  className="scene-img"
                  src={backdrop}
                  alt={background ? 'Crafted scene' : (biome?.label ?? '')}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
                />
              )}
            </AnimatePresence>

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
                  onDuplicate={() => duplicate(item)}
                  onDelete={() => remove(item.uid)}
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
                >
                  <div className="working">
                    <motion.p
                      key={caption}
                      className="working-caption"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                    >
                      {WORKING_CAPTIONS[caption]}
                    </motion.p>
                    {placed.length ? (
                      <div className="working-cast" aria-hidden="true">
                        {placed.map((item, i) => (
                          <motion.img
                            key={item.uid}
                            src={item.src}
                            alt=""
                            animate={{ scale: [1, 1.45, 1], y: [0, -8, 0] }}
                            transition={{
                              duration: 1.1,
                              repeat: Infinity,
                              repeatDelay: Math.max(0, placed.length - 1) * 0.45,
                              delay: i * 0.45,
                              ease: 'easeInOut',
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="working-dots" aria-hidden="true">
                        <span /><span /><span />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {bursts.map((b) => <Sparkles key={b.id} burst={b} />)}

            {!backdrop && !placed.length && scene.status !== 'loading' && (
              <div className="canvas-empty">
                <DropHere />
                <span>Drag a character here to begin</span>
              </div>
            )}

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
                onClick={() => {
                  cue('setting')
                  setBiome((cur) => (cur?.id === b.id ? null : b))
                }}
              >
                <img src={biomeSrc(b.id, night)} alt={b.label} draggable={false} />
              </button>
            ))}

            <div className="time-toggle" role="group" aria-label="Time of day">
              <button
                className={night ? undefined : 'on'}
                title="Daytime"
                aria-pressed={!night}
                onClick={() => { cue('setting'); setNight(false) }}
              >
                <Sun />
              </button>
              <button
                className={night ? 'on' : undefined}
                title="Night-time"
                aria-pressed={night}
                onClick={() => { cue('setting'); setNight(true) }}
              >
                <Moon />
              </button>
            </div>
          </div>
          </div>

          <div className="controls-row">
            {craftHint && <span className="craft-hint">{craftHint}</span>}
            <div className="controls">
            <div className="select-style">
              <button
                className={`chip ${chosen ? 'chosen' : 'placeholder'}`}
                aria-expanded={menuOpen}
                onClick={() => {
                  cue('button')
                  setMenuOpen((o) => !o)
                }}
              >
                <Palette />
                {chosen?.label ?? 'Pick a style'}
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
                          cue('button')
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
              <Wand />
              Bring to life
            </button>
            </div>
          </div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab${tab === 'sheet' ? ' active' : ''}`} onClick={() => { cue('button'); setTab('sheet') }}>
          <Paw />
          Characters
        </button>
        <button className={`tab${tab === 'own' ? ' active' : ''}`} onClick={() => { cue('button'); setTab('own') }}>
          <Star />
          Mine
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
              <MakeCharacter
                value={prompt}
                onChange={setPrompt}
                onSubmit={mint}
                busy={minting}
                makingLabel={making}
              />
            </div>
          </div>
        ) : (
          <div className="own">
            <MakeCharacter
              value={prompt}
              onChange={setPrompt}
              onSubmit={mint}
              busy={minting}
              makingLabel={making}
            />
          </div>
        )}
      </div>

      {ghost && <img className="ghost" src={ghost.src} alt="" style={{ left: ghost.x, top: ghost.y }} />}
    </div>
  )
}
