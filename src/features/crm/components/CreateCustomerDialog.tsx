import { useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CustomerLogo } from '@/components/app/CustomerLogo'
import { CHAIN_TYPES, customerStatusLabel } from '@/features/crm/constants'
import { label } from '@/features/crm/format'
import { useContactsByDomainQuery, useCreateCustomerMutation } from '@/features/crm/queries'
import { logError } from '@/lib/errors'
import type { CrmIngestedDomain } from '@/lib/types'

const selectClass = 'w-full rounded-[7px] border bg-background px-[9px] py-[7px] text-sm outline-none focus:border-ring'

// Name guess from the domain: "acme-stores.com" -> "Acme Stores".
const nameFromDomain = (domain: string) =>
  (domain.split('.')[0] || domain).split(/[-_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

// Creates the customer a classified email domain belongs to. The logo comes
// from logo.dev by the domain, so it shows as soon as the domain is set.
export function CreateCustomerDialog({
  domain,
  onClose,
}: {
  domain: CrmIngestedDomain | null
  onClose: () => void
}) {
  // Remounted per domain (keyed by the caller), so these start fresh each time.
  const [name, setName] = useState(() => (domain ? domain.display_name || nameFromDomain(domain.domain) : ''))
  const [displayName, setDisplayName] = useState('')
  const [status, setStatus] = useState(domain?.status === 'ACTIVE_CUSTOMER' ? 'ACTIVE_CUSTOMER' : 'POTENTIAL_CUSTOMER')
  const [chainType, setChainType] = useState('')
  const contactsQuery = useContactsByDomainQuery(domain?.domain ?? null)
  const createCustomer = useCreateCustomerMutation()

  async function save() {
    if (!domain || !name.trim()) return
    try {
      await createCustomer.mutateAsync({
        name: name.trim(),
        domain: domain.domain.toLowerCase(),
        customer_status: status,
        display_name: displayName.trim() || null,
        chain_type: chainType || null,
      })
      toast.success(`${name.trim()} created — emails from ${domain.domain} now route to it`)
      onClose()
    } catch (error) {
      toast.error('Could not create customer', { description: logError('CreateCustomerDialog.save', error) })
    }
  }

  const contacts = contactsQuery.data ?? []

  return (
    <Dialog open={!!domain} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>New customer</DialogTitle>
          <DialogDescription>
            For emails from <span className="font-medium text-foreground">{domain?.domain}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3">
          <CustomerLogo name={name} domain={domain?.domain} size={44} />
          <div className="text-xs text-muted-foreground">Logo from logo.dev for {domain?.domain}</div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="cc-name">Name</Label>
            <Input id="cc-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="cc-display">Display name (optional)</Label>
            <Input id="cc-display" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={name} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cc-status">Status</Label>
            <select id="cc-status" className={selectClass} value={status} onChange={(e) => setStatus(e.target.value)}>
              {['ACTIVE_CUSTOMER', 'POTENTIAL_CUSTOMER'].map((s) => (
                <option key={s} value={s}>{customerStatusLabel(s)}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="cc-chain">Chain type</Label>
            <select id="cc-chain" className={selectClass} value={chainType} onChange={(e) => setChainType(e.target.value)}>
              <option value="">Not set</option>
              {CHAIN_TYPES.map((c) => (
                <option key={c} value={c}>{label(c)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-sm font-medium">Contacts on {domain?.domain}</div>
          {contactsQuery.isPending ? (
            <div className="text-xs text-muted-foreground">Looking up contacts…</div>
          ) : contacts.length ? (
            <ul className="max-h-[180px] space-y-1 overflow-y-auto rounded-[8px] border p-2 text-sm">
              {contacts.map((c) => (
                <li key={c.id} className="flex justify-between gap-3">
                  <span className="truncate">{c.name || '—'}</span>
                  <span className="truncate text-muted-foreground">{c.email}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-xs text-muted-foreground">No contacts with this domain yet.</div>
          )}
          {contacts.length ? (
            <div className="text-xs text-muted-foreground">These contacts are attached to the new customer.</div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={!name.trim() || createCustomer.isPending} onClick={() => void save()}>
            {createCustomer.isPending ? 'Creating…' : 'Create customer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
