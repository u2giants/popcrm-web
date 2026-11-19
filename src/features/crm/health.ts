// Three-state presentation for the Fireflies health check (#54). Every
// surface reads the check through these helpers: interpreting `data` at the
// call site (e.g. `data !== false`) treats an unanswered check as healthy,
// which is the bug. 'Offline' means the check answered no — including a fetch
// that threw, which the query function converts to `false`; 'Checking' is the
// first load before any answer exists.
import type { StatusTone } from './constants'

export type HealthStatus = 'Online' | 'Offline' | 'Checking'

export function healthLabel(query: { data?: boolean }): HealthStatus {
  if (query.data === true) return 'Online'
  if (query.data === false) return 'Offline'
  return 'Checking'
}

export function healthTone(query: { data?: boolean }): StatusTone {
  if (query.data === true) return 'success'
  if (query.data === false) return 'danger'
  return 'neutral'
}
