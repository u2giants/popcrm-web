import type { LucideIcon } from 'lucide-react'
import {
  Building2,
  CalendarDays,
  Contact,
  LayoutDashboard,
  ListTodo,
  MailWarning,
  NotebookTabs,
  Route,
  Settings2,
  ShieldCheck,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

// Primary sidebar navigation. Order matters — it is the IA defined in
// frontend_imp.md. Each entry maps to a deep-linkable route.
export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/pipeline', label: 'Pipeline', icon: Route },
  { to: '/accounts', label: 'Accounts', icon: Building2 },
  { to: '/contacts', label: 'Contacts', icon: Contact },
  { to: '/email', label: 'Email Routing', icon: MailWarning },
  { to: '/meetings', label: 'Meetings', icon: CalendarDays },
  { to: '/notes', label: 'Notes', icon: NotebookTabs },
  { to: '/tasks', label: 'Tasks', icon: ListTodo },
  { to: '/approvals', label: 'Approvals', icon: ShieldCheck },
  { to: '/settings', label: 'Settings', icon: Settings2 },
]
