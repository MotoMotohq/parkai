import { Info, Loader2, ScanSearch, Sparkles, SquarePlus } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { runDemo } from '../api/client'
import { Badge } from '../components/ui/Badge'
import { BottomNav } from '../components/ui/BottomNav'
import { Button } from '../components/ui/Button'
import { TopBar } from '../components/ui/TopBar'
import { FingerprintVisualizer } from '../components/FingerprintVisualizer'
import { useTranslation } from '../i18n/LanguageContext'
import { useAppState } from '../state/AppState'

export function Home() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { lastParking, setCurrentResult } = useAppState()
  const [demoLoading, setDemoLoading] = useState(false)
  const [demoError, setDemoError] = useState<string | null>(null)

  async function handleTryDemo() {
    setDemoLoading(true)
    setDemoError(null)
    try {
      const result = await runDemo()
      setCurrentResult(result)
      navigate('/result', { state: { isDemo: true } })
    } catch {
      setDemoError(t('home.demoError'))
    } finally {
      setDemoLoading(false)
    }
  }

  return (
    <div className="bg-bg flex min-h-screen flex-col">
      <TopBar
        right={
          <Link to="/analytics">
            <Badge tone="accent" dot>
              AI
            </Badge>
          </Link>
        }
      />

      <main className="flex flex-1 flex-col items-center justify-center px-5 py-6 sm:px-10">
        <div className="grid w-full max-w-5xl items-center gap-14 lg:grid-cols-2">
          <div className="animate-fade-in mx-auto w-full max-w-sm space-y-9 text-center lg:mx-0 lg:text-left">
            <h1 className="text-ink text-[2.6rem] leading-[1.05] font-bold tracking-tight sm:text-5xl">
              {t('home.title1')}
              <br />
              <span className="text-gradient">{t('home.title2')}</span>
            </h1>

            <div className="mx-auto max-w-[280px] lg:mx-0">
              <FingerprintVisualizer />
            </div>
          </div>

          <div className="mx-auto w-full max-w-sm space-y-8">
            <div className="space-y-3">
              <Button size="lg" icon={<SquarePlus size={20} />} onClick={() => navigate('/save')}>
                {t('home.saveMyCar')}
              </Button>
              <Button
                size="lg"
                variant="secondary"
                icon={<ScanSearch size={20} />}
                onClick={() => navigate('/find')}
              >
                {t('home.findMyCar')}
              </Button>
              <div className="flex items-center justify-center gap-1">
                <button
                  onClick={handleTryDemo}
                  disabled={demoLoading}
                  className="text-muted hover:text-ink flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-medium transition-colors disabled:opacity-60"
                >
                  {demoLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {demoLoading ? t('home.runningDemo') : t('home.tryDemo')}
                </button>
                <span className="text-line">·</span>
                <Link
                  to="/how-it-works"
                  className="text-muted hover:text-ink flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-medium transition-colors"
                >
                  <Info size={14} />
                  {t('home.howItWorks')}
                </Link>
              </div>
              {demoError && <p className="text-danger text-center text-xs">{demoError}</p>}
            </div>

            {lastParking && (
              <div className="animate-fade-in border-line bg-surface flex items-center justify-between rounded-[20px] border px-5 py-4">
                <div>
                  <p className="text-muted text-xs font-medium tracking-wide uppercase">{t('home.lastParking')}</p>
                  <p className="text-ink mt-1 text-base font-semibold">
                    {lastParking.floor} · {lastParking.parking_number}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-muted text-xs font-medium tracking-wide uppercase">{t('home.confidence')}</p>
                  <p className="text-success mt-1 text-base font-semibold">
                    {Math.round(lastParking.confidence * 100)}%
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
