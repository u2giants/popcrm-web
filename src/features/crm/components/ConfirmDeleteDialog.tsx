import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

/**
 * The one confirm step every remove goes through: it names the record, says
 * what removal means here (hidden vs deleted), and never removes on one click.
 */
export function ConfirmDeleteDialog({
  open,
  title,
  message,
  detail,
  confirmLabel = 'Delete',
  destructive = false,
  pending = false,
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  message: string
  detail?: string
  confirmLabel?: string
  destructive?: boolean
  pending?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        {detail ? (
          <p className="rounded-[8px] border bg-muted/40 px-[11px] py-[9px] text-[12px] text-muted-foreground">{detail}</p>
        ) : null}
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} disabled={pending}>Cancel</Button>
          <Button variant={destructive ? 'destructive' : 'default'} size="sm" onClick={onConfirm} disabled={pending}>
            {pending ? 'Removing…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
