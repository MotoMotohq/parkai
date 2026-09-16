import { Car, ChevronDown } from 'lucide-react'
import { useTranslation } from '../i18n/LanguageContext'

interface Props {
  parkingNumber: string
  distanceMeters: number
  direction: string
}

export function NavigationRoute({ parkingNumber, distanceMeters, direction }: Props) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-col items-center gap-2">
        <span className="text-muted text-xs font-semibold tracking-[0.15em] uppercase">
          {t('navigate.yourLocation')}
        </span>
        <span className="relative flex h-4 w-4 items-center justify-center">
          <span className="bg-accent animate-pulse-ring absolute h-3 w-3 rounded-full" />
          <span className="bg-accent relative h-3 w-3 rounded-full" />
        </span>
      </div>

      <svg width="2" height="96" className="my-1" aria-hidden="true">
        <line
          x1="1"
          y1="0"
          x2="1"
          y2="96"
          stroke="var(--color-accent)"
          strokeWidth="2"
          strokeDasharray="6 6"
          strokeLinecap="round"
          className="animate-dash-flow"
          opacity="0.6"
        />
      </svg>

      <span className="text-muted mb-1 text-xs font-medium">{t('navigate.metersShort', { n: distanceMeters })}</span>
      <ChevronDown size={18} className="text-accent mb-2" />

      <div className="relative">
        <div className="bg-gradient-ai animate-pulse-ring absolute inset-0 rounded-[20px] opacity-40" />
        <div className="bg-gradient-ai relative flex w-40 flex-col items-center gap-1.5 rounded-[20px] px-6 py-5 shadow-[0_12px_32px_-10px_rgba(99,102,241,0.7)]">
          <Car className="text-white" size={26} strokeWidth={2.2} />
          <span className="text-lg font-bold tracking-tight text-white">{parkingNumber}</span>
        </div>
      </div>

      <div className="border-line bg-surface-2 mt-7 inline-flex items-center gap-2 rounded-full border px-4 py-2.5">
        <span className="text-ink text-sm font-semibold tracking-wide uppercase">{direction}</span>
      </div>

      <p className="text-ink mt-5 text-3xl font-bold tracking-tight tabular-nums">
        {t('navigate.meters', { n: distanceMeters })}
      </p>
    </div>
  )
}
