import { Camera, Fingerprint, MapPin, ScanEye, ScanSearch } from 'lucide-react'
import type { ComponentType } from 'react'
import { TopBar } from '../components/ui/TopBar'
import { useTranslation } from '../i18n/LanguageContext'

const STEP_ICONS: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>[] = [
  Camera,
  ScanEye,
  Fingerprint,
  ScanSearch,
  MapPin,
]

export function HowItWorks() {
  const { t } = useTranslation()

  const steps = [1, 2, 3, 4, 5].map((n) => ({
    icon: STEP_ICONS[n - 1],
    title: t(`howItWorks.step${n}Title`),
    body: t(`howItWorks.step${n}Body`),
  }))

  return (
    <div className="bg-bg flex min-h-screen flex-col">
      <TopBar back title={t('howItWorks.topTitle')} />
      <main className="flex flex-1 justify-center px-5 pb-16 sm:px-10">
        <div className="w-full max-w-md">
          <div className="animate-fade-in mb-10 space-y-2 text-center">
            <h1 className="text-ink text-[1.75rem] font-bold tracking-tight">{t('howItWorks.title')}</h1>
            <p className="text-muted text-[15px]">{t('howItWorks.subtitle')}</p>
          </div>

          <div className="animate-fade-in relative space-y-2">
            <div className="bg-line absolute top-6 bottom-6 left-[23px] w-px" aria-hidden="true" />
            {steps.map((step, i) => (
              <div key={step.title} className="relative flex gap-5 py-4">
                <div className="bg-surface-2 border-line relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border">
                  <step.icon size={20} className="text-accent" strokeWidth={2} />
                </div>
                <div className="pt-1.5">
                  <p className="text-muted text-xs font-semibold tracking-wide uppercase">
                    {t('howItWorks.step', { n: i + 1 })}
                  </p>
                  <p className="text-ink mt-0.5 text-[15px] font-semibold">{step.title}</p>
                  <p className="text-muted mt-1 text-sm leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-line bg-surface mt-10 space-y-4 rounded-[22px] border p-6">
            <p className="text-muted text-xs font-semibold tracking-wide uppercase">{t('howItWorks.goodToKnow')}</p>
            <QA q={t('howItWorks.qa1Q')} a={t('howItWorks.qa1A')} />
            <QA q={t('howItWorks.qa2Q')} a={t('howItWorks.qa2A')} />
            <QA q={t('howItWorks.qa3Q')} a={t('howItWorks.qa3A')} />
          </div>
        </div>
      </main>
    </div>
  )
}

function QA({ q, a }: { q: string; a: string }) {
  return (
    <div>
      <p className="text-ink text-sm font-medium">{q}</p>
      <p className="text-muted mt-1 text-sm leading-relaxed">{a}</p>
    </div>
  )
}
