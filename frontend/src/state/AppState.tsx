import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { SearchResult } from '../api/types'

interface LastParking {
  floor: string
  zone: string
  parking_number: string
  confidence: number
}

interface AppStateValue {
  lastParking: LastParking | null
  setLastParking: (value: LastParking | null) => void
  currentResult: SearchResult | null
  setCurrentResult: (value: SearchResult | null) => void
}

const AppStateContext = createContext<AppStateValue | null>(null)

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [lastParking, setLastParkingState] = useState<LastParking | null>(() =>
    readJson<LastParking>('parkai:lastParking'),
  )
  const [currentResult, setCurrentResultState] = useState<SearchResult | null>(() =>
    readJson<SearchResult>('parkai:currentResult'),
  )

  useEffect(() => {
    if (lastParking) localStorage.setItem('parkai:lastParking', JSON.stringify(lastParking))
    else localStorage.removeItem('parkai:lastParking')
  }, [lastParking])

  useEffect(() => {
    if (currentResult) localStorage.setItem('parkai:currentResult', JSON.stringify(currentResult))
    else localStorage.removeItem('parkai:currentResult')
  }, [currentResult])

  return (
    <AppStateContext.Provider
      value={{
        lastParking,
        setLastParking: setLastParkingState,
        currentResult,
        setCurrentResult: setCurrentResultState,
      }}
    >
      {children}
    </AppStateContext.Provider>
  )
}

export function useAppState() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider')
  return ctx
}
