/**
 * Module-level cache — persists for the entire browser session.
 * Because this is a plain JS module (not React state), it survives
 * component unmounts / page navigations. Pages read from here first
 * and only hit the network when data is stale or missing.
 */

import {
  getStatus, getMetrics, getOverviewAnalytics, getSpendingAnalytics,
  SystemStatus, ModelMetrics, OverviewAnalytics, SpendingAnalytics,
} from './api'

type CacheEntry<T> = { data: T; fetchedAt: number }

const TTL = 60_000 // 60 seconds before re-fetch

const store: {
  status?: CacheEntry<SystemStatus>
  metrics?: CacheEntry<ModelMetrics>
  overview?: CacheEntry<OverviewAnalytics>
  spending?: CacheEntry<SpendingAnalytics>
} = {}

// Pending promises so multiple simultaneous callers share one network request
const inflight: Record<string, Promise<any> | undefined> = {}

function fresh<T>(entry?: CacheEntry<T>): boolean {
  return !!entry && Date.now() - entry.fetchedAt < TTL
}

async function cached<T>(
  key: keyof typeof store,
  fetcher: () => Promise<T>
): Promise<T> {
  const entry = store[key] as CacheEntry<T> | undefined
  if (fresh(entry)) return entry!.data

  if (inflight[key]) return inflight[key]

  inflight[key] = fetcher()
    .then(data => {
      (store as any)[key] = { data, fetchedAt: Date.now() }
      delete inflight[key]
      return data
    })
    .catch(err => {
      delete inflight[key]
      throw err
    })

  return inflight[key]
}

export const cachedStatus = () => cached('status', getStatus)
export const cachedMetrics = () => cached('metrics', getMetrics)
export const cachedOverview = () => cached('overview', getOverviewAnalytics)
export const cachedSpending = () => cached('spending', getSpendingAnalytics)

/** Force-invalidate everything (call after training a model) */
export function invalidateAll() {
  delete store.status
  delete store.metrics
  delete store.overview
  delete store.spending
}

/** Get stale data immediately (if any), then refresh in background */
export function staleWhileRevalidate<T>(
  key: keyof typeof store,
  fetcher: () => Promise<T>,
  onUpdate: (data: T) => void
): T | undefined {
  const entry = store[key] as CacheEntry<T> | undefined
  const staleData = entry?.data

  // Always kick off a background refresh if data is stale
  if (!fresh(entry)) {
    cached(key, fetcher)
      .then(onUpdate)
      .catch(() => {/* silent — stale data remains */})
  }

  return staleData
}
