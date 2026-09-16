import { ArrowLeftRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { resolveAssetUrl } from '../api/client'
import { LandmarkChecklist } from '../components/LandmarkChecklist'
import { ScanningPhoto } from '../components/ScanningPhoto'
import { Button } from '../components/ui/Button'
import { TopBar } from '../components/ui/TopBar'
import { useTranslation } from '../i18n/LanguageContext'
import { useAppState } from '../state/AppState'

export function Explain() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { currentResult } = useAppState()

  if (!currentResult) {
    return (
      <div className="bg-bg flex min-h-screen flex-col">
        <TopBar back />
        <main className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
          <p className="text-muted">{t('explain.noResult')}</p>
          <Button className="w-auto px-8" onClick={() => navigate('/find')}>
            {t('home.findMyCar')}
          </Button>
        </main>
      </div>
    )
  }

  const loc = currentResult.best_match.location
  const pct = Math.round(currentResult.best_match.similarity * 100)
  const matchedCount = currentResult.matched_landmarks.filter((lm) => lm.matched).length
  const total = currentResult.matched_landmarks.length

  return (
    <div className="bg-bg flex min-h-screen flex-col">
      <TopBar back />
      <main className="flex flex-1 justify-center px-5 pb-16 sm:px-10">
        <div className="w-full max-w-md space-y-8">
          <div className="animate-fade-in space-y-1.5 text-center">
            <h1 className="text-ink text-[1.75rem] font-bold tracking-tight">
              {t('explain.why', { number: loc.parking_number })}
            </h1>
            <p className="text-gradient text-sm font-semibold">{t('explain.visualMatchPct', { pct })}</p>
          </div>

          <div className="relative grid grid-cols-2 gap-3">
            <div>
              <p className="text-muted mb-2 text-center text-[11px] font-semibold tracking-wide uppercase">
                {t('explain.yourPhoto')}
              </p>
              <ScanningPhoto
                src={resolveAssetUrl(currentResult.query_image_url)}
                landmarks={currentResult.matched_landmarks}
                revealLandmarks
                aspect="aspect-square"
              />
            </div>
            <div>
              <p className="text-muted mb-2 text-center text-[11px] font-semibold tracking-wide uppercase">
                {t('explain.match')}
              </p>
              <ScanningPhoto
                src={resolveAssetUrl(loc.image_url)}
                landmarks={currentResult.matched_landmarks}
                revealLandmarks
                aspect="aspect-square"
              />
            </div>
            <div className="border-line bg-surface-2 text-accent pointer-events-none absolute top-1/2 left-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border">
              <ArrowLeftRight size={15} />
            </div>
          </div>

          <div className="border-line bg-surface rounded-[22px] border p-6">
            <p className="text-muted mb-4 text-xs font-semibold tracking-wide uppercase">
              {t('explain.matchedFeatures')}
            </p>
            <LandmarkChecklist landmarks={currentResult.matched_landmarks} />
            <p className="text-ink mt-6 text-center text-sm font-semibold">
              {t('explain.matchedCount', { matched: matchedCount, total })}
            </p>
          </div>

          <Button variant="secondary" onClick={() => navigate('/result')}>
            {t('explain.backToResult')}
          </Button>
        </div>
      </main>
    </div>
  )
}
