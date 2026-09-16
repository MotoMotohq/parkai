import axios from 'axios'
import type {
  Analytics,
  ParkingLocation,
  RunTestResult,
  SaveResult,
  SearchResult,
} from './types'

// In local dev this stays empty and Vite's proxy (vite.config.ts) forwards /api and
// /static to the backend. In production the frontend and backend are deployed to
// different origins, so the build needs to know the backend's real URL.
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

const api = axios.create({ baseURL: `${API_BASE_URL}/api` })

/** Backend responses carry relative paths like "/static/images/x.jpg" — resolve
 * them against the backend's origin so `<img>` tags work when deployed separately. */
export function resolveAssetUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path
  return `${API_BASE_URL}${path}`
}

export async function saveParking(file: File): Promise<SaveResult> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post<SaveResult>('/parking/save', form)
  return data
}

export async function searchParking(file: File): Promise<SearchResult> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post<SearchResult>('/parking/search', form)
  return data
}

export async function listParking(): Promise<ParkingLocation[]> {
  const { data } = await api.get<ParkingLocation[]>('/parking')
  return data
}

export async function getParking(id: string): Promise<ParkingLocation> {
  const { data } = await api.get<ParkingLocation>(`/parking/${id}`)
  return data
}

export async function runDemo(): Promise<SearchResult> {
  const { data } = await api.post<SearchResult>('/demo/run')
  return data
}

export async function getAnalytics(): Promise<Analytics> {
  const { data } = await api.get<Analytics>('/analytics')
  return data
}

export async function runAiTest(): Promise<RunTestResult> {
  const { data } = await api.post<RunTestResult>('/analytics/run')
  return data
}
