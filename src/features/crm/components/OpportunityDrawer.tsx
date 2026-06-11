import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Save } from 'lucide-react'
import { DetailDrawer, DescriptionItem, DescriptionList, DrawerSection } from '@/components/app/DetailDrawer'
import { StageBadge } from '@/features/crm/components/CrmStatusBadge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCrmData } from '@/features/crm/CrmDataContext'
import { setOpportunityStage, updateOpportunity } from '@/features/crm/api'
import { OPPORTUNITY_STAGES } from '@/features/crm/constants'
import { formatDate, idOf, label, relatedName } from '@/features/crm/format'
import type { CrmOpportunity } from '@/lib/types'

export function OpportunityDrawer({
  row,
  onClose,
}: {
  row: CrmOpportunity | null
  onClose: () => void
}) {
  return (
    <DetailDrawer
      open={!!row}
      onClose={onClose}
      title={row?.name || 'Opportunity'}
      subtitle={row ? relatedName(row.retailer) : undefined}
      status={row ? <StageBadge stage={row.stage} /> : undefined}
    >
      {row ? <OpportunityDrawerForm key={row.id} row={row} onClose={onClose} /> : null}
    </DetailDrawer>
  )
}

function OpportunityDrawerForm({ row, onClose }: { row: CrmOpportunity; onClose: () => void }) {
  const { emails, meetings, notes, tasks, setOpportunities } = useCrmData()
  const [stage, setStage] = useState(row.stage || OPPORTUNITY_STAGES[0])
  const [summary, setSummary] = useState(row.ai_summary || '')
  const [saving, setSaving] = useState(false)

  const related = useMemo(() => {
    const match = (v: { id?: string } | string | null | undefined) => idOf(v) === row.id
    return {
      emails: emails.filter((e) => match(e.opportunity)).length,
      meetings: meetings.filter((m) => idOf(m.retailer) === idOf(row.retailer)).length,
      notes: notes.filter((n) => match(n.opportunity)).length,
      tasks: tasks.filter((t) => match(t.opportunity)).length,
    }
  }, [emails, meetings, notes, tasks, row])

  async function changeStage(next: string) {
    const prev = stage
    setStage(next)
    setOpportunities((rows) => rows.map((r) => (r.id === row.id ? { ...r, stage: next } : r)))
    try {
      await setOpportunityStage(row.id, next)
      toast.success(`Stage → ${label(next)}`)
    } catch {
      setStage(prev)
      setOpportunities((rows) => rows.map((r) => (r.id === row.id ? { ...r, stage: prev } : r)))
      toast.error('Could not update stage')
    }
  }

  async function saveSummary() {
    setSaving(true)
    try {
      await updateOpportunity(row.id, { ai_summary: summary })
      setOpportunities((rows) => rows.map((r) => (r.id === row.id ? { ...r, ai_summary: summary } : r)))
      toast.success('Summary saved')
      onClose()
    } catch {
      toast.error('Could not save summary')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <DrawerSection>
        <DescriptionList>
          <DescriptionItem term="Account">{relatedName(row.retailer)}</DescriptionItem>
          <DescriptionItem term="Department">{relatedName(row.department)}</DescriptionItem>
          <DescriptionItem term="Program type">{label(row.program_type)}</DescriptionItem>
          <DescriptionItem term="Season / year">{row.season_year || '—'}</DescriptionItem>
          <DescriptionItem term="Division">{row.division || '—'}</DescriptionItem>
          <DescriptionItem term="Close date">{formatDate(row.close_date)}</DescriptionItem>
          <DescriptionItem term="PO #">{row.production_po_number || '—'}</DescriptionItem>
          <DescriptionItem term="SO #">{row.sales_order_number || '—'}</DescriptionItem>
          <DescriptionItem term="Hard delivery">{formatDate(row.hard_delivery_date)}</DescriptionItem>
          <DescriptionItem term="Factory">{relatedName(row.factory)}</DescriptionItem>
        </DescriptionList>
      </DrawerSection>

      <DrawerSection title="Stage">
        <Select value={stage} onValueChange={changeStage}>
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OPPORTUNITY_STAGES.map((s) => (
              <SelectItem key={s} value={s}>
                {label(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </DrawerSection>

      <DrawerSection title="Related activity">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ['Emails', related.emails],
            ['Meetings', related.meetings],
            ['Notes', related.notes],
            ['Tasks', related.tasks],
          ].map(([name, count]) => (
            <div key={name} className="rounded-md border bg-card px-3 py-2 text-center">
              <div className="text-lg font-semibold tabular-nums">{count}</div>
              <div className="text-xs text-muted-foreground">{name}</div>
            </div>
          ))}
        </div>
      </DrawerSection>

      <DrawerSection title="AI summary">
        <div className="grid gap-2">
          <Label className="sr-only">AI summary</Label>
          <Textarea
            className="min-h-40"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="No AI summary yet."
          />
          <div className="flex justify-end">
            <Button onClick={saveSummary} disabled={saving}>
              <Save className="size-4" /> {saving ? 'Saving…' : 'Save summary'}
            </Button>
          </div>
        </div>
      </DrawerSection>
    </>
  )
}
