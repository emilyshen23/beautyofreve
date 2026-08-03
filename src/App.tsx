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
      {STYLES.map((style, row) => (
        <Row key={style.id} style={style} row={row} cells={cells} onGenerate={generate} />
      ))}
    </main>
  )
}

type RowProps = {
  style: { id: string; label: string }
  row: number
  cells: Record<string, CellState>
  onGenerate: (subject: string, style: string) => void
}

function Row({ style, row, cells, onGenerate }: RowProps) {
  return (
    <>
      <motion.div
        className="tab"
        style={{ top: `calc(var(--cell) * ${row})` }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: row * 0.03, ease: [0.23, 1, 0.32, 1] }}
      >
        <span>{style.label}</span>
      </motion.div>

      {SUBJECTS.map((subject) => {
        const state = cells[cellKey(subject.id, style.id)]
        return (
          <button
            key={subject.id}
            type="button"
            className="cell"
            data-status={state?.status ?? 'idle'}
            aria-label={`${subject.label}, ${style.label} — click to generate`}
            onClick={() => onGenerate(subject.id, style.id)}
          >
            {state?.image && <img className="cell-img" src={state.image} alt="" />}
            <span className="cell-shimmer" aria-hidden="true" />
          </button>
        )
      })}
    </>
  )
}
