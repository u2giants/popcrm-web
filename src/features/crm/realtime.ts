import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { crmKeys } from './queries'

type SubscriptionSpec = {
  table: string
  debounceMs: number
  invalidate: readonly (readonly unknown[])[]
}

const SUBSCRIPTIONS: SubscriptionSpec[] = [
  { table: 'email_message', debounceMs: 1_250, invalidate: [[...crmKeys.all, 'emails'], crmKeys.stats()] },
  { table: 'task', debounceMs: 750, invalidate: [[...crmKeys.all, 'tasks'], crmKeys.stats()] },
  { table: 'note', debounceMs: 750, invalidate: [[...crmKeys.all, 'notes'], crmKeys.stats()] },
  { table: 'meeting_note', debounceMs: 750, invalidate: [[...crmKeys.all, 'meetings'], crmKeys.stats()] },
  { table: 'opportunity', debounceMs: 1_000, invalidate: [[...crmKeys.all, 'opportunities'], crmKeys.stats()] },
  { table: 'department', debounceMs: 1_000, invalidate: [[...crmKeys.all, 'departments']] },
]

export function useCrmRealtimeInvalidation(enabled: boolean) {
  const queryClient = useQueryClient()
  const timers = useRef(new Map<string, number>())

  useEffect(() => {
    if (!enabled) return

    const activeTimers = timers.current
    const channel = supabase.channel('popcrm-live-data')

    for (const spec of SUBSCRIPTIONS) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'crm', table: spec.table },
        () => {
          const previous = activeTimers.get(spec.table)
          if (previous) window.clearTimeout(previous)
          const next = window.setTimeout(() => {
            for (const key of spec.invalidate) {
              void queryClient.invalidateQueries({ queryKey: key })
            }
            activeTimers.delete(spec.table)
          }, spec.debounceMs)
          activeTimers.set(spec.table, next)
        },
      )
    }

    void channel.subscribe()

    return () => {
      activeTimers.forEach((timer) => window.clearTimeout(timer))
      activeTimers.clear()
      void supabase.removeChannel(channel)
    }
  }, [enabled, queryClient])
}
