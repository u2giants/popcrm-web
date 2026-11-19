import { useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Globe } from 'lucide-react'
import { DataTable, type Column, type EditOption, type CellEditContext } from '@/components/app/DataTable'
import { customerLabel, formatDateTime, textOf } from '@/features/crm/format'
import { customerEditOptions, buildRetailerById } from '@/features/crm/pages/_shared'
import {
  listData,
  useCustomerPickerQuery,
  useCustomerSegmentQuery,
  useIngestedDomainsQuery,
  useRetailersQuery,
  useUpdateCustomerMutation,
  useUpdateIngestedDomainMutation,
} from '@/features/crm/queries'
import { logError } from '@/lib/errors'
import { CreateCustomerDialog } from '@/features/crm/components/CreateCustomerDialog'
import { StatusBadge } from '@/components/app/StatusBadge'
import { customerStatusLabel, customerStatusTone } from '@/features/crm/constants'
import type { CrmIngestedDomain, Retailer } from '@/lib/types'

// Routing a domain adds it to the chosen customer's routing aliases; the email
// worker matches sender domains against those aliases, so new mail (and the
// reroute pass over old mail) lands on that customer.
const splitAliases = (v: string | null | undefined) =>
  String(v || '').split(/[,\n;]/).map((x) => x.trim()).filter(Boolean)

const hasDomain = (r: Retailer, domain: string) =>
  splitAliases(r.routing_aliases).some((a) => a.toLowerCase() === domain)

// Only domains classified as a customer (active or potential) are routed;
// everything else has no use here.
export const isCustomerDomain = (d: CrmIngestedDomain) =>
  d.status === 'ACTIVE_CUSTOMER' || d.status === 'POTENTIAL_CUSTOMER'

const CREATE_NEW = '__create_new__'

// Fixing a mistaken classification here drops the domain from the list.
const CLASSIFICATION_OPTIONS: EditOption[] = [
  { value: 'ACTIVE_CUSTOMER', label: 'Active Customer' },
  { value: 'POTENTIAL_CUSTOMER', label: 'Potential Customer' },
  { value: 'OTHER', label: 'Not a Customer' },
  { value: 'new', label: 'Unclassified' },
]

type RoutedDomain = CrmIngestedDomain & { routedTo: string | null }

// Customer domains still waiting for a customer. A domain leaves the list once
// a customer the CRM classifies as active/potential lists it in its routing
// aliases; the full customer list (segment 'all') decides who currently holds
// it, so a domain parked on an unclassified customer shows as routed to it and
// is taken off it when re-routed instead of landing on a second customer.
export function useUnroutedCustomerDomains(): RoutedDomain[] {
  const domains = listData(useIngestedDomainsQuery(-1).data)
  const customers = listData(useRetailersQuery(-1).data)
  const allCustomers = listData(useCustomerSegmentQuery('all').data)
  return useMemo(
    () => domains
      .filter((d) => isCustomerDomain(d) && !d.customer_id && !customers.some((c) => hasDomain(c, d.domain.toLowerCase())))
      .map((d) => ({
        ...d,
        routedTo: allCustomers.find((c) => hasDomain(c, d.domain.toLowerCase()))?.id ?? null,
      })),
    [domains, customers, allCustomers],
  )
}

