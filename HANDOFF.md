# HANDOFF — popcrm-web impersonation feature: code done, prod deploy blocked by host SSH policy

Date: 2026-07-15
Author: Claude (Opus 4.8) session

## TL;DR

The **admin impersonation ("view as another user") feature is complete, merged,
and live in the database** — but the **frontend production deploy is blocked** by
a host-level SSH change that breaks Coolify deploys for **every** app on the
`hetz` VPS (not just this one). The fix is in `u2giants/ansible`, not this repo,
and needs the owner's go-ahead because it changes SSH policy host-wide.

## What is DONE and verified

- **Feature code** — committed and pushed to `main`:
  - `ccc4a33` docs, `fffe858` feature (`git log` on `origin/main`).
  - Files: `src/auth/auth.tsx` (realUser vs impersonated identity overlay),
    `src/components/app/ImpersonationDialog.tsx` (admin-only user picker),
    `src/components/app/ImpersonationBar.tsx` (orange exit bar),
    `src/components/app/AppHeader.tsx` (menu item above Log out),
    `src/app/AppLayout.tsx` (bar wiring), `src/features/crm/api.ts` +
    `src/lib/types.ts` (`fetchAdminUserList` / `AdminUserSummary`).
  - `npm run build` ✓, `npm run lint` ✓ (only the pre-existing `App.tsx:48`
    warning; zero new).
  - Verified end-to-end in a local dev server signed in as a **real
    administrator** (albert@popcre.com, session minted via service-role): menu
    item appears, dialog lists all 21 users with role chips, impersonating a
    viewer swaps the header identity and shows the orange bar, Exit restores the
    admin. Technique saved in memory `verify-spa-as-user-supabase-session`.

- **Backend (shared-db)** — applied to preview + production, PR
  [#68](https://github.com/u2giants/shared-db/pull/68) merged to `main`:
  - Migration `20260715184500_crm_admin_user_list.sql`:
    admin-gated `api.crm_admin_user_list()` (returns all active profiles +
    roles + apps + crm_access); grants `administrator` to `albert@popcre.com`
    (trigger + backfill).
  - Verified in prod: RPC returns the 21-user directory for an administrator,
    raises `insufficient_privilege` for non-admins; albert has `administrator`.

- **CI image** — GitHub Actions run `29446957775`: `verify` ✓,
  `build-and-push` ✓ → `ghcr.io/u2giants/popcrm-web:sha-ccc4a33` published.

## What is BLOCKED — and exactly why

The GH Actions `deploy` job triggered Coolify (deployment
`qw600lsxhro52596hm2jjtyu`, "queued"), but Coolify **failed** it with
`Server is not functional` / `Permission denied (publickey)`, and the CI
"Wait for production to serve this commit" step then failed after 7.5 min.
The live site still serves the old bundle (`/assets/index-XTBhpujx.js`); the
running container `a1vb55by4benmh25nd4ga8pt-*` is **5 days old**.

Root cause (fully diagnosed on the host, read-only):
- Coolify deploys by SSHing **as `root`** to `host.docker.internal` from the
  **docker bridge network `10.0.1.15`**.
- On **2026-07-14 16:32** the Ansible `ssh_hardening` role rewrote
  `/etc/ssh/sshd_config.d/20-access-policy.conf`:
  - global `PermitRootLogin no`;
  - `Match Address <ssh_trusted_sources>` (Tailscale `100.64.0.0/10` + loopback)
    → `PermitRootLogin prohibit-password`;
  - `Match Address *,!<trusted>` → `AllowUsers ai` (no root).
- `10.0.1.0/24` (the docker bridge Coolify uses) is **not** in
  `ssh_trusted_sources`, so Coolify's root SSH lands in the "public" bucket and
  is refused. auth.log: `User root from 10.0.1.15 not allowed because not
  listed in AllowUsers`, first occurrence **Jul 14 16:33:02** — right after the
  config was written.
- Coolify marked its only server (localhost) `is_reachable=f, is_usable=f` at
  2026-07-14 20:33. The `coolify coolify-localhost` key IS still in
  `/root/.ssh/authorized_keys` (`from="10.0.1.0/24"`, fingerprint `wXtvwv6u…`,
  matches Coolify's stored private key) — so this is **not** a key problem; it
  is purely the sshd root/AllowUsers policy.

Scope: this breaks **all** Coolify-managed app deploys on `hetz`
(popcrm-web, poppim-web, popdam, monitor, hiclaw…), not just this change.

## The fix (belongs in `u2giants/ansible`, NOT here, NOT a host hand-edit)

Source of truth: `roles/ssh_hardening/templates/20-access-policy.conf.j2` + its
role vars. Add the Coolify/docker internal bridge `10.0.1.0/24` (IPv4) to
**`ssh_trusted_sources`** so root gets `PermitRootLogin prohibit-password`
there. Coolify's authorized_keys entry is already `from="10.0.1.0/24"` and
key-only, so this is scoped and safe. Then apply via the Ansible GitHub Actions
pipeline — do NOT hand-edit sshd on the host (break-glass only, and reconcile in
Ansible after).

Heads-up: `/worksp/ansible` is currently on branch `codex/fix-software-drift`
(someone else's in-flight work) — coordinate/serialize before opening the fix.

## How to finish once the SSH policy is fixed

1. Re-trigger the popcrm-web deploy (push an empty commit, re-run Actions run
   `29446957775`, or Coolify redeploy of image `sha-ccc4a33`).
2. Confirm Coolify deployment `finished` (not `failed`):
   `docker exec coolify-db psql -U coolify -d coolify -c "select deployment_uuid,status from application_deployment_queues order by created_at desc limit 3;"`
3. Verify the live SHA: fetch `https://crm.designflow.app/`, find the
   `/assets/index-*.js`, and confirm it contains `ccc4a33` (the build stamp).
4. Smoke-test impersonation live as an admin (albert): avatar → Impersonate →
   pick a user → orange bar → Exit.
5. Delete this HANDOFF.md once the deploy is verified and no work remains.

## Loose ends / notes

- Prod has a few non-human profiles that now appear in the picker
  (`Codex CRM Verification`, `POP CRM E2E Test`, `Admin User / svc@popcre.com`).
  If undesired, filter them in `api.crm_admin_user_list()` (shared-db) or in
  `ImpersonationDialog`. Not done pending owner preference.
- Impersonation is a **frontend identity overlay**, deliberately (CRM rows are
  shared across all crm-access users; only identity + role-gated UI vary). See
  AGENTS.md → Quirks → "Admin impersonation is a frontend view as".
- No secret values were committed or printed. Temp dev `.env`, minted session,
  and screenshots were deleted. Coolify DB password (used read-only for
  diagnosis) is in 1Password `vibe_coding/coolify-secrets`.
