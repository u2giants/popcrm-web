import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/app/AppLayout'

// Code-split each page so heavy dependencies (e.g. recharts on Overview) stay
// out of the initial bundle and load on demand.
const OverviewPage = lazy(() => import('@/features/crm/pages/OverviewPage').then((m) => ({ default: m.OverviewPage })))
const PipelinePage = lazy(() => import('@/features/crm/pages/PipelinePage').then((m) => ({ default: m.PipelinePage })))
const CustomersPage = lazy(() => import('@/features/crm/pages/CustomersPage').then((m) => ({ default: m.CustomersPage })))
const DepartmentsPage = lazy(() => import('@/features/crm/pages/DepartmentsPage').then((m) => ({ default: m.DepartmentsPage })))
const ProgramsPage = lazy(() => import('@/features/crm/pages/ProgramsPage').then((m) => ({ default: m.ProgramsPage })))
const ContactsPage = lazy(() => import('@/features/crm/pages/ContactsPage').then((m) => ({ default: m.ContactsPage })))
const EmailRoutingPage = lazy(() => import('@/features/crm/pages/EmailRoutingPage').then((m) => ({ default: m.EmailRoutingPage })))
const TriagePage = lazy(() => import('@/features/crm/pages/TriagePage').then((m) => ({ default: m.TriagePage })))
const MeetingsPage = lazy(() => import('@/features/crm/pages/MeetingsPage').then((m) => ({ default: m.MeetingsPage })))
const NotesPage = lazy(() => import('@/features/crm/pages/NotesPage').then((m) => ({ default: m.NotesPage })))
const TasksPage = lazy(() => import('@/features/crm/pages/TasksPage').then((m) => ({ default: m.TasksPage })))
const ApprovalsPage = lazy(() => import('@/features/crm/pages/ApprovalsPage').then((m) => ({ default: m.ApprovalsPage })))
const DataAdminPage = lazy(() => import('@/features/crm/pages/DataAdminPage').then((m) => ({ default: m.DataAdminPage })))
const SettingsPage = lazy(() => import('@/features/crm/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })))

function PageFallback() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading…</div>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route
          index
          element={
            <Suspense fallback={<PageFallback />}>
              <OverviewPage />
            </Suspense>
          }
        />
        <Route path="pipeline" element={<Suspense fallback={<PageFallback />}><PipelinePage /></Suspense>} />
        <Route path="customers" element={<Suspense fallback={<PageFallback />}><CustomersPage /></Suspense>} />
        {/* Legacy bookmark compatibility: /accounts was renamed to /customers. */}
        <Route path="accounts" element={<Navigate to="/customers" replace />} />
        <Route path="departments" element={<Suspense fallback={<PageFallback />}><DepartmentsPage /></Suspense>} />
        <Route path="programs" element={<Suspense fallback={<PageFallback />}><ProgramsPage /></Suspense>} />
        <Route path="contacts" element={<Suspense fallback={<PageFallback />}><ContactsPage /></Suspense>} />
        <Route path="email" element={<Suspense fallback={<PageFallback />}><EmailRoutingPage /></Suspense>} />
        <Route path="triage" element={<Suspense fallback={<PageFallback />}><TriagePage /></Suspense>} />
        <Route path="meetings" element={<Suspense fallback={<PageFallback />}><MeetingsPage /></Suspense>} />
        <Route path="notes" element={<Suspense fallback={<PageFallback />}><NotesPage /></Suspense>} />
        <Route path="tasks" element={<Suspense fallback={<PageFallback />}><TasksPage /></Suspense>} />
        <Route path="approvals" element={<Suspense fallback={<PageFallback />}><ApprovalsPage /></Suspense>} />
        <Route path="data-admin" element={<Suspense fallback={<PageFallback />}><DataAdminPage /></Suspense>} />
        <Route path="settings" element={<Suspense fallback={<PageFallback />}><SettingsPage /></Suspense>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
