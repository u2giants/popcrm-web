import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Database, Image, Link2, Plus, RotateCcw, Save, Search, Trash2, Upload, Wand2, X } from 'lucide-react'
import { AppPage, ListBar, SectionHeader } from '@/components/app/AppPage'
import { Combobox, type ComboOption } from '@/components/app/Combobox'
import { DataTable, type Column } from '@/components/app/DataTable'
import { ErrorState } from '@/components/app/states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CustomerLogo, LOGODEV_TOKEN, logoDevImageUrl, rootDomain } from '@/components/app/CustomerLogo'
import { CustomerRelationLogo } from '@/features/crm/components/CustomerRelationLogo'
import {
  createDepartment,
  deleteDepartment,
  setRetailerLogo,
  updateBuyer,
  updateDepartment,
  updateOpportunity,
  updateRetailer,
  uploadRetailerLogo,
} from '@/features/crm/api'
import { idOf, label, relatedName } from '@/features/crm/format'
import { uniqueValues, customerPickerOptions, isSelectableCustomer, buildRetailerById } from '@/features/crm/pages/_shared'
import {
  crmKeys,
  listData,
  useDepartmentsQuery,
  useIngestedContactsQuery,
  useCustomerPickerQuery,
  useOpportunitiesQuery,
} from '@/features/crm/queries'
import { logError } from '@/lib/errors'
import type { Buyer, CrmDepartment, CrmOpportunity, Retailer } from '@/lib/types'

type AdminTab = 'departments' | 'logos' | 'contact-values' | 'division-values'
type LogoCandidate = {
  key: string
  label: string
  value: string
  domain: string | null
  url: string
}

interface DepartmentForm {
  id: string
  name: string
  retailer: string
  primary_buyer: string
  category: string
  division: string
}

function departmentForm(row?: CrmDepartment): DepartmentForm {
  return {
    id: row?.id ?? '',
    name: row?.name ?? '',
    retailer: idOf(row?.retailer),
    primary_buyer: idOf(row?.primary_buyer),
    category: row?.category ?? '',
    division: row?.division ?? '',
  }
}

function valueOptions(values: string[]): ComboOption[] {
  return values.map((v) => ({ value: v, label: label(v) }))
}

function sanitizeFileToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'customer'
}

