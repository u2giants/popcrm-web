import { useMemo, useRef } from 'react'
import { toast } from 'sonner'
import { Globe } from 'lucide-react'
import { DataTable, type Column, type EditOption, type CellEditContext } from '@/components/app/DataTable'
import { formatDateTime, textOf } from '@/features/crm/format'
import { customerEditOptions, buildRetailerById } from '@/features/crm/pages/_shared'
import {
  listData,
  useCustomerPickerQuery,
  useIngestedDomainsQuery,
  useRetailersQuery,
  useUpdateCustomerMutation,
} from '@/features/crm/queries'
import { logError } from '@/lib/errors'
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

type RoutedDomain = CrmIngestedDomain & { routedTo: string | null }

// Customer domains still waiting for a customer. A domain is routed once a
// customer lists it in its routing aliases or it auto-matches a customer's own
// domain; routed domains are done and leave the list.
export function useUnroutedCustomerDomains(): RoutedDomain[] {
  const domains = listData(useIngestedDomainsQuery(-1).data)
  const customers = listData(useRetailersQuery(-1).data)
  return useMemo(
    () => domains
      .filter((d) => isCustomerDomain(d) && !d.customer_id && !customers.some((c) => hasDomain(c, d.domain.toLowerCase())))
      .map((d) => ({ ...d, routedTo: null })),
    [domains, customers],
  )
}

export function DomainRoutingPanel({ query }: { query: string }) {
  const domainsQuery = useIngestedDomainsQuery(-1)
  const customersQuery = useRetailersQuery(-1)
  const pickerQuery = useCustomerPickerQuery(-1)
  const updateCustomer = useUpdateCustomerMutation()
  const customers = listData(customersQuery.data)
  const picker = listData(pickerQuery.data)
  const customerById = useMemo(() => buildRetailerById(picker, customers), [picker, customers])
  const options = useMemo<EditOption[]>(
    () => customerEditOptions(picker.filter((c) => customers.some((x) => x.id === c.id)), 'Not routed'),
    [picker, customers],
  )
  // Aliases as last written, so several routes in a row (bulk edit) build on
  // each other instead of on the list as first loaded.
  const written = useRef(new Map<string, string>())
  const aliasesOf = (c: Retailer) => splitAliases(written.current.get(c.id) ?? c.routing_aliases)

  const unrouted = useUnroutedCustomerDomains()
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return unrouted.filter((d) => !q || textOf(d.domain, d.display_name, d.last_sender, d.sample_subject).includes(q))
  }, [unrouted, query])

  async function route(row: RoutedDomain, key: string, value: string, edit?: CellEditContext) {
    if (key !== 'routedTo') return
    const domain = row.domain.toLowerCase()
    try {
      // Take the domain off any customer it was routed to before.
      const save = async (id: string, aliases: string[]) => {
        const next = aliases.join(', ')
        await updateCustomer.mutateAsync({ id, values: { routing_aliases: next } })
        written.current.set(id, next)
      }
      for (const c of customers) {
        const current = aliasesOf(c)
        if (c.id !== value && current.some((a) => a.toLowerCase() === domain)) {
          await save(c.id, current.filter((a) => a.toLowerCase() !== domain))
        }
      }
      if (value) {
        const target = customers.find((c) => c.id === value)
        if (!target) throw new Error('That customer could not be loaded; try again.')
        const current = aliasesOf(target)
        if (!current.some((a) => a.toLowerCase() === domain)) await save(value, [...current, domain])
      }
      if (!edit?.bulk) toast.success(value ? `Emails from ${domain} will route to this customer` : `${domain} is no longer routed`)
    } catch (error) {
      if (edit?.bulk) throw error
      toast.error('Could not route domain', { description: logError('DomainRoutingPanel.route', error) })
    }
  }

  const columns: Column<RoutedDomain>[] = [
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
      cell: () => <span className="text-muted-foreground">Not routed</span>,
    },
  ]

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
        loading={domainsQuery.isPending || customersQuery.isPending || pickerQuery.isPending}
        emptyIcon={<Globe className="size-5" />}
        emptyTitle={query ? 'No domains match your search' : 'Every customer domain is routed'}
        emptyDescription={query ? 'Adjust your search.' : 'Mark a domain as an Active or Potential Customer on the Customers page and it appears here.'}
        initialSort={{ key: 'email_count', dir: 'desc' }}
        pageSize={50}
      />
    </div>
  )
}
