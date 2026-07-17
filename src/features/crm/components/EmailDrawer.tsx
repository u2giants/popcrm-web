import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Ban, Save, X } from 'lucide-react'
import { DetailDrawer, DescriptionItem, DescriptionList, DrawerSection } from '@/components/app/DetailDrawer'
import { Combobox, type ComboOption } from '@/components/app/Combobox'
import { CrmStatusBadge } from '@/features/crm/components/CrmStatusBadge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  listData,
  useCreateIgnoreRuleMutation,
  useDepartmentsQuery,
  useCustomerSegmentQuery,
  useOpportunitiesQuery,
  useUpdateEmailMutation,
} from '@/features/crm/queries'
import { ROUTING_STATUSES } from '@/features/crm/constants'
import { customerPickerOptions } from '@/features/crm/pages/_shared'
import { formatDateTime, idOf, label, relatedName } from '@/features/crm/format'
import { logError } from '@/lib/errors'
import type { CrmEmailMessage } from '@/lib/types'

export function EmailDrawer({
  row,
  onClose,
}: {
  row: CrmEmailMessage | null
  onClose: () => void
}) {
  return (
    <DetailDrawer
      open={!!row}
      onClose={onClose}
      title={row?.subject || 'Email message'}
      subtitle={row?.sender ?? undefined}
      status={row ? <CrmStatusBadge kind="routing" status={row.routing_status} /> : undefined}
    >
      {row ? <EmailDrawerForm key={row.id} row={row} onClose={onClose} /> : null}
    </DetailDrawer>
  )
}

const METHOD_META: Record<string, { label: string; confidence: number; color: string }> = {
  DETERMINISTIC: { label: 'Rule match', confidence: 99, color: 'oklch(0.60 0.15 165)' },
  AI:            { label: 'AI classify', confidence: 78, color: 'oklch(0.62 0.17 300)' },
}

function MethodConfidence({ method }: { method: string }) {
  const meta = METHOD_META[method] ?? { label: method, confidence: 50, color: 'oklch(0.60 0.12 250)' }
  return (
    <div className="flex flex-col gap-[6px]">
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] font-[550] text-foreground">{meta.label}</span>
        <span className="font-mono text-[11.5px] font-[650] tabular-nums" style={{ color: meta.color }}>
          {meta.confidence}%
        </span>
      </div>
      <div className="h-[6px] w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${meta.confidence}%`, background: meta.color }}
        />
      </div>
    </div>
  )
}

