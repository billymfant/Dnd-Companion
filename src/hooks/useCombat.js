import { useRealtimeList } from './useRealtimeList.js'

// There is one combat row per session. This wraps useRealtimeList and
// hands back that single row (or null), plus loading and a refetch so
// callers can force a reload right after creating the row (instead of
// waiting on the realtime echo of their own insert).
export function useCombat(sessionId) {
  const { rows, loading, refetch } = useRealtimeList('combat', sessionId)
  return { combat: rows[0] || null, loading, refetch }
}
