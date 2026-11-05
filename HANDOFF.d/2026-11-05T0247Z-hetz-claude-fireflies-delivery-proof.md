---
issue: 22
status: OPEN
owner: claude/beautiful-solomon-b649dd
---

# Prove automatic Fireflies meeting delivery into POP CRM

## 0. Business decisions only the owner can make
None — nothing in this workstream needs the owner.

Already settled, do NOT re-ask (all 2026-11-04): Albert asked for Jev to be replaced with ScaleDown; approved the Fireflies restart ("Yes, do it"); approved the Microsoft sign-in ("Yes, sign in"); accepted Fireflies' updated terms ("Yes, I accept").

## 1. What this application is
POP CRM is the internal staff console for POP Creations: customers, sales pipeline, routed Outlook email, and Fireflies meeting notes. Repo: https://github.com/u2giants/popcrm-web. Site: https://crm.designflow.app. Data is in the shared Supabase project. Background workers run on server `hetz` from the host checkout of `main`; timers cover Outlook and other jobs. The always-on Docker container `popcrm-fireflies` receives Fireflies webhooks (automatic web notifications) at https://crm-fireflies.designflow.app/s/fireflies-webhook.

## 2. What we set out to do and why
Replace TypeSafe Jev with ScaleDown as the AI fallback that picks a customer when fixed routing rules find none. Issue: https://github.com/u2giants/popcrm-web/issues/22. To give meetings the fallback, the Fireflies container also needed the new key. That check exposed the open problem here: meetings do not appear to reach the CRM on their own.

## 3. Current state
Done and on `main` (latest commit https://github.com/u2giants/popcrm-web/commit/1fe6c7bc), host checkout updated, GitHub checks green:
- ScaleDown routing: https://github.com/u2giants/popcrm-web/blob/main/workers/lib/scaledown-router.mjs. Cutoff 0.93. No Jev reference remains in workers, docs or systemd. Evidence is on issue 22.
- `popcrm-fireflies` was recreated 2026-11-04 about 9:22 PM EST with the original environment plus `SCALEDOWN_API_KEY`. Health returns 200; unsigned posts return 401.
- The previous container is kept stopped as `popcrm-fireflies-old-20261104` for rollback.
- One real meeting, "POP x BURLINGTON" (2:00 PM EST that day), was delivered by a hand-signed post, got 202, and created a row with `source=FIREFLIES_AUTO_IMPORT` on the right customer and department.

Not proven: a real meeting arriving automatically from Fireflies. Not started: backfill of meetings missed since April.

## 4. What did not work
- Stored message mailbox metadata for Graph body fetches: recent rows have none. Trying each mailbox in `OUTLOOK_MAILBOXES` with `outlook_message_id` found 67 of 255 full bodies; the rest used previews.
- Reading the webhook settings via https://app.fireflies.ai/settings/developer: redirected to login. The settings live at https://app.fireflies.ai/integrations/api/webhook.
- Fireflies "Send Test Event": no visible result, and the worker logs nothing on success, so it proved nothing either way.
- Proxy logs: showed no matching lines, including for posts known to have arrived, so absence there is not evidence.
- The early theory of a wrong webhook address was wrong. Those 404s to crm.designflow.app are old history from May.

## 5. Findings
- Dashboard, checked 2026-11-04: V2 config on, correct URL, only Meeting Transcribed, All Eligible Meetings, signing secret equal to the container's. Listed failures stop at 2026-05-15.
- Automatic imports in CRM stop at meetings dated 2026-04-14 (created by a 2026-06-21 import). Fireflies has meetings through 2026-11-04.
- Recent Fireflies meetings are organized by teammates, mostly not albert@popcre.com, who owns the webhook. Hypothesis, untested: the webhook covers only some meetings ("access policies determine eligibility").
- A silent 401 from a bad signature would also leave no worker log. The worker's success and rejection paths both log nothing: https://github.com/u2giants/popcrm-web/blob/main/workers/crm-worker-supabase.mjs#L1278-L1320.
- The worker env file does not reach the container automatically; values are fixed when it is created.

## 6. Exact next steps
1. After the next finished Fireflies meeting, compare the Fireflies API `transcripts` list with `crm.meeting_note` by `fireflies_transcript_id`, read-only. You'll know it worked when the new meeting has a row created within minutes of transcription, without a hand post.
2. If it arrived, close issue 22, delete this file, and remove the stopped old container. You'll know it worked when the issue is closed and the container is gone.
3. If it did not, open the dashboard History tab for that meeting, and test the eligibility hypothesis by comparing a meeting Albert organized against one a teammate organized. If needed, change the access or webhook scope, or add a safe log line for received and rejected deliveries. You'll know it worked when the next real meeting creates a row by itself.
4. Once delivery works, backfill missed meetings by sending their IDs through the same path in small batches, recording counts on the issue. You'll know it worked when every Fireflies meeting since April has a CRM row.

## 7. Constraints and gotchas
Commit directly to `main` here; pushing deploys the frontend. After worker changes, pull in the host checkout; the container needs a restart to load new code. Host and systemd changes belong in https://github.com/u2giants/ansible. No app-side database changes. Quote times in EST. Accepting terms or signing in to outside services needs Albert's explicit word each time.

## 8. Access and environment
Secrets live in 1Password vault `vibe_coding`: `POP CRM Supabase Worker Env - hetz /home/ai/.crm-worker.env` and `scaledown.ai API key for testing` (used in production because no CRM-specific key exists). Vault id has changed from the one in the secrets skill; resolve it live. Fireflies dashboard: Chrome session as albert@popcre.com, which may expire.

## 9. Open questions and risks
- 2026-11-04: cause of missing automatic delivery is unknown.
- 2026-11-04: 0.93 rests on small samples, and only about 10% of known emails get a pick; failures go to UNROUTED, which is the safe side.
- 2026-11-04: the Fireflies signing secret appeared in this machine's local session record while being compared. It was not published and needs no rotation.
- ScaleDown states no data-retention terms in the pages read. Whole email bodies are sent to it.
- Possible follow-ups, not started: ScaleDown summarize or extract features.
