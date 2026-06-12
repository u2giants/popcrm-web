# HANDOFF — popcrm-web

Continuation context for unfinished/partially-deployed work. Delete this file
once the item below is truly complete. See `AGENTS.md` for the full operating guide.

## Account logos (logo.dev) — activation pending

Status:
partial — code shipped and live, feature inert until a token is set.

Done:
- `src/components/app/AccountLogo.tsx` fetches brand logos from `img.logo.dev`
  keyed on `retailer.domain`, falling back to `NameAvatar` initials when there's
  no domain, no token, or the image fails. Wired into the Accounts table name
  cell and the `AccountDrawer` header (via `DetailDrawer`'s `avatar` slot).
- Build plumbing: `VITE_LOGODEV_TOKEN` Dockerfile build-arg ← `deploy.yml`
  build-arg ← GitHub secret `LOGODEV_TOKEN`. Documented in `docs/configuration.md`
  and `docs/deployment.md`.

Next action:
1. Get a logo.dev **publishable** token (`pk_…`) from logo.dev.
2. Add it as the GitHub repo secret **`LOGODEV_TOKEN`**
   (Settings → Secrets and variables → Actions).
3. Re-run the latest deploy (or push any commit). The token bakes into the
   bundle and logos replace initials on the next build.

Risks / watchouts:
- It's a **publishable** key (client-safe, ships in the JS bundle) — do NOT use a
  logo.dev secret/private key here.
- `VITE_*` is build-time only; changing the token requires a rebuild+redeploy.
- Until the secret exists, every account simply shows initials — nothing breaks.

## Suggested follow-up (not started, optional)

`OTHER` / "Not a Customer" is ~3,630 of ~3,766 accounts (reviewed, no CRM action).
The Accounts default tab already hides them; consider whether the pipeline/overview
should also exclude them, and whether the legacy Twenty `OTHER` rows want a one-time
re-triage. Backend data change → confirm the rule with the user first.
