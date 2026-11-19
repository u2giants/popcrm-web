import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/app/states'
import { describeError, logError } from '@/lib/errors'

// A lazy route chunk that fails to load after a deploy throws a dynamic-import
// error. A plain reload fetches the new build, so those get their own message.
// Matches the wording Chrome, Firefox and Safari use for such failures.
function isChunkLoadError(error: unknown): boolean {
  return /dynamically imported module|importing a module script|loading chunk|error loading chunk/i.test(
    describeError(error),
  )
}

// Catches unexpected render errors so one broken screen cannot blank the whole
// app (issue #44). Mounted twice: around the routed page area in AppLayout —
// keyed by pathname, so navigating away resets it — and once around the App
// root as a last-resort fallback. The sidebar and header live outside the page
// boundary and keep working when a screen dies.
export class ErrorBoundary extends Component<
  { children: ReactNode; area?: string },
  { error: unknown | null }
> {
  state: { error: unknown | null } = { error: null }

  static getDerivedStateFromError(error: unknown) {
    return { error }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    const area = this.props.area ?? 'page'
    logError(`ErrorBoundary:${area}`, error)
    if (info.componentStack) {
      console.error(`[ErrorBoundary:${area}] component stack`, info.componentStack)
    }
  }

  render() {
    const { error } = this.state
    if (error === null) return this.props.children

    const outdated = isChunkLoadError(error)
    return (
      <div role="alert" className="h-full min-h-[60vh] w-full">
        <ErrorState
          className="h-full"
          title={
            outdated ? 'A new version of the CRM is available' : 'This screen could not be displayed'
          }
          description={
            outdated
              ? 'The app was updated since this tab was opened and part of it failed to load. Reload to pick up the latest version.'
              : `${describeError(error)} — other pages keep working; reload to try this one again.`
          }
          action={
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <RefreshCcw className="size-4" /> {outdated ? 'Reload to update' : 'Reload'}
            </Button>
          }
        />
      </div>
    )
  }
}
