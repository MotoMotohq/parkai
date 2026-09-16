import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveParking } from '../api/client'
import type { SaveResult } from '../api/types'
import { AIProcessingList } from '../components/AIProcessingList'
import { LandmarkChecklist } from '../components/LandmarkChecklist'
import { ScanningPhoto } from '../components/ScanningPhoto'
import { UploadDropzone } from '../components/UploadDropzone'
import { Button } from '../components/ui/Button'
import { ProgressRing } from '../components/ui/ProgressRing'
import { TopBar } from '../components/ui/TopBar'
import { useTranslation } from '../i18n/LanguageContext'
import { useAppState } from '../state/AppState'

type Stage = 'upload' | 'analyzing' | 'done'

export function Save() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { setLastParking } = useAppState()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [stage, setStage] = useState<Stage>('upload')
  const [result, setResult] = useState<SaveResult | null>(null)
  const [revealLandmarks, setRevealLandmarks] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const steps = [
    t('save.stepReadingSigns'),
    t('save.stepFindingLandmarks'),
    t('save.stepExtractingFeatures'),
    t('save.stepCreatingFingerprint'),
  ]

  function handleFile(f: File) {
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function handleCreateFingerprint() {
    if (!file) return
    setError(null)
    setStage('analyzing')
    setRevealLandmarks(false)
    try {
      const data = await saveParking(file)
      setResult(data)
      setRevealLandmarks(true)
      setTimeout(() => {
        setStage('done')
        setLastParking({
          floor: data.location.floor,
          zone: data.location.zone,
          parking_number: data.location.parking_number,
          confidence: data.confidence,
        })
      }, 1300)
    } catch {
      setError(t('save.analysisFailed'))
      setStage('upload')
    }
  }

  return (
    <div className="bg-bg flex min-h-screen flex-col">
      <TopBar back title={stage === 'done' ? undefined : t('home.saveMyCar')} />
      <main className="flex flex-1 justify-center px-5 pb-14 sm:px-10">
        <div className="w-full max-w-md">
          {stage === 'upload' && (
            <div className="animate-fade-in space-y-7">
              <div className="space-y-2 text-center">
                <h1 className="text-ink text-[1.75rem] leading-tight font-bold tracking-tight">
                  {t('save.heading')}
                </h1>
                <p className="text-muted text-[15px]">{t('save.sub1')}</p>
                <p className="text-muted/70 text-sm">{t('save.sub2')}</p>
              </div>

              <UploadDropzone label={t('save.uploadLabel')} onFileSelected={handleFile} />

              {error && <p className="text-danger text-center text-sm">{error}</p>}

              <Button size="lg" disabled={!file} onClick={handleCreateFingerprint}>
                {t('save.createFingerprint')}
              </Button>
            </div>
          )}

          {stage === 'analyzing' && preview && (
            <div className="animate-fade-in space-y-7">
              <div className="space-y-1 text-center">
                <p className="text-accent text-xs font-semibold tracking-[0.15em] uppercase">
                  {t('save.aiAnalysis')}
                </p>
              </div>
              <ScanningPhoto
                src={preview}
                landmarks={result?.detected_landmarks ?? []}
                scanning={!revealLandmarks}
                revealLandmarks={revealLandmarks}
              />
              <div className="border-line bg-surface rounded-[22px] border p-6">
                <AIProcessingList steps={steps} active={!revealLandmarks} />
              </div>
            </div>
          )}

          {stage === 'done' && result && (
            <div className="animate-fade-in space-y-8">
              <div className="flex flex-col items-center gap-2 pt-2 text-center">
                <p className="text-ink text-[1.5rem] font-bold tracking-tight">{t('save.fingerprintCreated')}</p>
                <ProgressRing value={Math.round(result.confidence * 100)} label={t('save.visualConfidence')} />
                <p className="text-ink mt-1 text-lg font-semibold tracking-tight">
                  {result.location.floor} · {t('common.zone', { zone: result.location.zone })} ·{' '}
                  {result.location.parking_number}
                </p>
              </div>

              <div className="border-line bg-surface rounded-[22px] border p-6">
                <p className="text-muted mb-4 text-xs font-semibold tracking-wide uppercase">
                  {t('save.landmarksDetected', { n: result.detected_landmarks.length })}
                </p>
                <LandmarkChecklist landmarks={result.detected_landmarks} />
              </div>

              <div className="space-y-3">
                <Button size="lg" onClick={() => navigate('/find')}>
                  {t('save.findMyCar')}
                </Button>
                <Button size="lg" variant="ghost" onClick={() => navigate('/')}>
                  {t('result.backToHome')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
