import { Eye, X } from 'lucide-react'
import { useAuth } from '@/auth/auth'

// Full-width orange banner shown whenever an admin is impersonating another
// user. Stays pinned above the app so it is always visible, and offers a
// one-click exit back to the admin's own identity.
export function ImpersonationBar() {
  const { impersonating, stopImpersonation } = useAuth()
  if (!impersonating) return null

  const name =
    [impersonating.first_name, impersonating.last_name].filter(Boolean).join(' ') ||
    impersonating.email ||
    'user'
  const role = impersonating.role?.name

  return (
    <div className="flex h-[38px] shrink-0 items-center gap-3 bg-[#ea580c] px-4 text-[13px] font-medium text-white">
      <Eye className="size-[15px] shrink-0" />
      <span className="min-w-0 flex-1 truncate">
        Impersonating <span className="font-semibold">{name}</span>
        {role ? <span className="opacity-90"> · {role}</span> : null} — you are viewing the CRM as
        this user sees it.
      </span>
      <button
        type="button"
        onClick={stopImpersonation}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-[7px] bg-white/20 px-2.5 py-1 text-[12.5px] font-semibold transition-colors hover:bg-white/30"
      >
        <X className="size-[14px]" />
        Exit impersonation
      </button>
    </div>
  )
}
