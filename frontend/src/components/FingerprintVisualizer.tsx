import { useTranslation } from '../i18n/LanguageContext'

const DOTS = [
  { cx: 74, cy: 58, r: 3.5, delay: '0s', drift: 'animate-drift-a' },
  { cx: 258, cy: 44, r: 3, delay: '0.4s', drift: 'animate-drift-b' },
  { cx: 46, cy: 150, r: 3, delay: '0.9s', drift: 'animate-drift-b' },
  { cx: 284, cy: 168, r: 3.5, delay: '0.2s', drift: 'animate-drift-a' },
  { cx: 300, cy: 96, r: 2.5, delay: '1.3s', drift: 'animate-drift-a' },
  { cx: 100, cy: 190, r: 2.5, delay: '0.6s', drift: 'animate-drift-b' },
]

export function FingerprintVisualizer() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center">
      <div className="bg-grid-subtle relative w-full max-w-[360px] overflow-hidden rounded-[28px] border border-line bg-surface">
        <svg viewBox="0 0 340 240" className="h-[240px] w-full" aria-hidden="true">
          <defs>
            <linearGradient id="fp-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--color-accent)" />
              <stop offset="100%" stopColor="var(--color-accent-2)" />
            </linearGradient>
            <radialGradient id="fp-glow" cx="50%" cy="45%" r="60%">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.16" />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect width="340" height="240" fill="url(#fp-glow)" />

          {/* viewfinder corner brackets */}
          {[
            'M20,52 L20,22 L50,22',
            'M290,22 L320,22 L320,52',
            'M20,188 L20,218 L50,218',
            'M320,188 L320,218 L290,218',
          ].map((d) => (
            <path key={d} d={d} fill="none" stroke="var(--color-line)" strokeWidth="2.5" strokeLinecap="round" />
          ))}

          {/* landmark points */}
          {DOTS.map((d, i) => (
            <g key={i} className={`${d.drift} animate-pulse-soft`} style={{ animationDelay: d.delay, transformOrigin: `${d.cx}px ${d.cy}px` }}>
              <circle cx={d.cx} cy={d.cy} r={d.r + 5} fill="var(--color-accent)" opacity="0.12" />
              <circle cx={d.cx} cy={d.cy} r={d.r} fill="url(#fp-gradient)" />
            </g>
          ))}

          {/* faint connective lines toward the detected sign */}
          <g stroke="var(--color-accent)" strokeOpacity="0.25" strokeWidth="1" strokeDasharray="3 5">
            <line x1={74} y1={58} x2={155} y2={110} />
            <line x1={258} y1={44} x2={185} y2={110} />
            <line x1={284} y1={168} x2={190} y2={130} />
          </g>

          {/* detected sign chip */}
          <g transform="translate(140, 100)">
            <rect width="60" height="40" rx="10" fill="#fafafa" />
            <text x="30" y="26" textAnchor="middle" fontSize="18" fontWeight="700" fill="#111113">
              P
            </text>
          </g>
        </svg>
      </div>
      <p className="mt-4 text-xs font-semibold tracking-[0.2em] text-muted uppercase">
        {t('home.visualFingerprint')}
      </p>
    </div>
  )
}
