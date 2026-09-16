import type { ReactNode } from 'react'

type Tone = 'accent' | 'success' | 'warning' | 'danger' | 'neutral'

const tones: Record<Tone, string> = {
  accent: 'bg-accent/10 text-accent',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  neutral: 'bg-white/5 text-muted',
}

export function Badge({
  children,
  tone = 'neutral',
  dot,
  className = '',
}: {
  children: ReactNode
  tone?: Tone
  dot?: boolean
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide ${tones[tone]} ${className}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}
