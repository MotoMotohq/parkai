import type { Landmark } from '../api/types'

type T = (key: string, vars?: Record<string, string | number>) => string

/**
 * The backend's landmark vocabulary is a small fixed set (see backend/app/seed and
 * ai/vision.py) — that's what makes translating it here, instead of in the backend,
 * safe: any string outside this known set (real Claude Vision free text, or the
 * heuristic's "other" fallback) is shown as-is rather than mistranslated.
 */
export function translateLandmarkValue(lm: Pick<Landmark, 'type' | 'value'>, t: T): string {
  switch (lm.type) {
    case 'sign': {
      const number = lm.value.replace(/\s*sign$/i, '').trim()
      return t('landmarks.sign', { number })
    }
    case 'column': {
      const color = lm.value.replace(/\s*column$/i, '').trim()
      const colorKey = `landmarks.color${color}`
      const colorLabel = t(colorKey)
      return colorLabel === colorKey ? lm.value : t('landmarks.column', { color: colorLabel })
    }
    case 'elevator':
      return t('landmarks.elevator')
    case 'fire_cabinet':
      return t('landmarks.fireCabinet')
    case 'wall_pattern':
      return t('landmarks.wallPattern')
    case 'floor_marking':
      return t('landmarks.floorMarking')
    default:
      return lm.value
  }
}

const TAG_KEY: Record<string, string> = {
  sign: 'landmarks.tagSign',
  column: 'landmarks.tagColumn',
  elevator: 'landmarks.tagLandmark',
  fire_cabinet: 'landmarks.tagLandmark',
  wall_pattern: 'landmarks.tagWall',
  floor_marking: 'landmarks.tagFloor',
}

export function translateLandmarkTag(type: string, t: T): string {
  const key = TAG_KEY[type]
  return key ? t(key) : t('landmarks.tagLandmark')
}
