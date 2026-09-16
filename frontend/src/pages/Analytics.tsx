import { Check, Loader2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getAnalytics, runAiTest } from '../api/client'
import type { Analytics as AnalyticsType, TestCaseResult } from '../api/types'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { TopBar } from '../components/ui/TopBar'
import { useTranslation } from '../i18n/LanguageContext'

export function Analytics() {
  const { t } = useTranslation()
  const [analytics, setAnalytics] = useState<AnalyticsType | null>(null)
  const [results, setResults] = useState<TestCaseResult[] | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getAnalytics().then(setAnalytics).catch(() => {})
  }, [])

  async function handleRunTest() {
    setRunning(true)
    setError(null)
    try {
      const data = await runAiTest()
      setAnalytics(data.analytics)
      setResults(data.results)
    } catch {
      setError(t('analytics.testFailed'))
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="bg-bg flex min-h-screen flex-col">
      <TopBar back title={t('analytics.title')} />
      <main className="flex flex-1 justify-center px-5 pb-16 sm:px-10">
        <div className="w-full max-w-lg space-y-7">
          <div className="animate-fade-in space-y-2 text-center">
            <h1 className="text-ink text-[1.75rem] font-bold tracking-tight">{t('analytics.title')}</h1>
            {analytics?.is_demo_benchmark && <Badge tone="neutral">{t('analytics.demoBenchmark')}</Badge>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Stat label={t('analytics.parkingLocations')} value={analytics?.total_locations ?? '—'} />
            <Stat
              label={t('analytics.top1Accuracy')}
              value={analytics ? `${Math.round(analytics.top1_accuracy * 100)}%` : '—'}
              accent
            />
            <Stat
              label={t('analytics.avgSearch')}
              value={
                analytics && analytics.average_search_time_ms > 0
                  ? `${(analytics.average_search_time_ms / 1000).toFixed(2)}s`
                  : '—'
              }
            />
            <Stat
              label={t('analytics.correctMatches')}
              value={analytics ? `${analytics.correct_matches}/${analytics.total_test_images}` : '—'}
            />
          </div>

          <Button
            onClick={handleRunTest}
            disabled={running}
            icon={running ? <Loader2 size={16} className="animate-spin" /> : undefined}
          >
            {running ? t('analytics.runningTest') : t('analytics.runTest')}
          </Button>
          {error && <p className="text-danger text-center text-sm">{error}</p>}

          {results && (
            <div className="animate-fade-in space-y-6">
              <Card>
                <p className="text-muted mb-5 text-xs font-semibold tracking-wide uppercase">
                  {t('analytics.similarity')}
                </p>
                <SimilarityChart results={results} />
              </Card>

              <Card>
                <p className="text-muted mb-4 text-xs font-semibold tracking-wide uppercase">
                  {t('analytics.testResults')}
                </p>
                <div className="space-y-2.5">
                  {results.map((r) => (
                    <div key={r.test_id} className="flex items-center gap-3 text-sm">
                      {r.correct ? (
                        <Check size={15} className="text-success shrink-0" strokeWidth={2.5} />
                      ) : (
                        <X size={15} className="text-danger shrink-0" strokeWidth={2.5} />
                      )}
                      <span className="text-muted w-20 font-mono text-xs">{r.test_id}</span>
                      <span className="text-ink w-16">{r.predicted_location}</span>
                      {!r.correct && (
                        <span className="text-muted/70 text-xs">
                          {t('analytics.expected', { location: r.expected_location })}
                        </span>
                      )}
                      <span className="text-muted ml-auto tabular-nums">{Math.round(r.similarity * 100)}%</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function SimilarityChart({ results }: { results: TestCaseResult[] }) {
  return (
    <div className="flex h-32 gap-1.5">
      {results.map((r) => {
        const pct = Math.round(r.similarity * 100)
        return (
          <div key={r.test_id} className="group relative h-full flex-1">
            <div
              className={`absolute right-0 bottom-0 left-0 rounded-t-md transition-all ${r.correct ? 'bg-gradient-ai' : 'bg-danger/60'}`}
              style={{ height: `${Math.max(pct, 4)}%` }}
            />
            <span className="text-ink border-line bg-surface-2 pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-md border px-2 py-1 text-[10px] whitespace-nowrap opacity-0 transition-opacity group-hover:opacity-100">
              {r.test_id} · {pct}%
            </span>
          </div>
        )
      })}
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <Card padding="sm" className="text-center">
      <p className={`text-2xl font-bold ${accent ? 'text-gradient' : 'text-ink'}`}>{value}</p>
      <p className="text-muted mt-1 text-xs">{label}</p>
    </Card>
  )
}
