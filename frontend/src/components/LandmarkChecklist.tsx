import { useTranslation } from '../i18n/LanguageContext'
import { translateLandmarkValue } from '../i18n/landmarks'
import { LandmarkChip } from './ui/LandmarkChip'
import type { Landmark } from '../api/types'

export function LandmarkChecklist({ landmarks, stagger = true }: { landmarks: Landmark[]; stagger?: boolean }) {
  const { t } = useTranslation()
  return (
    <ul className="space-y-3">
      {landmarks.map((lm, i) => (
        <LandmarkChip
          key={`${lm.type}-${lm.value}-${i}`}
          label={translateLandmarkValue(lm, t)}
          matched={lm.matched}
          delay={stagger ? i * 90 : 0}
        />
      ))}
    </ul>
  )
}
