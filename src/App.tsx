import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { SUBJECTS, STYLES, cellKey } from '../shared/grid.js'

type CellState = { image: string | null; status: 'idle' | 'loading' | 'error' }

export default function App() {
  const [cells, setCells] = useState<Record<string, CellState>>({})

  useEffect(() => {
    fetch('/api/manifest')
      .then((r) => r.json())
      .then((manifest: Record<string, { image: string }>) => {
        setCells(
          Object.fromEntries(
            Object.entries(manifest).map(([key, v]) => [key, { image: v.image, status: 'idle' }]),
          ),
        )
      })
      .catch(() => {})
  }, [])

  async function generate(subject: string, style: string) {
    const key = cellKey(subject, style)
    if (cells[key]?.status === 'loading') return

    setCells((prev) => ({ ...prev, [key]: { image: prev[key]?.image ?? null, status: 'loading' } }))
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, style }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCells((prev) => ({ ...prev, [key]: { image: data.image, status: 'idle' } }))
    } catch {
      setCells((prev) => ({ ...prev, [key]: { image: prev[key]?.image ?? null, status: 'error' } }))
    }
  }

  return (
    <main className="plate">
      <div className="corner" />

      {STYLES.map((style, i) => (
        <Tab key={style.id} className="tab-col" label={style.label} index={i} />
      ))}

      {SUBJECTS.map((subject, i) => (
        <Row key={subject.id} subject={subject} index={i} cells={cells} onGenerate={generate} />
      ))}
    </main>
  )
}

function Tab({ className, label, index }: { className: string; label: string; index: number }) {
  return (
    <motion.div
      className={`tab ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: index * 0.014, ease: [0.23, 1, 0.32, 1] }}
    >
      <span>{label}</span>
    </motion.div>
  )
}

type RowProps = {
  subject: { id: string; label: string }
  index: number
  cells: Record<string, CellState>
  onGenerate: (subject: string, style: string) => void
}

function Row({ subject, index, cells, onGenerate }: RowProps) {
  return (
    <>
      <Tab className="tab-row" label={subject.label} index={index} />

      {STYLES.map((style) => {
        const state = cells[cellKey(subject.id, style.id)]
        return (
          <button
            key={style.id}
            type="button"
            className="cell"
            data-status={state?.status ?? 'idle'}
            aria-label={`${subject.label}, ${style.label} — click to generate`}
            onClick={() => onGenerate(subject.id, style.id)}
          >
            {state?.image && <img className="cell-img" src={state.image} alt="" loading="lazy" />}
            <span className="cell-shimmer" aria-hidden="true" />
          </button>
        )
      })}
    </>
  )
}
