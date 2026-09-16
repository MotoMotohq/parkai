import { Check, X } from 'lucide-react'

interface Props {
  label: string
  matched?: boolean
  variant?: 'row' | 'chip'
  delay?: number
}

export function LandmarkChip({ label, matched, variant = 'row', delay = 0 }: Props) {
  const unmatched = matched === false

  if (variant === 'chip') {
    return (
      <span
        style={{ animationDelay: `${delay}ms` }}
        className={`animate-fade-in inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] font-medium ${
          unmatched ? 'border-line text-muted/50' : 'border-accent/25 bg-accent/10 text-ink'
        }`}
      >
        {!unmatched && <span className="bg-gradient-ai h-1.5 w-1.5 rounded-full" />}
        {label}
      </span>
    )
  }

  return (
    <li
      style={{ animationDelay: `${delay}ms` }}
      className={`animate-fade-in flex items-center gap-3 text-[15px] ${unmatched ? 'text-muted/45' : 'text-ink'}`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
          unmatched ? 'bg-white/5' : 'bg-success/15'
        }`}
      >
        {unmatched ? (
          <X size={11} className="text-muted/60" strokeWidth={3} />
        ) : (
          <Check size={11} className="text-success" strokeWidth={3} />
        )}
      </span>
      {label}
    </li>
  )
}
