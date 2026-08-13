// Stale-result suppression for auth profile refreshes.
//
// `AuthProvider.refresh()` is fired from sign-in, sign-out, token refresh, user
// update and mount. Those overlap, and the network does not preserve order, so
// without a gate a slow profile response from a previous session can land after
// a newer one — or after sign-out — and restore an obsolete user. This gate is a
// plain object with no React or Supabase dependency so the ordering rules can be
// tested directly rather than through a rendered provider.
//
// Rules, in one place:
//   • only the newest refresh may apply a result (generation check);
//   • a result may only apply if the session user it was fetched for is still
//     the current session user (identity check);
//   • sign-out and unmount reject everything already in flight, synchronously.
export interface RefreshGate {
  /** Start a refresh for `sessionUserId`. Returns the token to present later. */
  begin(sessionUserId: string | null): number
  /** Record the current session user, e.g. on any auth state change. */
  markSession(sessionUserId: string | null): void
  /** Reject every in-flight refresh without ending the gate's life. */
  invalidate(): void
  /** Permanently reject everything; for provider unmount. */
  dispose(): void
  /** True only if this result is still the newest and still the right user. */
  accepts(token: number, sessionUserId: string | null): boolean
}

export function createRefreshGate(): RefreshGate {
  let latest = 0
  let currentSessionUserId: string | null = null
  let disposed = false

  return {
    begin(sessionUserId) {
      latest += 1
      currentSessionUserId = sessionUserId
      return latest
    },
    markSession(sessionUserId) {
      currentSessionUserId = sessionUserId
    },
    invalidate() {
      latest += 1
    },
    dispose() {
      disposed = true
      latest += 1
    },
    accepts(token, sessionUserId) {
      if (disposed) return false
      if (token !== latest) return false
      return sessionUserId === currentSessionUserId
    },
  }
}
