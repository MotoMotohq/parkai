import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchParking } from '../api/client'
import type { SearchResult } from '../api/types'
import { AIProcessingList } from '../components/AIProcessingList'
import { RankingReveal } from '../components/RankingReveal'
import { ScanningPhoto } from '../components/ScanningPhoto'
import { UploadDropzone } from '../components/UploadDropzone'
import { Button } from '../components/ui/Button'
import { TopBar } from '../components/ui/TopBar'
import { useTranslation } from '../i18n/LanguageContext'
import { useAppState } from '../state/AppState'

type Stage = 'upload' | 'searching'

export function Find() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { setCurrentResult } = useAppState()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [stage, setStage] = useState<Stage>('upload')
  const [result, setResult] = useState<SearchResult | null>(null)
  const [revealing, setRevealing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const steps = [t('find.stepScanning'), t('find.stepComparing'), t('find.stepRanking')]

  function handleFile(f: File) {
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function handleFind() {
    if (!file) return
    setError(null)
    setStage('searching')
    setRevealing(false)
    try {
      const data = await searchParking(file)
      setResult(data)
      setTimeout(() => {
        setRevealing(true)
        const totalRevealMs = data.candidates.length * 380 + 900
        setTimeout(() => {
          setCurrentResult(data)
          navigate('/result')
        }, totalRevealMs)
      }, 500)
    } catch {
      setError(t('find.noLocations'))
      setStage('upload')
    }
  }

  return (
    <div className="bg-bg flex min-h-screen flex-col">
      <TopBar back title={stage === 'upload' ? t('home.findMyCar') : undefined} />
      <main className="flex flex-1 justify-center px-5 pb-14 sm:px-10">
        <div className="w-full max-w-md">
          {stage === 'upload' && (
            <div className="animate-fade-in space-y-7">
              <div className="space-y-2 text-center">
                <h1 className="text-ink text-[1.75rem] leading-tight font-bold tracking-tight">
                  {t('find.title')}
                </h1>
                <p className="text-muted text-[15px]">{t('find.sub1')}</p>
                <p className="text-muted/70 text-sm">{t('find.sub2')}</p>
              </div>

              <UploadDropzone label={t('find.uploadLabel')} onFileSelected={handleFile} />

              {error && <p className="text-danger text-center text-sm">{error}</p>}

              <Button size="lg" disabled={!file} onClick={handleFind}>
                {t('find.findMyCar')}
              </Button>
            </div>
          )}

          {stage === 'searching' && preview && (
            <div className="animate-fade-in space-y-7">
              <div className="space-y-1 text-center">
                <p className="text-accent text-xs font-semibold tracking-[0.15em] uppercase">
                  {t('find.aiVisualSearch')}
                </p>
              </div>

              <ScanningPhoto src={preview} scanning={!result} />

              {!result && (
                <div className="border-line bg-surface rounded-[22px] border p-6">
                  <AIProcessingList steps={steps} active={!result} />
                </div>
              )}

              {result && (
                <div className="animate-fade-in space-y-6">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <Stat value={result.locations_analyzed} label={t('find.statLocations')} />
                    <Stat value={result.candidates.length} label={t('find.statCandidates')} />
                    <Stat value={result.matched_landmarks.length} label={t('find.statLandmarks')} />
                  </div>
                  <div className="border-line bg-surface rounded-[22px] border p-6">
                    <RankingReveal
                      candidates={result.candidates}
                      bestId={result.best_match.location.id}
                      active={revealing}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="border-line bg-surface rounded-2xl border py-4">
      <p className="text-ink text-xl font-bold tabular-nums">{value}</p>
      <p className="text-muted mt-1 text-[11px] font-medium tracking-wide uppercase">{label}</p>
    </div>
  )
}
