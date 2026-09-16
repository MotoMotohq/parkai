import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { TRANSLATIONS, type Lang } from './translations'

type Vars = Record<string, string | number>

interface LanguageContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string, vars?: Vars) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function resolveKey(dict: unknown, key: string): string | undefined {
  const value = key.split('.').reduce<unknown>((obj, part) => {
    if (obj && typeof obj === 'object' && part in obj) return (obj as Record<string, unknown>)[part]
    return undefined
  }, dict)
  return typeof value === 'string' ? value : undefined
}

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match))
}

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem('parkai:lang')
    if (saved === 'en' || saved === 'ru' || saved === 'kk') return saved
  } catch {
    // localStorage unavailable — fall through to default
  }
  return 'en'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)

  useEffect(() => {
    try {
      localStorage.setItem('parkai:lang', lang)
    } catch {
      // ignore persistence failures (private mode, quota, etc.)
    }
  }, [lang])

  const t = useCallback(
    (key: string, vars?: Vars) => {
      const value = resolveKey(TRANSLATIONS[lang], key) ?? resolveKey(TRANSLATIONS.en, key) ?? key
      return interpolate(value, vars)
    },
    [lang],
  )

  return <LanguageContext.Provider value={{ lang, setLang: setLangState, t }}>{children}</LanguageContext.Provider>
}

export function useTranslation() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useTranslation must be used within LanguageProvider')
  return ctx
}
