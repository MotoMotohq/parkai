import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from '../../i18n/LanguageContext'
import { LanguageSwitcher } from './LanguageSwitcher'

interface Props {
  back?: boolean
  title?: string
  right?: ReactNode
  onBack?: () => void
}

export function TopBar({ back, title, right, onBack }: Props) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  return (
    <header className="flex items-center justify-between px-5 py-5 sm:px-10">
      <div className="flex items-center gap-3">
        {back ? (
          <button
            onClick={() => (onBack ? onBack() : navigate(-1))}
            className="border-line bg-surface-2 text-muted hover:text-ink flex h-10 w-10 items-center justify-center rounded-full border transition-colors"
            aria-label={t('common.back')}
          >
            <ChevronLeft size={19} />
          </button>
        ) : (
          <Link to="/" className="flex items-center gap-2.5">
            <span className="bg-gradient-ai flex h-8 w-8 items-center justify-center rounded-xl text-sm font-bold text-white">
              P
            </span>
            <span className="text-ink text-[15px] font-semibold tracking-tight">PARKAI</span>
          </Link>
        )}
        {title && <span className="text-muted text-[15px] font-medium">{title}</span>}
      </div>
      <div className="flex items-center gap-2">
        {right}
        <LanguageSwitcher />
      </div>
    </header>
  )
}
