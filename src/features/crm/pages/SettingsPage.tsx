import { toast } from 'sonner'
import { Bot, Activity, Plug } from 'lucide-react'
import { AppPage, ListBar, SectionHeader } from '@/components/app/AppPage'
import { StatusBadge } from '@/components/app/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EmptyState } from '@/components/app/states'
import { AI_MODELS, AI_MODEL_FIELDS, WORKER_CADENCE } from '@/features/crm/constants'
import { label } from '@/features/crm/format'
import { listData, useAiConfigsQuery, useFirefliesHealth, useIgnoreRulesQuery, useUpdateAiConfigMutation } from '@/features/crm/queries'
import { SUPABASE_URL } from '@/lib/supabase'
import type { CrmAiModelConfig } from '@/lib/types'

export function SettingsPage() {
  const aiConfigsQuery = useAiConfigsQuery()
  const ignoreRulesQuery = useIgnoreRulesQuery()
  const fireflies = useFirefliesHealth()
  const updateAiConfigMutation = useUpdateAiConfigMutation()
  const aiConfigs = listData(aiConfigsQuery.data)
  const ignoreRules = listData(ignoreRulesQuery.data)
  const firefliesOk = fireflies.data ?? null

  async function saveField(config: CrmAiModelConfig, field: keyof CrmAiModelConfig, value: string) {
    try {
      await updateAiConfigMutation.mutateAsync({ id: config.id, values: { [field]: value } })
      toast.success('Model updated')
    } catch {
      toast.error('Could not update model')
    }
  }

  const endpoints = [
    { label: 'Supabase API', url: SUPABASE_URL ?? '—' },
    { label: 'Fireflies webhook', url: 'https://crm-fireflies.designflow.app' },
    { label: 'Production', url: 'https://crm.designflow.app' },
  ]

  return (
    <AppPage
      listBar={
        <ListBar
          title="Settings"
          subtitle="AI models, automation health and integrations"
        />
      }
    >
      <div className="mx-auto max-w-4xl space-y-5">
        {/* AI model config */}
        <section className="rounded-[12px] border bg-card p-5 shadow-[var(--shadow-xs)]">
          <SectionHeader
            title="AI model configuration"
            description="Models used for routing, transcript splitting and summaries."
          />
          {aiConfigs.length ? (
            <div className="mt-4 space-y-6">
              {aiConfigs.map((config) => (
                <div key={config.id}>
                  <div className="mb-3 flex items-center gap-[7px] text-[12.5px] font-[600] text-foreground">
                    <Bot className="size-4 text-muted-foreground" />
                    {config.name || 'AI routing config'}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {AI_MODEL_FIELDS.map((field) => (
                      <div key={field} className="grid gap-1.5">
                        <Label className="text-[11.5px] text-muted-foreground">{label(field)}</Label>
                        <Select
                          value={config[field] || ''}
                          onValueChange={(v) => saveField(config, field, v)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select model" />
                          </SelectTrigger>
                          <SelectContent>
                            {AI_MODELS.map((m) => (
                              <SelectItem key={m} value={m}>
                                {label(m)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-4"
              icon={<Bot className="size-5" />}
              title="No AI model config"
              description="No crm_ai_model_config rows were found."
            />
          )}
        </section>

        {/* Worker / system health */}
        <section className="rounded-[12px] border bg-card p-5 shadow-[var(--shadow-xs)]">
          <SectionHeader title="Automation & health" description="Backend worker cadence and integration status." />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {WORKER_CADENCE.map((w) => (
              <div key={w.label} className="flex items-center justify-between gap-2 rounded-[8px] border px-3 py-[10px]">
                <div className="flex items-center gap-[7px] text-[12.5px]">
                  <Activity className="size-[14px] text-muted-foreground" />
                  {w.label}
                </div>
                <Badge variant="outline">{w.cadence}</Badge>
              </div>
            ))}
            <div className="flex items-center justify-between gap-2 rounded-[8px] border px-3 py-[10px]">
              <div className="flex items-center gap-[7px] text-[12.5px]">
                <Activity className="size-[14px] text-muted-foreground" />
                Fireflies webhook
              </div>
              <StatusBadge tone={firefliesOk === false ? 'danger' : firefliesOk ? 'success' : 'neutral'}>
                {firefliesOk === null ? 'Checking…' : firefliesOk ? 'Online' : 'Offline'}
              </StatusBadge>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-[8px] border px-3 py-[10px]">
              <div className="flex items-center gap-[7px] text-[12.5px]">
                <Activity className="size-[14px] text-muted-foreground" />
                Active ignore rules
              </div>
              <Badge variant="outline">{ignoreRules.length}</Badge>
            </div>
          </div>
        </section>

        {/* Integration endpoints */}
        <section className="rounded-[12px] border bg-card p-5 shadow-[var(--shadow-xs)]">
          <SectionHeader title="Integrations" description="Service endpoints (no secrets are stored in the browser)." />
          <div className="mt-4 space-y-2">
            {endpoints.map((e) => (
              <div key={e.label} className="flex items-center justify-between gap-2 rounded-[8px] border px-3 py-[10px] text-[12.5px]">
                <div className="flex items-center gap-[7px]">
                  <Plug className="size-[14px] text-muted-foreground" />
                  {e.label}
                </div>
                <code className="truncate font-mono text-[11px] text-muted-foreground">{e.url}</code>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppPage>
  )
}
