import { useEffect, useState } from 'react'
import type { Candidate } from '../api/types'

interface Props {
  candidates: Candidate[]
  bestId: string
  active: boolean
  stepMs?: number
}

export function RankingReveal({ candidates, bestId, active, stepMs = 380 }: Props) {
  const [revealedCount, setRevealedCount] = useState(0)

  useEffect(() => {
    if (!active) return
    setRevealedCount(0)
    let count = 0
    const timer = setInterval(() => {
      count += 1
      setRevealedCount(count)
      if (count >= candidates.length) clearInterval(timer)
    }, stepMs)
    return () => clearInterval(timer)
  }, [active, candidates.length, stepMs])

  return (
    <div className="space-y-2.5">
      {candidates.map((c, i) => {
        const reverseIndex = candidates.length - 1 - i
        const visible = reverseIndex < revealedCount
        const isBest = c.location.id === bestId
        const pct = Math.round(c.similarity * 100)
        return (
          <div
            key={c.location.id}
            className={`flex items-center gap-3 text-sm transition-all duration-500 ${
              visible ? 'translate-y-0 opacity-100' : 'translate-y-1.5 opacity-0'
            }`}
          >
            <span
              className={`w-14 font-semibold tabular-nums ${isBest && visible ? 'text-ink' : 'text-muted'}`}
            >
              {c.location.parking_number}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  isBest ? 'bg-gradient-ai' : 'bg-zinc-600'
                }`}
                style={{ width: visible ? `${pct}%` : '0%' }}
              />
            </div>
            <span
              className={`w-14 text-right tabular-nums transition-opacity duration-500 ${
                visible ? 'opacity-100' : 'opacity-0'
              } ${isBest ? 'text-ink font-semibold' : 'text-muted'}`}
            >
              {pct}%{isBest && visible ? ' ←' : ''}
            </span>
          </div>
        )
      })}
    </div>
  )
}
