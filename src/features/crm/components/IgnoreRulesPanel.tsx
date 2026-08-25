import { useState } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { SectionHeader } from '@/components/app/AppPage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MATCH_TYPES } from '@/features/crm/constants'
import { label } from '@/features/crm/format'
import { listData, useCreateIgnoreRuleMutation, useIgnoreRulesQuery } from '@/features/crm/queries'
import { logError } from '@/lib/errors'

export function IgnoreRulesPanel() {
  const ignoreRulesQuery = useIgnoreRulesQuery()
  const createIgnoreRuleMutation = useCreateIgnoreRuleMutation()
  const ignoreRules = listData(ignoreRulesQuery.data)
  const [emailAddress, setEmailAddress] = useState('')
  const [domain, setDomain] = useState('')
  const [subjectPattern, setSubjectPattern] = useState('')
  const [matchType, setMatchType] = useState<string>('CONTAINS')
  const [busy, setBusy] = useState(false)

  async function add(ruleType: 'EMAIL_ADDRESS' | 'DOMAIN' | 'SUBJECT', rawValue: string, clear: () => void) {
    const trimmed = rawValue.trim()
    const value = ruleType === 'SUBJECT'
      ? trimmed
      : ruleType === 'DOMAIN'
        ? trimmed.toLowerCase().replace(/^@/, '')
        : trimmed.toLowerCase()
    if (!value) return
    setBusy(true)
    try {
      await createIgnoreRuleMutation.mutateAsync({
        name: value,
        pattern: value,
        rule_type: ruleType,
        match_type: ruleType === 'SUBJECT' ? matchType : 'EXACT',
        emails_skipped: 0,
      })
      clear()
      toast.success('Not-customer rule added')
    } catch (error) {
      toast.error('Could not add not-customer rule', { description: logError('IgnoreRulesPanel.add', error) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-[12px] border bg-card p-5 shadow-[var(--shadow-xs)]">
      <SectionHeader
        title="Not-customer rules"
        description="Automatically disregard known non-customer email addresses, domains, or subject patterns. Address and domain rules apply only when no Customer domain is present."
      />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[10px] border p-4">
          <label className="text-[12.5px] font-semibold" htmlFor="not-customer-email">Exact email address</label>
          <p className="mt-0.5 text-[11.5px] text-muted-foreground">Ignore messages involving this specific address.</p>
          <div className="mt-3 flex gap-2">
            <Input
              id="not-customer-email"
              type="email"
              value={emailAddress}
              onChange={(event) => setEmailAddress(event.target.value)}
              placeholder="person@example.com"
              onKeyDown={(event) => { if (event.key === 'Enter') void add('EMAIL_ADDRESS', emailAddress, () => setEmailAddress('')) }}
            />
            <Button onClick={() => void add('EMAIL_ADDRESS', emailAddress, () => setEmailAddress(''))} disabled={busy || !emailAddress.trim()}>
              <Plus className="size-4" /> Add
            </Button>
          </div>
        </div>
        <div className="rounded-[10px] border p-4">
          <label className="text-[12.5px] font-semibold" htmlFor="not-customer-domain">Domain</label>
          <p className="mt-0.5 text-[11.5px] text-muted-foreground">Ignore any address at this domain.</p>
          <div className="mt-3 flex gap-2">
            <Input
              id="not-customer-domain"
              value={domain}
              onChange={(event) => setDomain(event.target.value)}
              placeholder="example.com"
              onKeyDown={(event) => { if (event.key === 'Enter') void add('DOMAIN', domain, () => setDomain('')) }}
            />
            <Button onClick={() => void add('DOMAIN', domain, () => setDomain(''))} disabled={busy || !domain.trim()}>
              <Plus className="size-4" /> Add
            </Button>
          </div>
        </div>
      </div>
      <div className="mt-3 rounded-[10px] border p-4">
        <label className="text-[12.5px] font-semibold" htmlFor="not-customer-subject">Subject pattern</label>
        <p className="mt-0.5 text-[11.5px] text-muted-foreground">Ignore recurring automated or non-customer email subjects.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_140px_auto]">
          <Input
            id="not-customer-subject"
            value={subjectPattern}
            onChange={(event) => setSubjectPattern(event.target.value)}
            placeholder="Subject pattern"
            onKeyDown={(event) => { if (event.key === 'Enter') void add('SUBJECT', subjectPattern, () => setSubjectPattern('')) }}
          />
          <Select value={matchType} onValueChange={setMatchType}>
            <SelectTrigger className="min-w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MATCH_TYPES.map((match) => (
                <SelectItem key={match} value={match}>{label(match)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        <Button onClick={() => void add('SUBJECT', subjectPattern, () => setSubjectPattern(''))} disabled={busy || !subjectPattern.trim()}>
          <Plus className="size-4" /> Add rule
        </Button>
        </div>
      </div>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {ignoreRules.map((rule) => (
          <li key={rule.id} className="rounded-[8px] border bg-muted/30 p-3">
            <div className="truncate text-[12.5px] font-medium">{rule.pattern}</div>
            <div className="mt-0.5 text-[11.5px] text-muted-foreground">
              {label(rule.rule_type || 'SUBJECT')} · {label(rule.match_type)} · {rule.emails_skipped || 0} skipped
            </div>
          </li>
        ))}
        {!ignoreRules.length ? (
          <li className="rounded-[8px] border border-dashed p-4 text-center text-[12px] text-muted-foreground sm:col-span-2">
            No not-customer rules yet.
          </li>
        ) : null}
      </ul>
    </section>
  )
}