export function DataAdminPage() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<AdminTab>('departments')
  const buyersQuery = useIngestedContactsQuery(-1)
  const departmentsQuery = useDepartmentsQuery(-1)
  const opportunitiesQuery = useOpportunitiesQuery(-1)
  const retailersQuery = useCustomerPickerQuery(-1)
  const buyers = listData(buyersQuery.data)
  const departments = listData(departmentsQuery.data)
  const opportunities = listData(opportunitiesQuery.data)
  const retailers = listData(retailersQuery.data)
  const loading = buyersQuery.isPending || departmentsQuery.isPending || opportunitiesQuery.isPending || retailersQuery.isPending
  const error = buyersQuery.isError || departmentsQuery.isError || opportunitiesQuery.isError || retailersQuery.isError
  const refresh = () => {
    void buyersQuery.refetch()
    void departmentsQuery.refetch()
    void opportunitiesQuery.refetch()
    void retailersQuery.refetch()
  }
  const [departmentDraft, setDepartmentDraft] = useState<DepartmentForm>(() => departmentForm())
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('')
  const [typeToMove, setTypeToMove] = useState('')
  const [divisionFrom, setDivisionFrom] = useState('')
  const [divisionTo, setDivisionTo] = useState('')
  const [busy, setBusy] = useState(false)
  const [logoBusy, setLogoBusy] = useState(false)
  const [selectedLogoCustomerId, setSelectedLogoCustomerId] = useState('')
  const [logoDomainDraft, setLogoDomainDraft] = useState('')
  const [logoUrlDraft, setLogoUrlDraft] = useState('')

  const retailerOptions = useMemo<ComboOption[]>(
    () => customerPickerOptions(retailers, departmentDraft.retailer, (r) => (r.customer_status ? label(r.customer_status) : undefined)),
    [retailers, departmentDraft.retailer],
  )
  const retailerById = useMemo(() => buildRetailerById(retailers), [retailers])
  // The Logos tab manages customers that appear in pickers — same active/potential set.
  const logoCustomers = useMemo(() => retailers.filter((r) => isSelectableCustomer(r.status)), [retailers])
  const contactOptions = useMemo<ComboOption[]>(
    () => buyers.map((b) => ({ value: b.id, label: b.name, hint: relatedName(b.retailer) })),
    [buyers],
  )
  const typeValues = useMemo(
    () => uniqueValues(buyers, (b) => b.contact_type).map((o) => o.value),
    [buyers],
  )
  const titleValues = useMemo(
    () => uniqueValues(buyers, (b) => b.job_title).map((o) => o.value),
    [buyers],
  )
  const divisionValues = useMemo(
    () => Array.from(new Set([
      ...uniqueValues(departments, (d) => d.division).map((o) => o.value),
      ...uniqueValues(opportunities, (o) => o.division).map((o) => o.value),
    ])).sort((a, b) => label(a).localeCompare(label(b))),
    [departments, opportunities],
  )

  const selectedDepartment = departments.find((d) => d.id === selectedDepartmentId)
  const selectedLogoCustomer = logoCustomers.find((r) => r.id === selectedLogoCustomerId)
  const moveCandidates = buyers.filter((b) => b.contact_type && (!typeToMove || b.contact_type === typeToMove))
  const moveOverwriteCount = moveCandidates.filter((b) => b.job_title).length
  const divisionDepartmentCount = departments.filter((d) => d.division === divisionFrom).length
  const divisionProgramCount = opportunities.filter((o) => o.division === divisionFrom).length

  const logoCandidates = useMemo<LogoCandidate[]>(() => {
    if (!selectedLogoCustomer) return []
    const candidates: LogoCandidate[] = []
    const seen = new Set<string>()
    const addDomain = (raw: string | null | undefined, candidateLabel: string) => {
      const domain = rootDomain(raw)
      const url = logoDevImageUrl(domain, { width: 192, height: 64, format: 'png', theme: 'dark', fallback: '404' })
      if (!domain || !url || seen.has(`domain:${domain}`)) return
      seen.add(`domain:${domain}`)
      candidates.push({ key: `domain:${domain}`, label: candidateLabel, value: domain, domain, url })
    }
    addDomain(selectedLogoCustomer.domain, 'Current domain')
    addDomain(logoDomainDraft, 'Typed domain')
    const nameUrl = logoDevImageUrl(selectedLogoCustomer.name, { mode: 'name', width: 192, height: 64, format: 'png', theme: 'dark', fallback: '404' })
    if (nameUrl) {
      candidates.push({
        key: `name:${selectedLogoCustomer.id}`,
        label: 'Name match',
        value: selectedLogoCustomer.name,
        domain: null,
        url: nameUrl,
      })
    }
    return candidates
  }, [logoDomainDraft, selectedLogoCustomer])

  const departmentColumns: Column<CrmDepartment>[] = [
    {
      key: 'name',
      header: 'Department',
      opensDetail: true,
      sortValue: (d) => d.name?.toLowerCase() ?? '',
      filterValue: (d) => d.name,
      cell: (d) => <span className="font-medium text-foreground">{d.name || 'Untitled department'}</span>,
    },
    {
      key: 'retailer',
      header: 'Customer',
      sortValue: (d) => relatedName(d.retailer),
      filterValue: (d) => relatedName(d.retailer),
      cell: (d) => <CustomerRelationLogo value={d.retailer} customerById={retailerById} />,
    },
    {
      key: 'primary_buyer',
      header: 'Primary contact',
      hideBelow: 'lg',
      sortValue: (d) => relatedName(d.primary_buyer),
      filterValue: (d) => relatedName(d.primary_buyer),
      cell: (d) => <span className="text-muted-foreground">{relatedName(d.primary_buyer)}</span>,
    },
    {
      key: 'division',
      header: 'Division',
      hideBelow: 'md',
      sortValue: (d) => d.division ?? '',
      filterValue: (d) => label(d.division),
      cell: (d) => d.division ? <Badge variant="outline">{label(d.division)}</Badge> : '—',
    },
  ]

  const logoColumns: Column<Retailer>[] = [
    {
      key: 'name',
      header: 'Customer',
      sortValue: (r) => r.name?.toLowerCase(),
      filterValue: (r) => r.name,
      cell: (r) => <CustomerRelationLogo value={r} size={24} variant="token-name" />,
    },
    {
      key: 'domain',
      header: 'Domain',
      sortValue: (r) => r.domain ?? '',
      filterValue: (r) => r.domain ?? '',
      cell: (r) => r.domain ? <span className="font-mono text-[11.5px]">{r.domain}</span> : <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'token',
      header: 'Token logo.dev',
      filterValue: (r) => (r.domain ? 'Has domain' : 'No domain'),
      cell: (r) => <CustomerLogo name={r.name} domain={r.domain} size={28} />,
    },
    {
      key: 'full-logo',
      header: 'Stored full logo',
      minWidth: 150,
      filterValue: (r) => (r.logo_url ? 'Has stored full logo' : 'No stored full logo'),
      cell: (r) =>
        r.logo_url ? (
          <span className="flex h-9 w-[136px] items-center">
            <CustomerLogo name={r.name} domain={r.domain} logoUrl={r.logo_url} variant="full" width={128} height={32} />
          </span>
        ) : (
          <span className="text-muted-foreground">No stored full logo</span>
        ),
    },
    {
      key: 'source',
      header: 'Source',
      hideBelow: 'lg',
      sortValue: (r) => (r.logo_url ? 'Stored full logo' : r.domain ? 'Logo.dev token only' : 'Initials fallback'),
      filterValue: (r) => (r.logo_url ? 'Stored full logo' : r.domain ? 'Logo.dev token only' : 'Initials fallback'),
      cell: (r) => (
        <Badge variant={r.logo_url ? 'secondary' : 'outline'}>
          {r.logo_url ? 'Stored full logo' : r.domain ? 'Logo.dev token only' : 'Initials fallback'}
        </Badge>
      ),
    },
    {
      key: 'edit',
      header: '',
      cell: (r) => (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={(event) => {
            event.stopPropagation()
            editLogoCustomer(r)
          }}
        >
          <Image className="size-4" />
          Edit
        </Button>
      ),
    },
  ]

  function editDepartment(row: CrmDepartment) {
    setSelectedDepartmentId(row.id)
    setDepartmentDraft(departmentForm(row))
  }

  function editLogoCustomer(row: Retailer) {
    setSelectedLogoCustomerId(row.id)
    setLogoDomainDraft(row.domain ?? '')
    setLogoUrlDraft(row.logo_url ?? '')
  }

  function patchRetailer(id: string, values: Partial<Retailer>) {
    const updateRows = (rows: Retailer[] | undefined) => rows?.map((r) => (r.id === id ? { ...r, ...values } : r))
    queryClient.setQueriesData<Retailer[]>({ queryKey: [...crmKeys.all, 'retailers'] }, updateRows)
    queryClient.setQueriesData<Retailer[]>({ queryKey: [...crmKeys.all, 'customerSegment'] }, updateRows)
  }

  async function saveTokenDomain(domain: string) {
    if (!selectedLogoCustomer) return
    const normalized = rootDomain(domain)
    if (!normalized) {
      toast.error('Enter a domain like target.com')
      return
    }
    setLogoBusy(true)
    try {
      await updateRetailer(selectedLogoCustomer.id, { domain: normalized })
      patchRetailer(selectedLogoCustomer.id, { domain: normalized })
      setLogoDomainDraft(normalized)
      toast.success('Token logo domain saved')
    } catch (error) {
      toast.error('Could not save logo domain', { description: logError('DataAdminPage.saveTokenDomain', error) })
    } finally {
      setLogoBusy(false)
    }
  }

  async function saveFullLogo(url: string | null) {
    if (!selectedLogoCustomer) return
    const cleanUrl = url?.trim() || null
    setLogoBusy(true)
    try {
      await setRetailerLogo(selectedLogoCustomer.id, cleanUrl)
      patchRetailer(selectedLogoCustomer.id, { logo_url: cleanUrl })
      setLogoUrlDraft(cleanUrl ?? '')
      toast.success(cleanUrl ? 'Full logo saved' : 'Full logo override cleared')
    } catch (error) {
      toast.error('Could not save full logo', { description: logError('DataAdminPage.saveFullLogo', error) })
    } finally {
      setLogoBusy(false)
    }
  }

  async function uploadFullLogo(file: File | null | undefined) {
    if (!selectedLogoCustomer || !file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Choose an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo files must be 5 MB or smaller')
      return
    }
    setLogoBusy(true)
    try {
      const renamed = new File([file], `${sanitizeFileToken(selectedLogoCustomer.name)}-${file.name}`, { type: file.type })
      const url = await uploadRetailerLogo(selectedLogoCustomer.id, renamed)
      await setRetailerLogo(selectedLogoCustomer.id, url)
      patchRetailer(selectedLogoCustomer.id, { logo_url: url })
      setLogoUrlDraft(url)
      toast.success('Logo uploaded')
    } catch (error) {
      toast.error('Could not upload logo', { description: logError('DataAdminPage.uploadFullLogo', error) })
    } finally {
      setLogoBusy(false)
    }
  }

  async function saveDepartment() {
    const name = departmentDraft.name.trim()
    if (!name) {
      toast.error('Department name is required')
      return
    }
    setBusy(true)
    const payload = {
      name,
      retailer: departmentDraft.retailer || null,
      primary_buyer: departmentDraft.primary_buyer || null,
      category: departmentDraft.category.trim() || null,
      division: departmentDraft.division.trim() || null,
      active: true,
    }
    try {
      if (departmentDraft.id) {
        await updateDepartment(departmentDraft.id, payload)
        queryClient.setQueryData<CrmDepartment[]>(crmKeys.departments(-1), (rows = []) =>
          rows.map((d) =>
            d.id === departmentDraft.id
              ? {
                  ...d,
                  ...payload,
                  retailer: retailers.find((r) => r.id === departmentDraft.retailer) ?? null,
                  primary_buyer: buyers.find((b) => b.id === departmentDraft.primary_buyer) ?? null,
                }
              : d,
          ),
        )
        toast.success('Department updated')
      } else {
        const created = await createDepartment(payload)
        queryClient.setQueryData<CrmDepartment[]>(crmKeys.departments(-1), (rows = []) => [
          ...rows,
          {
            ...created,
            name,
            category: payload.category,
            division: payload.division,
            active: true,
            retailer: retailers.find((r) => r.id === departmentDraft.retailer) ?? null,
            primary_buyer: buyers.find((b) => b.id === departmentDraft.primary_buyer) ?? null,
          },
        ])
        setDepartmentDraft(departmentForm())
        setSelectedDepartmentId('')
        toast.success('Department created')
      }
    } catch (error) {
      toast.error('Could not save department', { description: logError('DataAdminPage.saveDepartment', error) })
    } finally {
      setBusy(false)
    }
  }

  async function removeDepartment() {
    if (!departmentDraft.id || !selectedDepartment) return
    const inUse = buyers.some((b) => idOf(b.department) === departmentDraft.id) ||
      opportunities.some((o) => idOf(o.department) === departmentDraft.id)
    if (inUse) {
      toast.error('This department is in use. Reassign contacts/programs before deleting it.')
      return
    }
    setBusy(true)
    try {
      await deleteDepartment(departmentDraft.id)
      queryClient.setQueryData<CrmDepartment[]>(crmKeys.departments(-1), (rows = []) => rows.filter((d) => d.id !== departmentDraft.id))
      setDepartmentDraft(departmentForm())
      setSelectedDepartmentId('')
      toast.success('Department deleted')
    } catch (error) {
      toast.error('Could not delete department', { description: logError('DataAdminPage.removeDepartment', error) })
    } finally {
      setBusy(false)
    }
  }

  async function moveTypeToTitle() {
    if (!moveCandidates.length) return
    setBusy(true)
    const previous = buyers
    const next = buyers.map((b) =>
      b.contact_type && (!typeToMove || b.contact_type === typeToMove)
        ? { ...b, job_title: b.job_title || b.contact_type, contact_type: null }
        : b,
    )
    queryClient.setQueryData<Buyer[]>(crmKeys.ingestedContacts(-1), next)
    try {
      await Promise.all(
        moveCandidates.map((b) =>
          updateBuyer(b.id, {
            job_title: b.job_title || b.contact_type,
            contact_type: null,
            retailer: b.retailer,
          } as Partial<Buyer>),
        ),
      )
      toast.success(`Updated ${moveCandidates.length.toLocaleString()} contacts`)
      setTypeToMove('')
    } catch (error) {
      queryClient.setQueryData<Buyer[]>(crmKeys.ingestedContacts(-1), previous)
      toast.error('Could not move Type values', { description: logError('DataAdminPage.moveTypeToTitle', error) })
    } finally {
      setBusy(false)
    }
  }

  async function replaceDivision() {
    const nextValue = divisionTo.trim()
    if (!divisionFrom || !nextValue || divisionFrom === nextValue) return
    const departmentRows = departments.filter((d) => d.division === divisionFrom)
    const programRows = opportunities.filter((o) => o.division === divisionFrom)
    setBusy(true)
    const previousDepartments = departments
    const previousOpportunities = opportunities
    queryClient.setQueryData<CrmDepartment[]>(crmKeys.departments(-1), (rows = []) =>
      rows.map((d) => (d.division === divisionFrom ? { ...d, division: nextValue } : d)),
    )
    queryClient.setQueryData<CrmOpportunity[]>(crmKeys.opportunities(-1), (rows = []) =>
      rows.map((o) => (o.division === divisionFrom ? { ...o, division: nextValue } : o)),
    )
    try {
      await Promise.all([
        ...departmentRows.map((d) => updateDepartment(d.id, { division: nextValue })),
        ...programRows.map((o) => updateOpportunity(o.id, { division: nextValue })),
      ])
      toast.success(`Renamed division on ${(departmentRows.length + programRows.length).toLocaleString()} records`)
      setDivisionFrom('')
      setDivisionTo('')
    } catch (error) {
      queryClient.setQueryData<CrmDepartment[]>(crmKeys.departments(-1), previousDepartments)
      queryClient.setQueryData<CrmOpportunity[]>(crmKeys.opportunities(-1), previousOpportunities)
      toast.error('Could not rename division', { description: logError('DataAdminPage.replaceDivision', error) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppPage
      listBar={
        <ListBar
          title="Data Admin"
          subtitle="Manage dropdown records and cleanup values"
          segments={
            <Tabs value={tab} onValueChange={(v) => setTab(v as AdminTab)}>
              <TabsList>
                <TabsTrigger value="departments">Departments</TabsTrigger>
                <TabsTrigger value="logos">Logos</TabsTrigger>
                <TabsTrigger value="contact-values">Contact Values</TabsTrigger>
                <TabsTrigger value="division-values">Divisions</TabsTrigger>
              </TabsList>
            </Tabs>
          }
        />
      }
    >
      {error ? (
        <ErrorState onRetry={refresh} />
      ) : (
        <div className="grid w-full gap-5 p-4 sm:p-6 lg:p-8">
          {tab === 'departments' ? (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
              <section className="min-w-0 rounded-[8px] border bg-card shadow-[var(--shadow-xs)]">
                <div className="border-b p-4">
                  <SectionHeader title="Department Directory" description={`${departments.length.toLocaleString()} customer-linked departments`} />
                </div>
                <DataTable
                  rows={departments}
                  columns={departmentColumns}
                  getRowId={(d) => d.id}
                  onRowClick={editDepartment}
                  loading={loading}
                  pageSize={25}
                  emptyIcon={<Database className="size-5" />}
                  emptyTitle="No departments yet"
                  emptyDescription="Add departments here and they will appear in customer-dependent dropdowns."
                  initialSort={{ key: 'retailer', dir: 'asc' }}
                />
              </section>

              <section className="rounded-[8px] border bg-card p-4 shadow-[var(--shadow-xs)]">
                <SectionHeader
                  title={departmentDraft.id ? 'Edit Department' : 'Add Department'}
                  description="Departments feed customer-dependent dropdowns."
                />
                <div className="mt-4 grid gap-3">
                  <div className="grid gap-1.5">
                    <Label>Name</Label>
                    <Input
                      value={departmentDraft.name}
                      onChange={(e) => setDepartmentDraft((d) => ({ ...d, name: e.target.value }))}
                      placeholder="Buying, Seasonal, Ecommerce..."
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Customer</Label>
                    <Combobox
                      options={retailerOptions}
                      value={departmentDraft.retailer}
                      onChange={(v) => setDepartmentDraft((d) => ({ ...d, retailer: v }))}
                      placeholder="Select customer"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Primary Contact</Label>
                    <Combobox
                      options={contactOptions}
                      value={departmentDraft.primary_buyer}
                      onChange={(v) => setDepartmentDraft((d) => ({ ...d, primary_buyer: v }))}
                      placeholder="Select contact"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Category</Label>
                    <Input
                      value={departmentDraft.category}
                      onChange={(e) => setDepartmentDraft((d) => ({ ...d, category: e.target.value }))}
                      placeholder="Optional category"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Division</Label>
                    <Input
                      value={departmentDraft.division}
                      onChange={(e) => setDepartmentDraft((d) => ({ ...d, division: e.target.value }))}
                      placeholder="Optional division"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button onClick={saveDepartment} disabled={busy}>
                      {departmentDraft.id ? <Save className="size-4" /> : <Plus className="size-4" />}
                      {departmentDraft.id ? 'Save' : 'Add'}
                    </Button>
                    {departmentDraft.id ? (
                      <>
                        <Button variant="outline" onClick={() => { setDepartmentDraft(departmentForm()); setSelectedDepartmentId('') }} disabled={busy}>
                          New
                        </Button>
                        <Button variant="outline" onClick={removeDepartment} disabled={busy}>
                          <Trash2 className="size-4" />
                          Delete
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              </section>
            </div>
          ) : null}

          {tab === 'logos' ? (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
              <section className="min-w-0 rounded-[8px] border bg-card shadow-[var(--shadow-xs)]">
                <div className="border-b p-4">
                  <SectionHeader
                    title="Customer Logos"
                    description={`${logoCustomers.length.toLocaleString()} active/potential customer logo records`}
                  />
                </div>
                <DataTable
                  rows={logoCustomers}
                  columns={logoColumns}
                  getRowId={(r) => r.id}
                  onRowClick={editLogoCustomer}
                  loading={retailersQuery.isPending}
                  pageSize={50}
                  emptyIcon={<Database className="size-5" />}
                  emptyTitle="No customers found"
                  emptyDescription="Add customer domains or upload logos here once customers are available."
                  initialSort={{ key: 'name', dir: 'asc' }}
                />
              </section>

              <section className="rounded-[8px] border bg-card p-4 shadow-[var(--shadow-xs)]">
                <div className="flex items-start justify-between gap-3">
                  <SectionHeader
                    title={selectedLogoCustomer ? 'Edit Logo' : 'Pick a Customer'}
                    description={selectedLogoCustomer ? selectedLogoCustomer.name : 'Select a customer row to upload or match logos.'}
                  />
                  {selectedLogoCustomer ? (
                    <Button type="button" variant="outline" size="icon" onClick={() => setSelectedLogoCustomerId('')} aria-label="Close logo editor">
                      <X className="size-4" />
                    </Button>
                  ) : null}
                </div>

                {selectedLogoCustomer ? (
                  <div className="mt-4 grid gap-5">
                    <div className="grid gap-3 rounded-[8px] border bg-muted/20 p-3">
                      <div className="flex items-center gap-3">
                        <CustomerLogo name={selectedLogoCustomer.name} domain={selectedLogoCustomer.domain} size={34} />
                        <div className="min-w-0">
                          <div className="truncate font-medium text-foreground">{selectedLogoCustomer.name}</div>
                          <div className="truncate font-mono text-[11.5px] text-muted-foreground">{selectedLogoCustomer.domain || 'No token domain'}</div>
                        </div>
                      </div>
                      <div className="flex h-14 items-center rounded-[8px] border bg-background px-3">
                        {selectedLogoCustomer.logo_url ? (
                          <CustomerLogo
                            name={selectedLogoCustomer.name}
                            domain={selectedLogoCustomer.domain}
                            logoUrl={selectedLogoCustomer.logo_url}
                            variant="full"
                            width={190}
                            height={42}
                          />
                        ) : (
                          <span className="text-[12.5px] text-muted-foreground">No full logo override</span>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label>Upload full logo</Label>
                      <Input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        disabled={logoBusy}
                        onChange={(event) => {
                          const file = event.target.files?.[0]
                          void uploadFullLogo(file)
                          event.currentTarget.value = ''
                        }}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label>Full logo URL</Label>
                      <div className="flex gap-2">
                        <Input
                          value={logoUrlDraft}
                          onChange={(event) => setLogoUrlDraft(event.target.value)}
                          placeholder="https://..."
                          disabled={logoBusy}
                        />
                        <Button type="button" onClick={() => void saveFullLogo(logoUrlDraft)} disabled={logoBusy}>
                          <Link2 className="size-4" />
                          Save
                        </Button>
                      </div>
                      <Button type="button" variant="outline" onClick={() => void saveFullLogo(null)} disabled={logoBusy || !selectedLogoCustomer.logo_url}>
                        <RotateCcw className="size-4" />
                        Clear full logo override
                      </Button>
                    </div>

                    <div className="grid gap-2">
                      <Label>Token logo.dev domain</Label>
                      <div className="flex gap-2">
                        <Input
                          value={logoDomainDraft}
                          onChange={(event) => setLogoDomainDraft(event.target.value)}
                          placeholder="target.com"
                          disabled={logoBusy}
                        />
                        <Button type="button" onClick={() => void saveTokenDomain(logoDomainDraft)} disabled={logoBusy}>
                          <Save className="size-4" />
                          Save
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-3">
                      <div className="flex items-center justify-between gap-2">
                        <Label>logo.dev matches</Label>
                        <Badge variant={LOGODEV_TOKEN ? 'secondary' : 'outline'}>{LOGODEV_TOKEN ? 'Enabled' : 'No token'}</Badge>
                      </div>
                      {!LOGODEV_TOKEN ? (
                        <div className="rounded-[8px] border bg-muted/20 p-3 text-[12.5px] text-muted-foreground">
                          Set the publishable logo.dev token to preview and apply logo.dev matches.
                        </div>
                      ) : (
                        <div className="grid gap-2">
                          {logoCandidates.map((candidate) => (
                            <div key={candidate.key} className="grid gap-3 rounded-[8px] border p-3">
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="text-[12.5px] font-medium text-foreground">{candidate.label}</div>
                                  <div className="truncate font-mono text-[11.5px] text-muted-foreground">{candidate.value}</div>
                                </div>
                                <div className="flex h-12 w-36 items-center justify-center rounded-[8px] border bg-background px-2">
                                  <img src={candidate.url} alt="" aria-hidden className="max-h-9 max-w-full object-contain" />
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Button type="button" size="sm" onClick={() => void saveFullLogo(candidate.url)} disabled={logoBusy}>
                                  <Upload className="size-4" />
                                  Use as full
                                </Button>
                                {candidate.domain ? (
                                  <Button type="button" size="sm" variant="outline" onClick={() => void saveTokenDomain(candidate.domain!)} disabled={logoBusy}>
                                    <Search className="size-4" />
                                    Use as token
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-[8px] border bg-muted/20 p-4 text-[12.5px] text-muted-foreground">
                    Click a row to edit uploaded full logos, full logo URLs, and logo.dev token domains.
                  </div>
                )}
              </section>
            </div>
          ) : null}

          {tab === 'contact-values' ? (
            <div className="grid gap-5 lg:grid-cols-2">
              <section className="rounded-[8px] border bg-card p-4 shadow-[var(--shadow-xs)]">
                <SectionHeader
                  title="Move Type Into Title"
                  description="Fill empty contact titles from Type, then clear Type."
                />
                <div className="mt-4 grid gap-3">
                  <div className="grid gap-1.5">
                    <Label>Type value</Label>
                    <Combobox
                      options={valueOptions(typeValues)}
                      value={typeToMove}
                      onChange={setTypeToMove}
                      placeholder="All Type values"
                      clearLabel="All Type values"
                    />
                  </div>
                  <div className="grid gap-2 rounded-[8px] border bg-muted/25 p-3 text-[12.5px] text-muted-foreground">
                    <div className="flex justify-between gap-2">
                      <span>Contacts affected</span>
                      <Badge variant="outline">{moveCandidates.length.toLocaleString()}</Badge>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span>Already have Title</span>
                      <Badge variant="outline">{moveOverwriteCount.toLocaleString()}</Badge>
                    </div>
                  </div>
                  <Button onClick={moveTypeToTitle} disabled={busy || !moveCandidates.length}>
                    <Wand2 className="size-4" />
                    Move and Clear Type
                  </Button>
                </div>
              </section>

              <section className="rounded-[8px] border bg-card p-4 shadow-[var(--shadow-xs)]">
                <SectionHeader
                  title="Current Contact Values"
                  description="Values currently present in contact records."
                />
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <ValueList title="Titles" values={titleValues} />
                  <ValueList title="Types" values={typeValues} />
                </div>
              </section>
            </div>
          ) : null}

          {tab === 'division-values' ? (
            <div className="grid gap-5 lg:grid-cols-2">
              <section className="rounded-[8px] border bg-card p-4 shadow-[var(--shadow-xs)]">
                <SectionHeader
                  title="Rename Division"
                  description="Update matching department and program records."
                />
                <div className="mt-4 grid gap-3">
                  <div className="grid gap-1.5">
                    <Label>Current division</Label>
                    <Combobox
                      options={valueOptions(divisionValues)}
                      value={divisionFrom}
                      onChange={setDivisionFrom}
                      placeholder="Select division"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>New division</Label>
                    <Input value={divisionTo} onChange={(e) => setDivisionTo(e.target.value)} placeholder="Clean division name" />
                  </div>
                  <div className="grid gap-2 rounded-[8px] border bg-muted/25 p-3 text-[12.5px] text-muted-foreground">
                    <div className="flex justify-between gap-2">
                      <span>Departments</span>
                      <Badge variant="outline">{divisionDepartmentCount.toLocaleString()}</Badge>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span>Programs</span>
                      <Badge variant="outline">{divisionProgramCount.toLocaleString()}</Badge>
                    </div>
                  </div>
                  <Button onClick={replaceDivision} disabled={busy || !divisionFrom || !divisionTo.trim() || divisionFrom === divisionTo.trim()}>
                    <Save className="size-4" />
                    Rename Division
                  </Button>
                </div>
              </section>

              <section className="rounded-[8px] border bg-card p-4 shadow-[var(--shadow-xs)]">
                <SectionHeader title="Current Divisions" description="Distinct values from departments and programs." />
                <div className="mt-4">
                  <ValueList title="Divisions" values={divisionValues} />
                </div>
              </section>
            </div>
          ) : null}
        </div>
      )}
    </AppPage>
  )
}

function ValueList({ title, values }: { title: string; values: string[] }) {
  return (
    <div className="min-w-0 rounded-[8px] border">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <span className="text-[12px] font-semibold">{title}</span>
        <Badge variant="outline">{values.length.toLocaleString()}</Badge>
      </div>
      <div className="max-h-72 overflow-y-auto p-2">
        {values.length ? (
          <div className="flex flex-wrap gap-1.5">
            {values.map((v) => (
              <Badge key={v} variant="secondary" className="max-w-full truncate">
                {label(v)}
              </Badge>
            ))}
          </div>
        ) : (
          <div className="px-2 py-6 text-center text-sm text-muted-foreground">No values yet</div>
        )}
      </div>
    </div>
  )
}
