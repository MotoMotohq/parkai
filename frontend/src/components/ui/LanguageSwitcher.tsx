import { useTranslation } from '../../i18n/LanguageContext'
import { LANGUAGES } from '../../i18n/translations'

export function LanguageSwitcher() {
  const { lang, setLang } = useTranslation()
  return (
    <div className="border-line bg-surface-2 flex items-center gap-0.5 rounded-full border p-1">
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
            lang === code ? 'bg-gradient-ai text-white' : 'text-muted hover:text-ink'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
