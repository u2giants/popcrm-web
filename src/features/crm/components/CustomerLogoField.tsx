import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ImageUp, Link2, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { CustomerLogo } from '@/components/app/CustomerLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { setRetailerLogo, uploadRetailerLogo } from '@/features/crm/api'
import { crmKeys } from '@/features/crm/queries'
import { logError } from '@/lib/errors'
import type { Retailer } from '@/lib/types'

const MAX_LOGO_BYTES = 5 * 1024 * 1024

/** Storage object names stay readable: "fye-logo.png", not "FYE Inc..png". */
function fileToken(name: string | null | undefined): string {
  return (name ?? 'customer')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'customer'
}

/**
 * Change one customer's brand logo from wherever their drawer is open.
 * The same stored logo_url the Customer column reads everywhere, so a change
 * here shows up in every table immediately.
 */
export function CustomerLogoField({ customer }: { customer: Retailer }) {
  const queryClient = useQueryClient()
  const fileInput = useRef<HTMLInputElement | null>(null)
  const [busy, setBusy] = useState(false)
  const [showUrl, setShowUrl] = useState(false)
  const [urlDraft, setUrlDraft] = useState(customer.logo_url ?? '')

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'customerBrands'] })
    void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'retailers'] })
    void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'customerSegment'] })
  }

  async function save(logoUrl: string | null) {
    setBusy(true)
    try {
      await setRetailerLogo(customer.id, logoUrl)
      refresh()
      setShowUrl(false)
      toast.success(logoUrl ? 'Logo updated' : 'Logo removed')
    } catch (error) {
      toast.error('Could not save the logo', { description: logError('CustomerLogoField.save', error) })
    } finally {
      setBusy(false)
    }
  }

  async function upload(file: File | null | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Choose an image file')
      return
    }
    if (file.size > MAX_LOGO_BYTES) {
      toast.error('Logo files must be 5 MB or smaller')
      return
    }
    setBusy(true)
    try {
      const renamed = new File([file], `${fileToken(customer.name)}-${file.name}`, { type: file.type })
      const url = await uploadRetailerLogo(customer.id, renamed)
      await setRetailerLogo(customer.id, url)
      setUrlDraft(url)
      refresh()
      toast.success('Logo uploaded')
    } catch (error) {
      toast.error('Could not upload the logo', { description: logError('CustomerLogoField.upload', error) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-[9px]">
      <div className="flex h-[54px] items-center gap-[10px] rounded-[8px] border bg-muted/20 px-[11px]">
        <CustomerLogo name={customer.name} domain={customer.domain} size={28} />
        {customer.logo_url ? (
          <CustomerLogo
            name={customer.name}
            domain={customer.domain}
            logoUrl={customer.logo_url}
            variant="full"
            width={150}
            height={34}
          />
        ) : (
          <span className="text-[11.5px] text-muted-foreground">
            {customer.domain ? 'Using the logo found for this domain' : 'No logo yet — add a domain or upload one'}
          </span>
        )}
      </div>

      <input
        ref={fileInput}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          void upload(file)
          event.currentTarget.value = ''
        }}
      />

      <div className="flex flex-wrap items-center gap-[6px]">
        <Button size="sm" variant="outline" className="h-[26px]" disabled={busy} onClick={() => fileInput.current?.click()}>
          <ImageUp className="size-[12px]" /> Upload logo
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-[26px] text-[11px] text-muted-foreground"
          disabled={busy}
          onClick={() => {
            setUrlDraft(customer.logo_url ?? '')
            setShowUrl((open) => !open)
          }}
        >
          <Link2 className="size-[12px]" /> Use an image URL
        </Button>
        {customer.logo_url ? (
          <Button
            size="sm"
            variant="ghost"
            className="h-[26px] text-[11px] text-muted-foreground"
            disabled={busy}
            onClick={() => void save(null)}
          >
            <RotateCcw className="size-[12px]" /> Remove
          </Button>
        ) : null}
      </div>

      {showUrl ? (
        <div className="flex items-center gap-[6px]">
          <Input
            autoFocus
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void save(urlDraft.trim() || null)
              if (e.key === 'Escape') setShowUrl(false)
            }}
            placeholder="https://…/logo.png"
            aria-label="Logo image URL"
            className="h-[26px] text-[11.5px]"
          />
          <Button size="sm" variant="outline" className="h-[26px]" disabled={busy} onClick={() => void save(urlDraft.trim() || null)}>
            Save
          </Button>
        </div>
      ) : null}
    </div>
  )
}
