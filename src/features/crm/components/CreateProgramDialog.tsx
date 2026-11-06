import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Combobox, type ComboOption } from '@/components/app/Combobox'
import { listData, useCreateOpportunityMutation, useCustomerPickerQuery } from '@/features/crm/queries'
import { OPPORTUNITY_STAGES } from '@/features/crm/constants'
import { customerLabel } from '@/features/crm/format'
import { isSelectableCustomer } from '@/features/crm/pages/_shared'
import { logError } from '@/lib/errors'

const selectClass = 'w-full rounded-[7px] border bg-background px-[9px] py-[7px] text-sm outline-none focus:border-ring'

// Adds a program through api.crm_create_opportunity, which enforces CRM write
// roles and requires an existing customer.
export function CreateProgramDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const retailers = listData(useCustomerPickerQuery(-1).data)
  const createProgram = useCreateOpportunityMutation()
  const [name, setName] = useState('')
  const [retailerId, setRetailerId] = useState('')
  const [stage, setStage] = useState<string>(OPPORTUNITY_STAGES[0])
  const [amount, setAmount] = useState('')
  const [closeDate, setCloseDate] = useState('')

  const customerOptions = useMemo<ComboOption[]>(
    () => retailers.filter((r) => isSelectableCustomer(r.status)).map((r) => ({ value: r.id, label: customerLabel(r) })),
    [retailers],
  )

  const amountNumber = amount.trim() === '' ? null : Number(amount)
  const amountLooksWrong = amountNumber !== null && (Number.isNaN(amountNumber) || amountNumber < 0)
  const canSave = !!name.trim() && !!retailerId && !amountLooksWrong && !createProgram.isPending

  async function save() {
    if (!canSave) return
    try {
      const created = await createProgram.mutateAsync({
        name: name.trim(),
        company_id: retailerId,
        stage,
        amount: amountNumber,
        close_date: closeDate || null,
      })
      toast.success(`${created.name || name.trim()} added to ${labelStage(stage)}`)
      onClose()
    } catch (error) {
      toast.error('Could not add program', { description: logError('CreateProgramDialog.save', error) })
    }
  }

  const labelStage = (s: string) => s.replace(/_/g, ' ').toLowerCase()

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>New program</DialogTitle>
          <DialogDescription>Start a customer program in the pipeline.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1">
            <Label htmlFor="np-name">Name</Label>
            <Input
              id="np-name"
              value={name}
              autoFocus
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && canSave) void save() }}
            />
          </div>
          <div className="grid gap-1">
            <Label>Customer</Label>
            <Combobox options={customerOptions} value={retailerId} onChange={setRetailerId} placeholder="Select customer" />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="grid gap-1">
              <Label htmlFor="np-stage">Stage</Label>
              <select id="np-stage" className={selectClass} value={stage} onChange={(e) => setStage(e.target.value)}>
                {OPPORTUNITY_STAGES.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ').toLowerCase()}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-1">
              <Label htmlFor="np-amount">Amount</Label>
              <Input
                id="np-amount"
                inputMode="decimal"
                value={amount}
                aria-invalid={amountLooksWrong}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
              />
              {amountLooksWrong ? <span className="text-[11px] text-destructive">Numbers only.</span> : null}
            </div>
            <div className="grid gap-1">
              <Label htmlFor="np-close">Close date</Label>
              <Input id="np-close" type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} disabled={createProgram.isPending}>Cancel</Button>
          <Button size="sm" disabled={!canSave} onClick={() => void save()}>
            {createProgram.isPending ? 'Adding…' : 'Add program'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