function EmailDrawerForm({ row, onClose }: { row: CrmEmailMessage; onClose: () => void }) {
  const retailersQuery = useCustomerSegmentQuery('all', -1)
  const opportunitiesQuery = useOpportunitiesQuery(-1)
  const departmentsQuery = useDepartmentsQuery(-1)
  const updateEmailMutation = useUpdateEmailMutation()
  const createIgnoreRuleMutation = useCreateIgnoreRuleMutation()
  const retailers = listData(retailersQuery.data)
  const opportunities = listData(opportunitiesQuery.data)
  const departments = listData(departmentsQuery.data)
  const [status, setStatus] = useState(row.routing_status || 'UNROUTED')
  const [retailer, setRetailer] = useState(idOf(row.retailer))
  const [department, setDepartment] = useState(idOf(row.department))
  const [opportunity, setOpportunity] = useState(idOf(row.opportunity))
  const [method, setMethod] = useState(row.routing_method || 'MANUAL')
  const [saving, setSaving] = useState(false)
  const [ignoring, setIgnoring] = useState(false)

  const retailerOptions = useMemo<ComboOption[]>(
    () => customerPickerOptions(retailers, retailer, (r) => r.domain ?? undefined),
    [retailers, retailer],
  )
  const departmentOptions = useMemo<ComboOption[]>(
    () =>
      departments
        .filter((d) => !retailer || idOf(d.retailer) === retailer)
        .map((d) => ({ value: d.id, label: d.name, hint: relatedName(d.retailer) })),
    [departments, retailer],
  )
  const opportunityOptions = useMemo<ComboOption[]>(
    () =>
      opportunities.map((o) => ({
        value: o.id,
        label: o.name || 'Untitled program',
        hint: relatedName(o.retailer),
      })),
    [opportunities],
  )
  const retailerById = useMemo(() => new Map(retailers.map((r) => [r.id, r])), [retailers])
  const departmentById = useMemo(() => new Map(departments.map((d) => [d.id, d])), [departments])
  const opportunityById = useMemo(() => new Map(opportunities.map((o) => [o.id, o])), [opportunities])

  async function save() {
    setSaving(true)
    const values: Partial<CrmEmailMessage> = {
      routing_status: status,
      routing_method: method || 'MANUAL',
      retailer: retailerById.get(retailer) ?? null,
      department: departmentById.get(department) ?? null,
      opportunity: opportunityById.get(opportunity) ?? null,
    }
    try {
      await updateEmailMutation.mutateAsync({ id: row.id, values })
      toast.success('Routing saved')
      onClose()
    } catch (error) {
      toast.error('Could not save routing', { description: logError('EmailDrawer.saveRouting', error) })
    } finally {
      setSaving(false)
    }
  }

  async function ignoreSubject() {
    const pattern = (row.subject || '').trim()
    if (!pattern) {
      toast.error('No subject to build a rule from')
      return
    }
    setIgnoring(true)
    try {
      await createIgnoreRuleMutation.mutateAsync({ name: pattern, pattern, match_type: 'CONTAINS', emails_skipped: 0 })
      toast.success('Ignore rule created from subject')
    } catch (error) {
      toast.error('Could not create ignore rule', { description: logError('EmailDrawer.ignoreSubject', error) })
    } finally {
      setIgnoring(false)
    }
  }

  return (
    <>
      {/* Message header */}
      <DrawerSection>
        <DescriptionList>
          <DescriptionItem term="From">{row.sender || '—'}</DescriptionItem>
          <DescriptionItem term="Received">{formatDateTime(row.received_at)}</DescriptionItem>
          <DescriptionItem term="To" full>{row.recipients || '—'}</DescriptionItem>
        </DescriptionList>
      </DrawerSection>

      {/* Email preview — styled as a mail excerpt */}
      <DrawerSection title="Preview">
        <div className="overflow-hidden rounded-[8px] border">
          <div className="border-b bg-muted/40 px-[11px] py-[8px]">
            <p className="text-[11.5px] font-[550] text-foreground">{row.subject || '(no subject)'}</p>
            <p className="text-[11px] text-muted-foreground">{row.sender}</p>
          </div>
          <div className="max-h-44 overflow-y-auto px-[11px] py-[10px] text-[12px] leading-[1.65] text-muted-foreground whitespace-pre-wrap">
            {row.body_preview || 'No preview available.'}
          </div>
        </div>
      </DrawerSection>

      {/* Detected-by + confidence meter */}
      {row.routing_method && row.routing_method !== 'MANUAL' ? (
        <DrawerSection title="Detected by">
          <MethodConfidence method={row.routing_method} />
        </DrawerSection>
      ) : null}

      {/* Routing fields */}
      <DrawerSection title="Routing">
        <div className="grid gap-[14px] sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROUTING_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {label(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['MANUAL', 'DETERMINISTIC', 'AI'].map((m) => (
                  <SelectItem key={m} value={m}>
                    {label(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Customer</Label>
            <Combobox
              options={retailerOptions}
              value={retailer}
              onChange={(v) => { setRetailer(v); setDepartment('') }}
              placeholder="Select customer"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Department</Label>
            <Combobox
              options={departmentOptions}
              value={department}
              onChange={setDepartment}
              placeholder="Select department"
            />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label>Opportunity</Label>
            <Combobox
              options={opportunityOptions}
              value={opportunity}
              onChange={setOpportunity}
              placeholder="Select opportunity"
            />
          </div>
        </div>
      </DrawerSection>

      {/* Action row — ignore rule left, cancel + save right */}
      <DrawerSection>
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={ignoreSubject} disabled={ignoring} className="text-muted-foreground">
            <Ban className="size-[13px]" /> Create ignore rule
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="size-[13px]" /> Cancel
            </Button>
            <Button size="sm" onClick={save} disabled={saving}>
              <Save className="size-[13px]" /> {saving ? 'Saving…' : 'Apply routing'}
            </Button>
          </div>
        </div>
      </DrawerSection>
    </>
  )
}
