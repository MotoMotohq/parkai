import { Car } from 'lucide-react'
import type { ParkingLocation } from '../api/types'

const ZONES = ['A', 'B', 'C', 'D']
const ROWS = [1, 2, 3, 4, 5, 6]

interface Props {
  locations: ParkingLocation[]
  floor: string
  highlightNumber?: string
}

export function ParkingMap({ locations, floor, highlightNumber }: Props) {
  const present = new Set(locations.filter((l) => l.floor === floor).map((l) => l.parking_number))

  return (
    <div className="space-y-2.5">
      {ZONES.map((zone) => (
        <div key={zone} className="flex items-center gap-3">
          <span className="text-muted w-4 text-xs font-semibold">{zone}</span>
          <div className="grid flex-1 grid-cols-6 gap-2">
            {ROWS.map((row) => {
              const number = `${zone}${String(row).padStart(2, '0')}`
              const isHighlighted = number === highlightNumber
              const exists = present.has(number)
              return (
                <div
                  key={number}
                  title={number}
                  className={`flex h-10 items-center justify-center rounded-[10px] text-[10px] font-medium transition-all duration-300 ${
                    isHighlighted
                      ? 'bg-gradient-ai scale-110 text-white shadow-[0_4px_16px_-4px_rgba(99,102,241,0.7)] ring-2 ring-white/20'
                      : exists
                        ? 'bg-surface-2 text-muted border-line border'
                        : 'bg-surface text-line border-line/60 border'
                  }`}
                >
                  {isHighlighted ? <Car size={16} /> : number}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
