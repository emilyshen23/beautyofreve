import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUp, Wand, Dice, Mic } from './icons'
import { cue } from '../lib/sound'

/**
 * A blank text box is the most demanding thing you can put in front of a
 * five-year-old: an empty field, a cursor, and a spelling test. Everything
 * here exists so a child can succeed *without typing a single letter* —
 * shuffle an idea, tap word tiles, or speak.
 */

const IDEAS = [
  'a sleepy dragon who loves cake',
  'a tiny robot made of flowers',
  'a purple cat with butterfly wings',
  'a shy cloud that hums',
  'a brave snail knight',
  'a rainbow fish with a top hat',
  'a fluffy dinosaur who paints',
  'a wise old turtle with glasses',
  'a bouncing jellybean monster',
  'a star that fell asleep',
]

/* Tap one from each row and you have a sentence. Zero typing, and it quietly
   teaches the shape of a good prompt. */
const TILES = [
  ['a sleepy', 'a tiny', 'a rainbow', 'a giant', 'a silly'],
  ['dragon', 'turtle', 'robot', 'kitten', 'monster'],
  ['wearing a hat', 'made of candy', 'with big wings', 'covered in stars'],
]

type Props = {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  busy: boolean
  /** Echoed back while the sticker is being made. */
  makingLabel?: string | null
}

export default function MakeCharacter({ value, onChange, onSubmit, busy, makingLabel }: Props) {
  const [ideaIndex, setIdeaIndex] = useState(() => Math.floor(Math.random() * IDEAS.length))
  const [picked, setPicked] = useState<(string | null)[]>([null, null, null])
  const [listening, setListening] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  /* The box is never empty: an idea is always sitting in it as a placeholder,
     ready to send. Once the child types, their words take over. */
  const idea = IDEAS[ideaIndex]

  const speechSupported = useMemo(
    () =>
      typeof window !== 'undefined' &&
      Boolean(
        (window as unknown as Record<string, unknown>).SpeechRecognition ??
          (window as unknown as Record<string, unknown>).webkitSpeechRecognition,
      ),
    [],
  )

  useEffect(() => {
    // Tiles compose into the box as they're tapped.
    const phrase = picked.filter(Boolean).join(' ')
    if (phrase) onChange(phrase)
    // onChange is stable enough here; re-running on it would fight typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picked])

  function shuffle() {
    cue('button')
    setIdeaIndex((i) => (i + 1 + Math.floor(Math.random() * (IDEAS.length - 1))) % IDEAS.length)
    setPicked([null, null, null])
    onChange('')
  }

  function tapTile(row: number, word: string) {
    cue('button')
    setPicked((p) => p.map((cur, i) => (i === row ? (cur === word ? null : word) : cur)))
  }

  function listen() {
    const Ctor =
      (window as unknown as Record<string, new () => SpeechRecognitionLike>).SpeechRecognition ??
      (window as unknown as Record<string, new () => SpeechRecognitionLike>).webkitSpeechRecognition
    if (!Ctor) return

    const rec = new Ctor()
    rec.lang = 'en-US'
    rec.interimResults = false
    rec.onresult = (e: SpeechResultLike) => {
      const said = e.results?.[0]?.[0]?.transcript
      if (said) {
        onChange(said)
        cue('done')
      }
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    setListening(true)
    cue('button')
    rec.start()
  }

  function send() {
    if (busy) return
    if (!value.trim()) onChange(idea)
    onSubmit()
  }

  if (busy) {
    return (
      <div className="make busy">
        <motion.div
          className="make-title"
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Wand />
          <span>Making… {makingLabel}</span>
        </motion.div>
        <p className="make-sub">This takes a moment. Something good is coming.</p>
      </div>
    )
  }

  return (
    <div className="make">
      <h2 className="make-title">
        <Wand />
        <span>Dream up a new character</span>
      </h2>

      <div className="make-row">
        <div className="make-input">
          <input
            ref={inputRef}
            value={value}
            placeholder={listening ? 'Listening…' : idea}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                send()
              }
            }}
          />
        </div>

        {/* Pulled out of the input and given their own weight: shuffling an
            idea and speaking one are the two ways to skip typing entirely. */}
        <button className="make-tool" title="Another idea" onClick={shuffle}>
          <Dice />
        </button>

        {speechSupported && (
          <button
            className={`make-tool${listening ? ' on' : ''}`}
            title="Say it out loud"
            onClick={listen}
          >
            <Mic />
          </button>
        )}

        <button className="make-go" title="Make it" onClick={send}>
          <ArrowUp />
        </button>
      </div>

      <div className="make-tiles">
        {TILES.map((row, i) => (
          <div key={i} className="make-tile-row">
            {row.map((word) => (
              <button
                key={word}
                className={`tile${picked[i] === word ? ' on' : ''}`}
                onClick={() => tapTile(i, word)}
              >
                {word}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/* Minimal shapes for the Web Speech API, which TS doesn't ship types for. */
type SpeechResultLike = { results?: Array<Array<{ transcript?: string }>> }
type SpeechRecognitionLike = {
  lang: string
  interimResults: boolean
  onresult: (e: SpeechResultLike) => void
  onend: () => void
  onerror: () => void
  start: () => void
}
