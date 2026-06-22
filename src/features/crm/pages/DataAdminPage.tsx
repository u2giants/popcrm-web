import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Database, Plus, Save, Trash2, Wand2 } from 'lucide-react'
import { AppPage, ListBar, SectionHeader } from '@/components/app/AppPage'
import { Combobox, type ComboOption } from '@/components/app/Combobox'
import { DataTable, type Column } from '@/components/app/DataTable'
import { ErrorState } from '@/components/app/states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  createDepartment,
  deleteDepartment,
  updateBuyer,
  updateDepartment,
  updateOpportunity,
} from '@/features/crm/api'
import { idOf, label, relatedName } from '@/features/crm/format'
import { uniqueValues } from '@/features/crm/pages/_shared'
import {
  crmKeys,
  listData,
  useDepartmentsQuery,
  useIngestedContactsQuery,
  useIngestedDomainsQuery,
  useOpportunitiesQuery,
} from '@/features/crm/queries'
import type { Buyer, CrmDepartment, CrmOpportunity } from '@/lib/types'

type AdminTab = 'departments' | 'contact-values' | 'division-values'

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

export function DataAdminPage() {
  const queryClient = useQueryClient()
  const buyersQuery = useIngestedContactsQuery(-1)
  const departmentsQuery = useDepartmentsQuery(-1)
  const opportunitiesQuery = useOpportunitiesQuery(-1)
  const retailersQuery = useIngestedDomainsQuery(-1)
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
  const [tab, setTab] = useState<AdminTab>('departments')
  const [departmentDraft, setDepartmentDraft] = useState<DepartmentForm>(() => departmentForm())
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('')
  const [typeToMove, setTypeToMove] = useState('')
  const [divisionFrom, setDivisionFrom] = useState('')
  const [divisionTo, setDivisionTo] = useState('')
  const [busy, setBusy] = useState(false)

  const retailerOptions = useMemo<ComboOption[]>(
    () => retailers.map((r) => ({ value: r.id, label: r.name, hint: r.customer_status ? label(r.customer_status) : undefined })),
    [retailers],
  )
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
  const moveCandidates = buyers.filter((b) => b.contact_type && (!typeToMove || b.contact_type === typeToMove))
  const moveOverwriteCount = moveCandidates.filter((b) => b.job_title).length
  const divisionDepartmentCount = departments.filter((d) => d.division === divisionFrom).length
  const divisionProgramCount = opportunities.filter((o) => o.division === divisionFrom).length

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
      header: 'Account',
      sortValue: (d) => relatedName(d.retailer),
      filterValue: (d) => relatedName(d.retailer),
      cell: (d) => <span className="text-muted-foreground">{relatedName(d.retailer)}</span>,
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

  function editDepartment(row: CrmDepartment) {
    setSelectedDepartmentId(row.id)
    setDepartmentDraft(departmentForm(row))
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
    } catch {
      toast.error('Could not save department')
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
    } catch {
      toast.error('Could not delete department')
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
          } as Partial<Buyer>),
        ),
      )
      toast.success(`Updated ${moveCandidates.length.toLocaleString()} contacts`)
      setTypeToMove('')
    } catch {
      queryClient.setQueryData<Buyer[]>(crmKeys.ingestedContacts(-1), previous)
      toast.error('Could not move Type values')
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
    } catch {
      queryClient.setQueryData<CrmDepartment[]>(crmKeys.departments(-1), previousDepartments)
      queryClient.setQueryData<CrmOpportunity[]>(crmKeys.opportunities(-1), previousOpportunities)
      toast.error('Could not rename division')
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
        <div className="mx-auto grid max-w-6xl gap-5 p-4 sm:p-6 lg:p-8">
          {tab === 'departments' ? (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
              <section className="min-w-0 rounded-[8px] border bg-card shadow-[var(--shadow-xs)]">
                <div className="border-b p-4">
                  <SectionHeader title="Department Directory" description={`${departments.length.toLocaleString()} account-linked departments`} />
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
                  emptyDescription="Add departments here and they will appear in account-dependent dropdowns."
                  initialSort={{ key: 'retailer', dir: 'asc' }}
                />
              </section>

              <section className="rounded-[8px] border bg-card p-4 shadow-[var(--shadow-xs)]">
                <SectionHeader
                  title={departmentDraft.id ? 'Edit Department' : 'Add Department'}
                  description="Departments feed account-dependent dropdowns."
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
                    <Label>Account</Label>
                    <Combobox
                      options={retailerOptions}
                      value={departmentDraft.retailer}
                      onChange={(v) => setDepartmentDraft((d) => ({ ...d, retailer: v }))}
                      placeholder="Select account"
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
