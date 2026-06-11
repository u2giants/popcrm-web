import { toast } from 'sonner'
import { Bot, Activity, Plug } from 'lucide-react'
import { AppPage, SectionHeader } from '@/components/app/AppPage'
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
import { useCrmData } from '@/features/crm/CrmDataContext'
import { updateAiModelConfig } from '@/features/crm/api'
import { AI_MODELS, AI_MODEL_FIELDS, WORKER_CADENCE } from '@/features/crm/constants'
import { label } from '@/features/crm/format'
import { DIRECTUS_URL } from '@/lib/directus'
import type { CrmAiModelConfig } from '@/lib/types'

export function SettingsPage() {
  const { aiConfigs, ignoreRules, firefliesOk, setAiConfigs } = useCrmData()

  async function saveField(config: CrmAiModelConfig, field: keyof CrmAiModelConfig, value: string) {
    const prev = config[field]
    setAiConfigs((rows) => rows.map((r) => (r.id === config.id ? { ...r, [field]: value } : r)))
    try {
      await updateAiModelConfig(config.id, { [field]: value })
      toast.success('Model updated')
    } catch {
      setAiConfigs((rows) => rows.map((r) => (r.id === config.id ? { ...r, [field]: prev } : r)))
      toast.error('Could not update model')
    }
  }

  const endpoints = [
    { label: 'Directus API', url: DIRECTUS_URL },
    { label: 'Fireflies webhook', url: 'https://crm-fireflies.designflow.app' },
    { label: 'Production', url: 'https://crm.designflow.app' },
  ]

  return (
    <AppPage title="Settings" description="AI models, automation health and integrations.">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* AI model config */}
        <section className="rounded-lg border bg-card p-5">
          <SectionHeader
            title="AI model configuration"
            description="Models used for routing, transcript splitting and summaries."
          />
          {aiConfigs.length ? (
            <div className="mt-4 space-y-6">
              {aiConfigs.map((config) => (
                <div key={config.id}>
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                    <Bot className="size-4 text-muted-foreground" />
                    {config.name || 'AI routing config'}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {AI_MODEL_FIELDS.map((field) => (
                      <div key={field} className="grid gap-1.5">
                        <Label className="text-muted-foreground">{label(field)}</Label>
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
        <section className="rounded-lg border bg-card p-5">
          <SectionHeader title="Automation & health" description="Backend worker cadence and integration status." />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {WORKER_CADENCE.map((w) => (
              <div key={w.label} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2.5">
                <div className="flex items-center gap-2 text-sm">
                  <Activity className="size-4 text-muted-foreground" />
                  {w.label}
                </div>
                <Badge variant="outline">{w.cadence}</Badge>
              </div>
            ))}
            <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2.5">
              <div className="flex items-center gap-2 text-sm">
                <Activity className="size-4 text-muted-foreground" />
                Fireflies webhook
              </div>
              <StatusBadge tone={firefliesOk === false ? 'danger' : firefliesOk ? 'success' : 'neutral'}>
                {firefliesOk === null ? 'Checking…' : firefliesOk ? 'Online' : 'Offline'}
              </StatusBadge>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2.5">
              <div className="flex items-center gap-2 text-sm">
                <Activity className="size-4 text-muted-foreground" />
                Active ignore rules
              </div>
              <Badge variant="outline">{ignoreRules.length}</Badge>
            </div>
          </div>
        </section>

        {/* Integration endpoints */}
        <section className="rounded-lg border bg-card p-5">
          <SectionHeader title="Integrations" description="Service endpoints (no secrets are stored in the browser)." />
          <div className="mt-4 space-y-2">
            {endpoints.map((e) => (
              <div key={e.label} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2.5 text-sm">
                <div className="flex items-center gap-2">
                  <Plug className="size-4 text-muted-foreground" />
                  {e.label}
                </div>
                <code className="truncate font-mono text-xs text-muted-foreground">{e.url}</code>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppPage>
  )
}
