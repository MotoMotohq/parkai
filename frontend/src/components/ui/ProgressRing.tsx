import { useEffect, useState } from 'react'

interface Props {
  value: number // 0-100
  size?: number
  strokeWidth?: number
  label?: string
  durationMs?: number
}

export function ProgressRing({ value, size = 200, strokeWidth = 14, label, durationMs = 1100 }: Props) {
  const [display, setDisplay] = useState(0)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  useEffect(() => {
    const start = performance.now()
    const target = Math.max(0, Math.min(100, value))
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(eased * target))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, durationMs])

  const offset = circumference * (1 - display / 100)

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-accent)" />
            <stop offset="100%" stopColor="var(--color-accent-2)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-line)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#ring-gradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.15s linear' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-[2.6rem] font-bold leading-none tracking-tight text-ink tabular-nums">
          {display}%
        </span>
        {label && <span className="mt-1.5 text-xs font-semibold uppercase tracking-wider text-muted">{label}</span>}
      </div>
    </div>
  )
}
