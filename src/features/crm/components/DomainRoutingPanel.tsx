import { useMemo, useRef } from 'react'
import { toast } from 'sonner'
import { Globe } from 'lucide-react'
import { DataTable, type Column, type EditOption, type CellEditContext } from '@/components/app/DataTable'
import { CustomerRelationLogo } from '@/features/crm/components/CustomerRelationLogo'
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

type RoutedDomain = CrmIngestedDomain & { routedTo: string | null; how: 'manual' | 'auto' | null }

export function DomainRoutingPanel({ query }: { query: string }) {
  const domainsQuery = useIngestedDomainsQuery(-1)
  const customersQuery = useRetailersQuery(-1)
  const pickerQuery = useCustomerPickerQuery(-1)
  const updateCustomer = useUpdateCustomerMutation()
  const domains = listData(domainsQuery.data)
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

  const rows = useMemo<RoutedDomain[]>(() => {
    const q = query.trim().toLowerCase()
    return domains
      .map((d) => {
        const domain = d.domain.toLowerCase()
        const manual = customers.find((c) => hasDomain(c, domain))
        if (manual) return { ...d, routedTo: manual.id, how: 'manual' as const }
        if (d.customer_id) return { ...d, routedTo: d.customer_id, how: 'auto' as const }
        return { ...d, routedTo: null, how: null }
      })
      .filter((d) => !q || textOf(d.domain, d.display_name, d.last_sender, d.sample_subject, d.customer_name).includes(q))
  }, [domains, customers, query])

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
      cell: (r) =>
        r.routedTo ? (
          <div className="flex items-center gap-2">
            <CustomerRelationLogo value={r.routedTo} customerById={customerById} size={24} variant="token-name" />
            {r.how === 'auto' ? <span className="text-[11px] text-muted-foreground">auto</span> : null}
          </div>
        ) : (
          <span className="text-muted-foreground">Not routed</span>
        ),
    },
  ]

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Route sender domains.</span>{' '}
        Pick a customer for a domain and every email from that domain — new and existing — is routed to that customer.
      </p>
      <DataTable
        rows={rows}
        columns={columns}
        getRowId={(r) => r.id}
        onCellEdit={route}
        selectable
        loading={domainsQuery.isPending || customersQuery.isPending || pickerQuery.isPending}
        emptyIcon={<Globe className="size-5" />}
        emptyTitle={query ? 'No domains match your search' : 'No email domains yet'}
        emptyDescription={query ? 'Adjust your search.' : 'Domains appear here as emails arrive.'}
        initialSort={{ key: 'email_count', dir: 'desc' }}
        pageSize={50}
      />
    </div>
  )
}
