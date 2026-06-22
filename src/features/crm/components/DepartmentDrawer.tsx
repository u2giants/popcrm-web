import { useMemo } from 'react'
import { Contact, Route, X } from 'lucide-react'
import { DetailDrawer, DescriptionItem, DescriptionList, DrawerSection } from '@/components/app/DetailDrawer'
import { NameAvatar } from '@/components/app/NameAvatar'
import { Button } from '@/components/ui/button'
import { StageBadge } from '@/features/crm/components/CrmStatusBadge'
import { listData, useIngestedContactsQuery, useOpportunitiesQuery } from '@/features/crm/queries'
import { formatDate, idOf, label, relatedName } from '@/features/crm/format'
import type { CrmDepartment } from '@/lib/types'

function fmtAmount(val: string | number | null | undefined): string {
  if (val == null || val === '') return '—'
  const n = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]/g, '')) : Number(val)
  if (!isFinite(n)) return '—'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`
  return `$${n.toFixed(0)}`
}

export function DepartmentDrawer({ row, onClose }: { row: CrmDepartment | null; onClose: () => void }) {
  const buyers = listData(useIngestedContactsQuery(-1).data)
  const opportunities = listData(useOpportunitiesQuery(-1).data)

  const related = useMemo(() => {
    if (!row) return { contacts: [], programs: [] }
    return {
      contacts: buyers.filter((b) => idOf(b.department) === row.id),
      programs: opportunities.filter((o) => idOf(o.department) === row.id),
    }
  }, [row, buyers, opportunities])

  return (
    <DetailDrawer
      open={!!row}
      onClose={onClose}
      title={row?.name || 'Department'}
      subtitle={row ? relatedName(row.retailer) : undefined}
      footer={
        <Button variant="outline" size="sm" onClick={onClose}>
          <X className="size-[13px]" /> Close
        </Button>
      }
    >
      {row ? (
        <>
          <DrawerSection>
            <div className="grid grid-cols-2 gap-[10px]">
              <StatCard
                icon={<Contact className="size-[14px]" />}
                iconColor="oklch(0.62 0.15 165)"
                label="Contacts"
                value={related.contacts.length}
              />
              <StatCard
                icon={<Route className="size-[14px]" />}
                iconColor="oklch(0.62 0.17 300)"
                label="Programs"
                value={related.programs.length}
              />
            </div>
          </DrawerSection>

          <DrawerSection>
            <DescriptionList>
              <DescriptionItem term="Account">{relatedName(row.retailer)}</DescriptionItem>
              <DescriptionItem term="Primary contact">{relatedName(row.primary_buyer)}</DescriptionItem>
              <DescriptionItem term="Category">{label(row.category)}</DescriptionItem>
              <DescriptionItem term="Division">{label(row.division)}</DescriptionItem>
            </DescriptionList>
          </DrawerSection>

          <DrawerSection title={`Contacts (${related.contacts.length})`}>
            {related.contacts.length ? (
              <ul className="divide-y rounded-[8px] border">
                {related.contacts.map((c) => (
                  <li key={c.id} className="flex items-center gap-[9px] px-[11px] py-[8px]">
                    <NameAvatar name={c.last_name || c.name} size={22} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12.5px] font-[500] text-foreground">{c.name}</div>
                      <div className="truncate text-[11px] text-muted-foreground">
                        {c.email || c.job_title || '—'}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[12px] text-muted-foreground">No contacts assigned to this department.</p>
            )}
          </DrawerSection>

          <DrawerSection title={`Programs (${related.programs.length})`}>
            {related.programs.length ? (
              <ul className="divide-y rounded-[8px] border">
                {related.programs.map((o) => (
                  <li key={o.id} className="flex items-center gap-[8px] px-[11px] py-[8px]">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12.5px] font-[500] text-foreground">
                        {o.name || 'Untitled program'}
                      </div>
                      <div className="truncate text-[11px] text-muted-foreground">
                        {[label(o.program_type), formatDate(o.close_date)].filter((v) => v !== 'Unspecified' && v !== '—').join(' · ') || '—'}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-[6px]">
                      {o.amount ? (
                        <span className="text-[11.5px] font-[650] tabular-nums text-foreground">
                          {fmtAmount(o.amount)}
                        </span>
                      ) : null}
                      <StageBadge stage={o.stage} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[12px] text-muted-foreground">No programs assigned to this department.</p>
            )}
          </DrawerSection>
        </>
      ) : null}
    </DetailDrawer>
  )
}

function StatCard({
  icon,
  iconColor,
  label,
  value,
}: {
  icon: React.ReactNode
  iconColor: string
  label: string
  value: number
}) {
  return (
    <div className="flex items-center gap-[10px] rounded-[9px] border bg-muted/30 px-[12px] py-[10px]">
      <span
        className="flex size-[28px] shrink-0 items-center justify-center rounded-[7px]"
        style={{
          background: `color-mix(in oklch, ${iconColor} 15%, transparent)`,
          color: iconColor,
        }}
      >
        {icon}
      </span>
      <div>
        <div className="text-[18px] font-[700] leading-none tabular-nums">{value}</div>
        <div className="mt-[2px] text-[11px] text-muted-foreground">{label}</div>
      </div>
    </div>
  )
}
