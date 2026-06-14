import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

// ---------------------------------------------------------------
// useRealtimeList
// Live array of rows from `table` for one session.
//
//   1. Fetches the current rows once on mount.
//   2. Opens a Supabase Realtime channel and listens for INSERT /
//      UPDATE / DELETE on that table (filtered to this session).
//   3. Keeps local state in sync so the UI re-renders instantly
//      whenever anyone changes the data — no polling.
//
// options: { orderBy: 'rolled_at', ascending: false, limit: 50 }
// Returns: { rows, loading, error, refetch }
// ---------------------------------------------------------------
export function useRealtimeList(table, sessionId, options = {}) {
  const { orderBy, ascending = true, limit } = options
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Sort helper kept consistent between fetch and live updates.
  const sortRows = useCallback(
    (list) => {
      if (!orderBy) return list
      const sorted = [...list].sort((a, b) => {
        if (a[orderBy] < b[orderBy]) return ascending ? -1 : 1
        if (a[orderBy] > b[orderBy]) return ascending ? 1 : -1
        return 0
      })
      return typeof limit === 'number' ? sorted.slice(0, limit) : sorted
    },
    [orderBy, ascending, limit]
  )

  const refetch = useCallback(async () => {
    if (!sessionId) return
    let q = supabase.from(table).select('*').eq('session_id', sessionId)
    if (orderBy) q = q.order(orderBy, { ascending })
    if (typeof limit === 'number') q = q.limit(limit)
    const { data, error: err } = await q
    if (err) setError(err)
    else setRows(data || [])
    setLoading(false)
  }, [table, sessionId, orderBy, ascending, limit])

  useEffect(() => {
    if (!sessionId) return
    setLoading(true)
    refetch()

    // Subscribe to live changes for this table + session.
    const channel = supabase
      .channel(`rt-${table}-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          setRows((prev) => {
            let next = prev
            if (payload.eventType === 'INSERT') {
              // Avoid duplicates if our own insert already added it.
              next = prev.some((r) => r.id === payload.new.id)
                ? prev
                : [...prev, payload.new]
            } else if (payload.eventType === 'UPDATE') {
              next = prev.map((r) => (r.id === payload.new.id ? payload.new : r))
            } else if (payload.eventType === 'DELETE') {
              next = prev.filter((r) => r.id !== payload.old.id)
            }
            return sortRows(next)
          })
        }
      )
      .subscribe((status) => {
        // Once the channel is live, refetch to catch any rows that
        // changed in the gap between the initial fetch and subscribing.
        // This avoids a race where a just-created row is missed.
        if (status === 'SUBSCRIBED') refetch()
      })

    // Clean up the subscription when the component unmounts.
    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, sessionId, refetch, sortRows])

  return { rows, loading, error, refetch }
}
