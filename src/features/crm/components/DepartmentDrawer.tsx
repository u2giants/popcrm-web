import { useMemo, useState } from 'react'
import { Contact, Pencil, Route, X } from 'lucide-react'
import { toast } from 'sonner'
import { DetailDrawer, DescriptionItem, DescriptionList, DrawerSection } from '@/components/app/DetailDrawer'
import { Combobox, type ComboOption } from '@/components/app/Combobox'
import { NameAvatar } from '@/components/app/NameAvatar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StageBadge } from '@/features/crm/components/CrmStatusBadge'
import { listData, useIngestedContactsQuery, useOpportunitiesQuery, useUpdateDepartmentMutation } from '@/features/crm/queries'
import { formatDate, idOf, label, relatedName } from '@/features/crm/format'
import { logError } from '@/lib/errors'
import type { CrmDepartment } from '@/lib/types'

function fmtAmount(val: string | number | null | undefined): string {
  if (val == null || val === '') return '—'
  const n = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]/g, '')) : Number(val)
  if (!isFinite(n)) return '—'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`
  return `$${n.toFixed(0)}`
}

export function DepartmentDrawer({ row, departments, onClose }: { row: CrmDepartment | null; departments: CrmDepartment[]; onClose: () => void }) {
  const buyers = listData(useIngestedContactsQuery(-1).data)
  const opportunities = listData(useOpportunitiesQuery(-1).data)
  const updateDepartment = useUpdateDepartmentMutation()
  const [renameOpen, setRenameOpen] = useState(false)
  const [nameDraft, setNameDraft] = useState('')

  const related = useMemo(() => {
    if (!row) return { contacts: [], programs: [] }
    return {
      contacts: buyers.filter((b) => idOf(b.department) === row.id),
      programs: opportunities.filter((o) => idOf(o.department) === row.id),
    }
  }, [row, buyers, opportunities])

  const contactOptions = useMemo<ComboOption[]>(() => {
    if (!row) return []
    const customerId = idOf(row.retailer)
    return buyers
      .filter((b) => idOf(b.retailer) === customerId)
      .map((b) => ({ value: b.id, label: b.name, hint: b.job_title ?? undefined }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [row, buyers])
  const categoryOptions = useMemo<ComboOption[]>(() => distinctOptions(departments.map((d) => d.category)), [departments])
  const divisionOptions = useMemo<ComboOption[]>(() => distinctOptions(departments.map((d) => d.division)), [departments])

  async function save(values: Partial<CrmDepartment>, successMessage?: string): Promise<boolean> {
    if (!row) return false
    try {
      await updateDepartment.mutateAsync({ id: row.id, values })
      if (successMessage) toast.success(successMessage)
      return true
    } catch (error) {
      toast.error('Could not update department', { description: logError('DepartmentDrawer.save', error) })
      return false
    }
  }

  async function confirmRename() {
    const name = nameDraft.trim()
    if (!row || !name || name === row.name) return
    if (await save({ name }, `Department renamed to ${name}`)) setRenameOpen(false)
  }

  return (
    <>
      <DetailDrawer
      open={!!row}
      onClose={onClose}
      title={row?.name || 'Department'}
      subtitle={row ? relatedName(row.retailer) : undefined}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={() => { setNameDraft(row?.name ?? ''); setRenameOpen(true) }}>
            <Pencil className="size-[13px]" /> Rename department
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="size-[13px]" /> Close
          </Button>
        </>
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
              <DescriptionItem term="Customer">{relatedName(row.retailer)}</DescriptionItem>
              <DescriptionItem term="Primary contact">
                <Combobox options={contactOptions} value={idOf(row.primary_buyer)} onChange={(value) => void save({ primary_buyer: value || null })} placeholder="Select contact" className="h-8" />
              </DescriptionItem>
              <DescriptionItem term="Category">
                <Combobox options={categoryOptions} value={row.category ?? ''} onChange={(value) => void save({ category: value || null })} placeholder="Select category" className="h-8" />
              </DescriptionItem>
              <DescriptionItem term="Division">
                <Combobox options={divisionOptions} value={row.division ?? ''} onChange={(value) => void save({ division: value || null })} placeholder="Select division" className="h-8" />
              </DescriptionItem>
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
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename department</DialogTitle>
            <DialogDescription>
              This changes the department name everywhere it appears in CRM. Are you sure you want to rename “{row?.name}”?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="department-name">New department name</Label>
            <Input id="department-name" value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} autoFocus />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>Cancel</Button>
            <Button onClick={() => void confirmRename()} disabled={!nameDraft.trim() || nameDraft.trim() === row?.name || updateDepartment.isPending}>Yes, rename department</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function distinctOptions(values: (string | null)[]): ComboOption[] {
  return Array.from(new Set(values.map((value) => value?.trim()).filter(Boolean) as string[]))
    .sort((a, b) => label(a).localeCompare(label(b)))
    .map((value) => ({ value, label: label(value) }))
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
