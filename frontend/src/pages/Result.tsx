import { Car, MoveRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { listParking, resolveAssetUrl } from '../api/client'
import type { ParkingLocation } from '../api/types'
import { LandmarkChecklist } from '../components/LandmarkChecklist'
import { ParkingMap } from '../components/ParkingMap'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { ProgressRing } from '../components/ui/ProgressRing'
import { TopBar } from '../components/ui/TopBar'
import { useTranslation } from '../i18n/LanguageContext'
import { useAppState } from '../state/AppState'

export function Result() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const isDemo = Boolean((location.state as { isDemo?: boolean } | null)?.isDemo)
  const { currentResult } = useAppState()
  const [allLocations, setAllLocations] = useState<ParkingLocation[]>([])

  useEffect(() => {
    listParking().then(setAllLocations).catch(() => {})
  }, [])

  if (!currentResult) {
    return (
      <div className="bg-bg flex min-h-screen flex-col">
        <TopBar back />
        <main className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
          <p className="text-muted">{t('result.noResult')}</p>
          <Button className="w-auto px-8" onClick={() => navigate('/find')}>
            {t('home.findMyCar')}
          </Button>
        </main>
      </div>
    )
  }

  const best = currentResult.best_match
  const loc = best.location
  const pct = Math.round(best.similarity * 100)
  const distanceBase = 8 + loc.row * 2
  const distance = Math.round(distanceBase + 4)
  const matchedOnly = currentResult.matched_landmarks.filter((lm) => lm.matched)

  return (
    <div className="bg-bg flex min-h-screen flex-col">
      <TopBar back />
      <main className="flex flex-1 justify-center px-5 pb-16 sm:px-10">
        <div className="w-full max-w-md space-y-10">
          {isDemo && (
            <div className="flex justify-center">
              <Badge tone="accent" dot>
                {t('result.demoScenario')}
              </Badge>
            </div>
          )}

          <div className="animate-fade-in-scale flex flex-col items-center text-center">
            <ProgressRing value={pct} size={216} strokeWidth={15} label={t('result.visualMatch')} />

            <Car className="text-accent mt-6" size={30} strokeWidth={2} />
            <p className="text-ink mt-3 text-4xl font-bold tracking-tight">{loc.parking_number}</p>
            <p className="text-muted mt-1 text-sm font-medium tracking-wide uppercase">
              {t('result.floor', { floor: loc.floor })}
            </p>

            <p className="text-ink mt-6 text-[15px]">{t('result.carIsHere')}</p>
            <p className="text-muted mt-1 text-sm">{t('result.approximately', { n: distance })}</p>

            <div className="mt-8 w-full space-y-3">
              <Button size="lg" icon={<MoveRight size={19} />} onClick={() => navigate('/navigate')}>
                {t('result.showWay')}
              </Button>
              <button
                onClick={() => navigate('/explain')}
                className="text-muted hover:text-ink w-full py-2 text-sm font-medium transition-colors"
              >
                {t('result.whyThisLocation')}
              </button>
            </div>
          </div>

          <div className="border-line bg-surface rounded-[22px] border p-6">
            <img
              src={resolveAssetUrl(loc.image_url)}
              alt={`Saved reference photo for ${loc.parking_number}`}
              className="mb-5 h-40 w-full rounded-2xl object-cover"
            />
            <p className="text-muted mb-4 text-xs font-semibold tracking-wide uppercase">
              {t('result.matchedFeatures')}
            </p>
            <LandmarkChecklist landmarks={matchedOnly} />
          </div>

          <div className="border-line bg-surface rounded-[22px] border p-6">
            <p className="text-muted mb-4 text-xs font-semibold tracking-wide uppercase">
              {t('result.searchResults', { n: currentResult.locations_analyzed })}
            </p>
            <div className="space-y-2.5">
              {currentResult.candidates.map((c, i) => {
                const isBest = c.location.id === loc.id
                const p = Math.round(c.similarity * 100)
                return (
                  <div key={c.location.id} className="flex items-center gap-3 text-sm">
                    <span className="text-muted w-4">{i + 1}</span>
                    <span className={`w-12 font-medium ${isBest ? 'text-ink' : 'text-muted'}`}>
                      {c.location.parking_number}
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                      <div
                        className={`h-full rounded-full ${isBest ? 'bg-gradient-ai' : 'bg-zinc-600'}`}
                        style={{ width: `${p}%` }}
                      />
                    </div>
                    <span className={`w-12 text-right tabular-nums ${isBest ? 'text-ink' : 'text-muted'}`}>
                      {p}%{isBest && ' ←'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {allLocations.length > 0 && (
            <div className="border-line bg-surface rounded-[22px] border p-6">
              <p className="text-muted mb-4 text-xs font-semibold tracking-wide uppercase">
                {t('result.map', { floor: loc.floor })}
              </p>
              <ParkingMap locations={allLocations} floor={loc.floor} highlightNumber={loc.parking_number} />
            </div>
          )}

          <Button variant="ghost" onClick={() => navigate('/')}>
            {t('result.backToHome')}
          </Button>
        </div>
      </main>
    </div>
  )
}
