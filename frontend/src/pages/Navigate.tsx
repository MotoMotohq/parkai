import { useNavigate } from 'react-router-dom'
import { NavigationRoute } from '../components/NavigationRoute'
import { Button } from '../components/ui/Button'
import { TopBar } from '../components/ui/TopBar'
import { useTranslation } from '../i18n/LanguageContext'
import { useAppState } from '../state/AppState'

const DIRECTION_KEYS = [
  'navigate.directionRight',
  'navigate.directionLeft',
  'navigate.directionStraight',
  'navigate.directionRight',
]

export function Navigate() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { currentResult } = useAppState()

  if (!currentResult) {
    return (
      <div className="bg-bg flex min-h-screen flex-col">
        <TopBar back />
        <main className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
          <p className="text-muted">{t('navigate.noDestination')}</p>
          <Button className="w-auto px-8" onClick={() => navigate('/find')}>
            {t('home.findMyCar')}
          </Button>
        </main>
      </div>
    )
  }

  const loc = currentResult.best_match.location
  const distance = Math.round(8 + loc.row * 2 + 4)
  const direction = t(DIRECTION_KEYS[loc.row % DIRECTION_KEYS.length])

  return (
    <div className="bg-bg flex min-h-screen flex-col">
      <TopBar back title={`${loc.floor} · ${loc.parking_number}`} />
      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-16">
        <div className="animate-fade-in-scale w-full max-w-sm">
          <NavigationRoute parkingNumber={loc.parking_number} distanceMeters={distance} direction={direction} />
        </div>
      </main>
      <div className="mx-auto w-full max-w-sm px-6 pb-10">
        <Button size="lg" onClick={() => navigate('/result')}>
          {t('navigate.foundMyCar')}
        </Button>
      </div>
    </div>
  )
}
