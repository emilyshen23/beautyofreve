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
  const [typed, setTyped] = useState('')
  /* Bumped by the dice. The typing loop runs off its own local index, so
     without something in the dependency list to restart it, rolling a new
     idea changed a ref the loop had already read past and nothing happened. */
  const [roll, setRoll] = useState(0)
  const [listening, setListening] = useState(false)
  // Kept in a ref so the typing loop can advance without restarting itself.
  const ideaIndexRef = useRef(ideaIndex)
  const inputRef = useRef<HTMLInputElement>(null)
  const recRef = useRef<SpeechRecognitionLike | null>(null)

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

  /* The suggestion writes itself out a few characters at a time, holds, then
     clears and moves on — so the box always shows a fresh idea without the
     text ever snapping into place. It pauses the moment the child starts
     typing or speaking; changing the words under them would be maddening. */
  const idle = !value.trim() && !listening && !busy

  useEffect(() => {
    if (!idle) {
      setTyped('')
      return
    }

    let cancelled = false
    const timers: ReturnType<typeof setTimeout>[] = []
    const wait = (ms: number) => new Promise<void>((r) => timers.push(setTimeout(r, ms)))

    const run = async () => {
      let i = ideaIndexRef.current
      while (!cancelled) {
        const text = IDEAS[i]

        // Write it on in small bursts, which reads as typing rather than a
        // progress bar filling.
        for (let n = 0; n <= text.length && !cancelled; n += 1 + Math.floor(Math.random() * 3)) {
          setTyped(text.slice(0, Math.min(n, text.length)))
          await wait(38 + Math.random() * 34)
        }
        if (cancelled) return
        setTyped(text)

        await wait(3000)
        if (cancelled) return

        // Rub it out quickly before the next one arrives.
        for (let n = text.length; n >= 0 && !cancelled; n -= 3) {
          setTyped(text.slice(0, Math.max(n, 0)))
          await wait(14)
        }

        i = (i + 1) % IDEAS.length
        ideaIndexRef.current = i
        setIdeaIndex(i)
        await wait(160)
      }
    }

    run()
    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
    }
  }, [idle, roll])

  function shuffle() {
    cue('button')
    // Anywhere in the list except where we already are, so every roll visibly
    // lands on something new.
    const next = (ideaIndexRef.current + 1 + Math.floor(Math.random() * (IDEAS.length - 1))) % IDEAS.length
    ideaIndexRef.current = next
    setIdeaIndex(next)
    setTyped('')
    onChange('')
    setRoll((n) => n + 1)
  }

  function listen() {
    if (listening) {
      recRef.current?.stop()
      return
    }

    const Ctor =
      (window as unknown as Record<string, new () => SpeechRecognitionLike>).SpeechRecognition ??
      (window as unknown as Record<string, new () => SpeechRecognitionLike>).webkitSpeechRecognition
    if (!Ctor) return

    const rec = new Ctor()
    recRef.current = rec
    rec.lang = 'en-US'
    /* Interim results are the whole point: words land in the box as they're
       spoken, so a child can see they're being heard rather than waiting in
       silence and hoping. */
    rec.interimResults = true
    rec.continuous = false

    rec.onresult = (e: SpeechResultLike) => {
      let text = ''
      let final = false
      for (const r of Array.from(e.results ?? [])) {
        text += r[0]?.transcript ?? ''
        if (r.isFinal) final = true
      }
      if (text) onChange(text.trim())
      if (final) cue('done')
    }

    rec.onend = () => {
      setListening(false)
      recRef.current = null
    }
    rec.onerror = () => {
      setListening(false)
      recRef.current = null
    }

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
        <span>Dream up a new character</span>
      </h2>

      {listening && (
        <motion.div
          className="listening"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
        >
          <span className="wave" aria-hidden="true">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <i key={i} style={{ animationDelay: `${i * 0.09}s` }} />
            ))}
          </span>
          <span className="listening-text">
            {value.trim() ? value : 'I’m listening…'}
          </span>
        </motion.div>
      )}

      <div className="make-row">
        <div className="make-input">
          {/* A real placeholder can't be typed into, so the suggestion is
              rendered behind the field instead. */}
          {!value && (
            <span className="make-ghost">
              {listening ? 'Listening…' : typed}
            </span>
          )}

          <input
            ref={inputRef}
            value={value}
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

    </div>
  )
}

/* Minimal shapes for the Web Speech API, which TS doesn't ship types for. */
type SpeechResultLike = {
  results?: ArrayLike<{ isFinal?: boolean; 0?: { transcript?: string } }>
}
type SpeechRecognitionLike = {
  lang: string
  interimResults: boolean
  continuous: boolean
  stop: () => void
  onresult: (e: SpeechResultLike) => void
  onend: () => void
  onerror: () => void
  start: () => void
}
