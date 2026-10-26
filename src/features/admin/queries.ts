import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  assignDepartments,
  fetchAccessHistory,
  fetchAdminRoles,
  fetchAdminUsers,
  fetchDepartmentAssignments,
  setUserAppAccess,
  setUserRoles,
  setUserStatus,
  type AdminUser,
} from './api'

export const adminKeys = {
  all: ['crm-admin'] as const,
  roles: () => [...adminKeys.all, 'roles'] as const,
  users: () => [...adminKeys.all, 'users'] as const,
  history: () => [...adminKeys.all, 'history'] as const,
  departments: () => [...adminKeys.all, 'departments'] as const,
}

export function useAdminRolesQuery(enabled = true) {
  return useQuery({ queryKey: adminKeys.roles(), queryFn: fetchAdminRoles, enabled, staleTime: 5 * 60_000 })
}

export function useAdminUsersQuery(enabled = true) {
  return useQuery({ queryKey: adminKeys.users(), queryFn: fetchAdminUsers, enabled })
}

export function useAccessHistoryQuery(enabled = true) {
  return useQuery({ queryKey: adminKeys.history(), queryFn: () => fetchAccessHistory(), enabled })
}

export function useDepartmentAssignmentsQuery(enabled = true) {
  return useQuery({ queryKey: adminKeys.departments(), queryFn: fetchDepartmentAssignments, enabled })
}

type UserChange =
  | { kind: 'roles'; id: string; roles: string[] }
  | { kind: 'app'; id: string; app: string; enabled: boolean }
  | { kind: 'status'; id: string; status: 'active' | 'inactive' }

// One mutation for every per-person change: the server returns the updated
// directory row, which replaces the cached one so the table never flickers.
export function useUpdateAdminUserMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (change: UserChange): Promise<AdminUser> => {
      if (change.kind === 'roles') return setUserRoles(change.id, change.roles)
      if (change.kind === 'app') return setUserAppAccess(change.id, change.app, change.enabled)
      return setUserStatus(change.id, change.status)
    },
    onSuccess: (user) => {
      queryClient.setQueryData<AdminUser[]>(adminKeys.users(), (list) =>
        list?.map((u) => (u.id === user.id ? user : u)),
      )
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.users() })
      void queryClient.invalidateQueries({ queryKey: adminKeys.history() })
    },
  })
}

export function useAssignDepartmentsMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ ids, profileId }: { ids: string[]; profileId: string | null }) => assignDepartments(ids, profileId),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.departments() })
      void queryClient.invalidateQueries({ queryKey: adminKeys.users() })
      // Department lists elsewhere in the app carry the same rows.
      void queryClient.invalidateQueries({ queryKey: ['crm'] })
    },
  })
}