export function DomainRoutingPanel({ query }: { query: string }) {
  const domainsQuery = useIngestedDomainsQuery(-1)
  const customersQuery = useRetailersQuery(-1)
  const allCustomersQuery = useCustomerSegmentQuery('all')
  const pickerQuery = useCustomerPickerQuery(-1)
  const updateCustomer = useUpdateCustomerMutation()
  const customers = listData(customersQuery.data)
  const allCustomers = listData(allCustomersQuery.data)
  const picker = listData(pickerQuery.data)
  const customerById = useMemo(() => buildRetailerById(picker, allCustomers), [picker, allCustomers])
  const options = useMemo<EditOption[]>(
    () => [
      ...customerEditOptions(picker.filter((c) => customers.some((x) => x.id === c.id)), 'Not routed'),
      { value: CREATE_NEW, label: '+ Create new customer…' },
    ],
    [picker, customers],
  )
  // Aliases as last written, so several routes in a row (bulk edit) build on
  // each other instead of on the list as first loaded.
  const written = useRef(new Map<string, string>())
  const aliasesOf = (c: Retailer) => splitAliases(written.current.get(c.id) ?? c.routing_aliases)
  // One queue per customer: a save rewrites the customer's whole alias string,
  // so concurrent routes that read the same snapshot would overwrite each
  // other (last write wins, the other domains silently dropped). Every
  // read-modify-write of one customer runs strictly after the previous one and
  // reads the aliases when it runs, not when the edit started.
  const queues = useRef(new Map<string, Promise<unknown>>())
  const enqueue = <T,>(id: string, task: () => Promise<T>): Promise<T> => {
    const prev = queues.current.get(id) ?? Promise.resolve()
    const run = prev.then(task, task)
    queues.current.set(id, run.then(() => undefined, () => undefined))
    return run
  }

  const unrouted = useUnroutedCustomerDomains()
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return unrouted.filter((d) => !q || textOf(d.domain, d.display_name, d.last_sender, d.sample_subject).includes(q))
  }, [unrouted, query])

  const updateDomain = useUpdateIngestedDomainMutation()
  const [creating, setCreating] = useState<CrmIngestedDomain | null>(null)

  async function route(row: RoutedDomain, key: string, value: string, edit?: CellEditContext) {
    if (key === 'status') {
      try {
        await updateDomain.mutateAsync({ id: row.id, values: { status: value } })
      } catch (error) {
        if (edit?.bulk) throw error
        toast.error('Could not reclassify domain', { description: logError('DomainRoutingPanel.reclassify', error) })
      }
      return
    }
    if (key !== 'routedTo') return
    if (value === CREATE_NEW) {
      // A bulk edit cannot open the create dialog per row; report it as a
      // failed write so the table never claims it saved anything.
      if (edit?.bulk) throw new Error('Creating a customer is not available for a bulk edit — pick an existing customer.')
      setCreating(row)
      return
    }
    const domain = row.domain.toLowerCase()
    const save = async (id: string, aliases: string[]) => {
      const next = aliases.join(', ')
      await updateCustomer.mutateAsync({ id, values: { routing_aliases: next } })
      written.current.set(id, next)
    }
    try {
      // The target must exist before anything is taken off another customer.
      if (value && !allCustomers.some((c) => c.id === value)) {
        throw new Error('That customer could not be loaded; try again.')
      }
      // Take the domain off any customer that holds it — from the full list,
      // because an unclassified holder never shows up in the active feed —
      // then add it to the target. One write per customer through that
      // customer's queue; writes are queued in customer-id order so two
      // domains swapping between the same two customers can never wait on
      // each other.
      const writes = [
        ...allCustomers
          .filter((c) => c.id !== value && aliasesOf(c).some((a) => a.toLowerCase() === domain))
          .map((c) => ({ id: c.id, add: false })),
        ...(value ? [{ id: value, add: true }] : []),
      ].sort((a, b) => a.id.localeCompare(b.id))
      const removedFrom = new Set<string>()
      try {
        for (const w of writes) {
          if (w.add) {
            await enqueue(w.id, async () => {
              const target = allCustomers.find((c) => c.id === w.id)
              if (!target) throw new Error('That customer could not be loaded; try again.')
              const current = aliasesOf(target)
              if (!current.some((a) => a.toLowerCase() === domain)) await save(w.id, [...current, domain])
            })
          } else {
            const removed = await enqueue(w.id, async () => {
              const holder = allCustomers.find((c) => c.id === w.id)
              if (!holder) return false
              const current = aliasesOf(holder)
              const next = current.filter((a) => a.toLowerCase() !== domain)
              if (next.length === current.length) return false
              await save(w.id, next)
              return true
            })
            if (removed) removedFrom.add(w.id)
          }
        }
      } catch (error) {
        // A failed add must not strand the domain on no customer: put back
        // every removal that already committed before surfacing the error.
        for (const id of removedFrom) {
          await enqueue(id, async () => {
            const holder = allCustomers.find((c) => c.id === id)
            if (!holder) return
            const current = aliasesOf(holder)
            if (!current.some((a) => a.toLowerCase() === domain)) await save(id, [...current, domain])
          }).catch(() => undefined)
        }
        throw error
      }
      if (!edit?.bulk) toast.success(value ? `Emails from ${domain} will route to this customer` : `${domain} is no longer routed`)
    } catch (error) {
      if (edit?.bulk) throw error
      toast.error('Could not route domain', { description: logError('DomainRoutingPanel.route', error) })
    }
  }

  // Memoised so DataTable's column-keyed memos (filter, sort, distinct
  // values) survive every keystroke in the search box (issue #46).
  const columns: Column<RoutedDomain>[] = useMemo(
    () => [
      {
        key: 'domain',
        header: 'Domain',
        className: 'w-full max-w-0',
        sortValue: (r) => r.domain,
        filterValue: (r) => r.domain,
        cell: (r) => (
          <div className="min-w-0">
            <div className="truncate font-medium text-foreground">{r.domain}</div>
            <div className="truncate text-xs text-muted-foreground">{r.last_sender || r.sample_subject || ''}</div>
          </div>
        ),
      },
      {
        key: 'email_count',
        header: 'Emails',
        numeric: true,
        sortValue: (r) => r.email_count ?? 0,
        className: 'text-right tabular-nums',
        headClassName: 'text-right',
        cell: (r) => (r.email_count ?? 0).toLocaleString(),
      },
      {
        key: 'last_seen_at',
        header: 'Last seen',
        hideBelow: 'md',
        sortValue: (r) => r.last_seen_at ?? '',
        className: 'text-muted-foreground',
        cell: (r) => formatDateTime(r.last_seen_at),
      },
      {
        key: 'routedTo',
        header: 'Routes to',
        sortValue: (r) => (r.routedTo ? customerById.get(r.routedTo)?.name ?? '' : ''),
        filterValue: (r) => (r.routedTo ? 'Routed' : 'Not routed'),
        editOptions: options,
        editValue: (r) => r.routedTo ?? '',
        cell: (r) => {
          const holder = r.routedTo ? customerById.get(r.routedTo) : undefined
          return (
            <span className="text-muted-foreground">
              {holder ? `Routed to ${customerLabel(holder)}` : 'Not routed'}
            </span>
          )
        },
      },
      {
        key: 'status',
        header: 'Classification',
        hideBelow: 'md',
        sortValue: (r) => customerStatusLabel(r.status),
        filterValue: (r) => customerStatusLabel(r.status),
        editOptions: CLASSIFICATION_OPTIONS,
        editValue: (r) => r.status ?? 'new',
        cell: (r) => <StatusBadge tone={customerStatusTone(r.status)} dot>{customerStatusLabel(r.status)}</StatusBadge>,
      },
    ],
    [customerById, options],
  )

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Route sender domains.</span>{' '}
        Customer domains not yet tied to a customer. Pick one and the domain leaves this list; its emails — and any earlier ones skipped as not customer-related — are routed to that customer on the next pass.
      </p>
      <DataTable
        rows={rows}
        columns={columns}
        getRowId={(r) => r.id}
        onCellEdit={route}
        selectable
        loading={domainsQuery.isPending || customersQuery.isPending || allCustomersQuery.isPending || pickerQuery.isPending}
        emptyIcon={<Globe className="size-5" />}
        emptyTitle={query ? 'No domains match your search' : 'Every customer domain is routed'}
        emptyDescription={query ? 'Adjust your search.' : 'Mark a domain as an Active or Potential Customer on the Customers page and it appears here.'}
        initialSort={{ key: 'email_count', dir: 'desc' }}
        pageSize={50}
      />
      <CreateCustomerDialog key={creating?.id ?? 'none'} domain={creating} onClose={() => setCreating(null)} />
    </div>
  )
}
