import { MapPin, SquarePlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listParking, resolveAssetUrl } from '../api/client'
import type { ParkingLocation } from '../api/types'
import { BottomNav } from '../components/ui/BottomNav'
import { Button } from '../components/ui/Button'
import { TopBar } from '../components/ui/TopBar'
import { useTranslation } from '../i18n/LanguageContext'

export function Saved() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [saved, setSaved] = useState<ParkingLocation[] | null>(null)

  useEffect(() => {
    listParking()
      .then((all) => setSaved(all.filter((l) => !l.is_demo)))
      .catch(() => setSaved([]))
  }, [])

  return (
    <div className="bg-bg flex min-h-screen flex-col">
      <TopBar title={t('saved.title')} />
      <main className="flex-1 px-5 pb-8 sm:px-10">
        <div className="mx-auto w-full max-w-md">
          {saved === null && <p className="text-muted mt-16 text-center text-sm">{t('common.loading')}</p>}

          {saved && saved.length === 0 && (
            <div className="animate-fade-in flex flex-col items-center gap-6 pt-20 text-center">
              <div className="border-line bg-surface flex h-14 w-14 items-center justify-center rounded-2xl border">
                <MapPin className="text-muted" size={24} />
              </div>
              <div className="space-y-1.5">
                <p className="text-ink text-lg font-semibold">{t('saved.emptyTitle')}</p>
                <p className="text-muted text-sm">
                  {t('saved.emptyBody1')}
                  <br />
                  {t('saved.emptyBody2')}
                </p>
              </div>
              <Button className="w-auto px-8" icon={<SquarePlus size={18} />} onClick={() => navigate('/save')}>
                {t('saved.saveMyCar')}
              </Button>
            </div>
          )}

          {saved && saved.length > 0 && (
            <div className="animate-fade-in space-y-3 pt-6">
              {saved
                .slice()
                .reverse()
                .map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => navigate('/save')}
                    className="border-line bg-surface hover:border-zinc-600 flex w-full items-center gap-4 rounded-[20px] border p-3 text-left transition-colors"
                  >
                    <img
                      src={resolveAssetUrl(loc.image_url)}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-ink font-semibold">
                        {loc.floor} · {loc.parking_number}
                      </p>
                      <p className="text-muted text-xs">{t('common.zone', { zone: loc.zone })}</p>
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
