import { History } from 'lucide-react'
import { SectionHeader } from '@/components/app/AppPage'
import { StatusBadge } from '@/components/app/StatusBadge'
import { EmptyState, ErrorState, LoadingState } from '@/components/app/states'
import { formatDateTime } from '@/features/crm/format'
import { logError } from '@/lib/errors'
import { appLabel, roleLabel } from './labels'
import { useAccessHistoryQuery } from './queries'

export function AccessHistoryPanel() {
  const historyQuery = useAccessHistoryQuery()
  const events = historyQuery.data ?? []

  return (
    <section className="rounded-[12px] border bg-card p-5 shadow-[var(--shadow-xs)]">
      <SectionHeader title="Access history" description="Every role and app-access change, newest first." />
      {historyQuery.isLoading ? (
        <LoadingState className="mt-4" rows={8} />
      ) : historyQuery.isError ? (
        <ErrorState
          className="mt-4"
          description={logError('AccessHistoryPanel', historyQuery.error)}
          onRetry={() => void historyQuery.refetch()}
        />
      ) : !events.length ? (
        <EmptyState className="mt-4" icon={<History className="size-5" />} title="No changes recorded yet" />
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b text-left text-[11px] text-muted-foreground">
                <th className="py-2 pr-3 font-medium">When</th>
                <th className="py-2 pr-3 font-medium">Person</th>
                <th className="py-2 pr-3 font-medium">Change</th>
                <th className="py-2 font-medium">By</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e, i) => (
                <tr key={`${e.at}-${e.profile_id}-${e.value}-${i}`} className="border-b last:border-0">
                  <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">{formatDateTime(e.at)}</td>
                  <td className="py-2 pr-3 font-medium text-foreground">{e.profile_name ?? '—'}</td>
                  <td className="py-2 pr-3">
                    <StatusBadge tone={e.action === 'granted' ? 'success' : 'warning'}>
                      {e.action === 'granted' ? 'Given' : 'Removed'}{' '}
                      {e.kind === 'role' ? roleLabel(e.value) : `${appLabel(e.value)} access`}
                    </StatusBadge>
                  </td>
                  <td className="py-2 text-muted-foreground">{e.actor_name ?? 'System'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
