import type { LucideIcon } from 'lucide-react'
import {
  Building2,
  CalendarDays,
  Contact,
  Database,
  LayoutDashboard,
  ListTodo,
  MailWarning,
  NotebookTabs,
  Route,
  Settings2,
  ShieldCheck,
  Zap,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  iconColor: string
  badgeMuted?: boolean
  /** Only shown in the mobile nav sheet; hidden from the desktop sidebar. */
  mobileOnly?: boolean
}

export interface NavSection {
  label: string
  items: NavItem[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Operate',
    items: [
      { to: '/', label: 'Overview', icon: LayoutDashboard, end: true, iconColor: 'oklch(0.60 0.17 255)' },
      { to: '/email', label: 'Email Routing', icon: MailWarning, iconColor: 'oklch(0.62 0.16 25)' },
      { to: '/triage', label: 'Quick Triage', icon: Zap, iconColor: 'oklch(0.64 0.16 95)', mobileOnly: true },
      { to: '/meetings', label: 'Meetings', icon: CalendarDays, iconColor: 'oklch(0.66 0.15 60)' },
    ],
  },
  {
    label: 'Records',
    items: [
      { to: '/customers', label: 'Customers', icon: Building2, iconColor: 'oklch(0.60 0.15 200)' },
      { to: '/departments', label: 'Departments', icon: Building2, iconColor: 'oklch(0.60 0.15 230)' },
      { to: '/programs', label: 'Programs', icon: Route, iconColor: 'oklch(0.62 0.17 300)' },
      { to: '/contacts', label: 'Contacts', icon: Contact, iconColor: 'oklch(0.62 0.15 165)' },
    ],
  },
  {
    label: 'Workflow',
    items: [
      { to: '/notes', label: 'Notes', icon: NotebookTabs, iconColor: 'oklch(0.64 0.15 130)' },
      { to: '/tasks', label: 'Tasks', icon: ListTodo, iconColor: 'oklch(0.64 0.16 95)', badgeMuted: true },
      { to: '/approvals', label: 'Approvals', icon: ShieldCheck, iconColor: 'oklch(0.60 0.16 340)', badgeMuted: true },
      { to: '/data-admin', label: 'Data Admin', icon: Database, iconColor: 'oklch(0.62 0.15 165)' },
      { to: '/settings', label: 'Settings', icon: Settings2, iconColor: 'oklch(0.55 0.02 256)' },
    ],
  },
]

// Flat list kept for backward compatibility (CommandSearch, etc.)
export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items)
