import { Check } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface Props {
  steps: string[]
  active: boolean
  stepDurationMs?: number
}

export function AIProcessingList({ steps, active, stepDurationMs = 700 }: Props) {
  const [stepIndex, setStepIndex] = useState(0)
  const everActive = useRef(false)
  const wasActive = useRef(false)

  useEffect(() => {
    if (!active) return
    everActive.current = true
    setStepIndex(0)
    const timer = setInterval(() => {
      setStepIndex((i) => (i + 1 < steps.length ? i + 1 : i))
    }, stepDurationMs)
    return () => clearInterval(timer)
  }, [active, steps.length, stepDurationMs])

  useEffect(() => {
    if (wasActive.current && !active) setStepIndex(steps.length)
    wasActive.current = active
  }, [active, steps.length])

  if (!everActive.current) return null

  return (
    <div className="animate-fade-in space-y-4">
      {steps.map((step, i) => {
        const done = i < stepIndex
        const isCurrent = i === stepIndex && active
        return (
          <div key={step} className="flex items-center gap-3.5">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${
                done
                  ? 'border-success/30 bg-success/15'
                  : isCurrent
                    ? 'border-accent/40 bg-accent/15'
                    : 'border-line bg-transparent'
              }`}
            >
              {done ? (
                <Check size={13} className="text-success" strokeWidth={3} />
              ) : isCurrent ? (
                <span className="bg-gradient-ai animate-pulse-soft h-2 w-2 rounded-full" />
              ) : null}
            </span>
            <span
              className={`text-[15px] transition-colors duration-300 ${
                done || isCurrent ? 'text-ink' : 'text-muted/40'
              }`}
            >
              {step}
            </span>
          </div>
        )
      })}
    </div>
  )
}
