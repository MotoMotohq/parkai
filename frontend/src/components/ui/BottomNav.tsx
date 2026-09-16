import { Bookmark, Home, ScanSearch } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from '../../i18n/LanguageContext'

const ITEMS = [
  { to: '/', key: 'nav.home', icon: Home },
  { to: '/find', key: 'nav.find', icon: ScanSearch },
  { to: '/saved', key: 'nav.saved', icon: Bookmark },
]

export function BottomNav() {
  const { t } = useTranslation()
  return (
    <nav className="border-line bg-bg/85 sticky bottom-0 z-20 border-t backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center justify-around px-6 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {ITEMS.map(({ to, key, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className="flex flex-col items-center gap-1 px-4 py-1 text-xs font-medium"
          >
            {({ isActive }) => (
              <>
                <Icon size={21} className={isActive ? 'text-accent' : 'text-muted'} strokeWidth={isActive ? 2.3 : 2} />
                <span className={isActive ? 'text-ink' : 'text-muted'}>{t(key)}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
