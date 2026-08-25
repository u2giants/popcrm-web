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
  const [pattern, setPattern] = useState('')
  const [ruleType, setRuleType] = useState<string>('EMAIL_ADDRESS')
  const [matchType, setMatchType] = useState<string>('CONTAINS')
  const [busy, setBusy] = useState(false)

  async function add() {
    const value = pattern.trim()
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
      setPattern('')
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
      <div className="mt-4 grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)_auto_auto]">
        <Select value={ruleType} onValueChange={setRuleType}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="EMAIL_ADDRESS">Exact email address</SelectItem>
            <SelectItem value="DOMAIN">Email domain</SelectItem>
            <SelectItem value="SUBJECT">Subject pattern</SelectItem>
          </SelectContent>
        </Select>
        <Input
          value={pattern}
          onChange={(event) => setPattern(event.target.value)}
          placeholder={ruleType === 'DOMAIN' ? 'example.com' : ruleType === 'EMAIL_ADDRESS' ? 'person@example.com' : 'Subject pattern'}
          onKeyDown={(event) => { if (event.key === 'Enter') void add() }}
        />
        {ruleType === 'SUBJECT' ? (
          <Select value={matchType} onValueChange={setMatchType}>
            <SelectTrigger className="min-w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MATCH_TYPES.map((match) => (
                <SelectItem key={match} value={match}>{label(match)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : <span />}
        <Button onClick={() => void add()} disabled={busy || !pattern.trim()}>
          <Plus className="size-4" /> Add rule
        </Button>
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
