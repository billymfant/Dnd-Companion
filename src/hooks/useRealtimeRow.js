import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

// ---------------------------------------------------------------
// useRealtimeRow
// Live single row from `table` matched by id. Used for a player's
// own character so a DM's HP change appears on their phone instantly.
//
// Returns: { row, loading, error, refetch }
// ---------------------------------------------------------------
export function useRealtimeRow(table, id) {
  const [row, setRow] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    if (!id) return
    const { data, error: err } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single()
    if (err) setError(err)
    else setRow(data)
    setLoading(false)
  }, [table, id])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    refetch()

    const channel = supabase
      .channel(`rt-${table}-row-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `id=eq.${id}` },
        (payload) => {
          if (payload.eventType === 'DELETE') setRow(null)
          else setRow(payload.new)
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') refetch()
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, id, refetch])

  return { row, loading, error, refetch }
}
