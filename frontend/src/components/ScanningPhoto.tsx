import { useTranslation } from '../i18n/LanguageContext'
import { translateLandmarkTag, translateLandmarkValue } from '../i18n/landmarks'
import type { Landmark } from '../api/types'

const POSITION_BY_TYPE: Record<string, { left: string; top: string }> = {
  sign: { left: '26%', top: '24%' },
  column: { left: '48%', top: '56%' },
  elevator: { left: '13%', top: '46%' },
  fire_cabinet: { left: '85%', top: '44%' },
  wall_pattern: { left: '66%', top: '15%' },
  floor_marking: { left: '50%', top: '86%' },
}

interface Props {
  src: string
  landmarks?: Landmark[]
  scanning?: boolean
  revealLandmarks?: boolean
  aspect?: string
}

export function ScanningPhoto({ src, landmarks = [], scanning, revealLandmarks, aspect = 'aspect-[4/3]' }: Props) {
  const { t } = useTranslation()
  return (
    <div className={`border-line bg-surface relative overflow-hidden rounded-[24px] border ${aspect}`}>
      <img src={src} alt="" className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />

      {scanning && (
        <div
          className="animate-scan-sweep absolute inset-x-0 top-0 h-28"
          style={{
            background:
              'linear-gradient(to bottom, transparent, rgba(99,102,241,0.35), rgba(139,92,246,0.15), transparent)',
          }}
        />
      )}

      {revealLandmarks &&
        landmarks.map((lm, i) => {
          const pos = POSITION_BY_TYPE[lm.type] ?? { left: '50%', top: '50%' }
          return (
            <div
              key={`${lm.type}-${i}`}
              className="animate-fade-in-scale absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: pos.left, top: pos.top, animationDelay: `${i * 300}ms` }}
            >
              <div className="flex flex-col items-center gap-1.5">
                <span className="bg-gradient-ai ring-accent/25 h-2.5 w-2.5 rounded-full ring-[5px]" />
                <span className="rounded-md bg-black/75 px-2 py-1 text-[10px] font-semibold tracking-wide whitespace-nowrap text-white uppercase backdrop-blur-sm">
                  {translateLandmarkValue(lm, t)}{' '}
                  <span className="text-white/50">· {translateLandmarkTag(lm.type, t)}</span>
                </span>
              </div>
            </div>
          )
        })}
    </div>
  )
}
