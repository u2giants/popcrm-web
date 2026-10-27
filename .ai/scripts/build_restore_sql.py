#!/usr/bin/env python3
"""Build the one-transaction status restore for the 447 crm.ingested_domain rows.

Usage: build_restore_sql.py rehearse|apply|negative-test CLONE.json LIVE_ALL.json TARGETS.json INTENDED50.json
Run the output with: psql -X -v ON_ERROR_STOP=1 -f FILE (one session; abort = rollback).
Inputs are local evidence files in .ai/evidence/ (never committed), lists of
{id, domain, status[, first_seen_at]}: the clone's 447 rows, the WHOLE live table,
the 447 target ids, and the owner's 50 intended ids. Only id, domain, status and
first_seen_at are ever exported (no sender or subject columns).
SQL goes to stdout, a summary with input digests to stderr. 'rehearse' ends in
ROLLBACK, 'apply' in COMMIT. The transaction aborts unless the in-transaction
count of writable rows equals E, computed here from the files. 'negative-test'
uses E+1 and ends in ROLLBACK; it must abort and is for the clone only.
"""
import hashlib, json, sys, uuid

EXPECTED_TARGETS = 447
INCIDENT_END = "2026-10-27T17:07:06.741Z"
VOCAB = {"new", "ACTIVE_CUSTOMER", "POTENTIAL_CUSTOMER", "OTHER", "ignored", "dismissed", "promoted"}


def fail(msg):
    sys.exit(f"build_restore_sql: abort: {msg}")


def load(path):
    with open(path, "rb") as f:
        raw = f.read()
    rows = json.loads(raw)
    ids = [str(uuid.UUID(r["id"])) for r in rows]
    if len(ids) != len(set(ids)):
        fail(f"duplicate ids in {path}")
    return {i: r for i, r in zip(ids, rows)}, hashlib.sha256(raw).hexdigest()


def q(s):
    # Only ever called on uuid-validated ids and VOCAB-checked statuses.
    return "'" + s.replace("'", "''") + "'"


def main(argv):
    if len(argv) != 6 or argv[1] not in ("rehearse", "apply", "negative-test"):
        fail(__doc__)
    mode = argv[1]
    try:
        clone, h_clone = load(argv[2])
        live_all, h_live = load(argv[3])
        targets, h_targets = load(argv[4])
        intended, h_intended = load(argv[5])
    except (KeyError, ValueError, TypeError) as e:
        fail(f"malformed input: {e!r}")
    if len(targets) != EXPECTED_TARGETS:
        fail(f"{len(targets)} targets, expected {EXPECTED_TARGETS}")
    if len(intended) != 50 or set(intended) & set(targets):
        fail("intended list is not 50 ids disjoint from the targets")
    from datetime import datetime
    end = datetime.fromisoformat(INCIDENT_END.replace("Z", "+00:00"))
    try:
        newer = {i for i, r in live_all.items()
                 if datetime.fromisoformat(r["first_seen_at"].replace("Z", "+00:00")) > end}
    except (KeyError, ValueError, TypeError) as e:
        fail(f"live rows need first_seen_at: {e!r}")
    if set(live_all) - set(intended) - newer != set(targets):
        fail("live table minus the intended 50 (and post-incident rows) is not exactly the target list")
    if not set(clone) <= set(targets):
        fail("clone has ids outside the target list")
    live = {i: live_all[i] for i in targets}
    for i, r in clone.items():
        if r.get("status") not in VOCAB:
            fail(f"unexpected clone status {r.get('status')!r} for {r.get('domain')}")
    for i, r in live.items():
        if r.get("status") not in VOCAB:
            fail(f"unexpected live status {r.get('status')!r} for {r.get('domain')}")

    writes = sorted(i for i in clone if clone[i]["status"] != "OTHER" and live[i]["status"] == "OTHER")
    if not writes:
        fail("nothing to restore (all clone values OTHER: wrong restore point?)")
    e = len(writes) + (1 if mode == "negative-test" else 0)

    rows = ",\n".join(f"({q(i)}::uuid, {q(clone[i]['status'])})" for i in writes)
    print(f"""\\set ON_ERROR_STOP on
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
create temp table t (id uuid primary key, old_status text not null) on commit drop;
insert into t values
{rows};
select count(*) as locked from (select 1 from crm.ingested_domain where id in (select id from t) for update) l;
do $$
declare n int;
begin
  select count(*) into n from crm.ingested_domain d join t on t.id = d.id where d.status = 'OTHER';
  if n <> {e} then raise exception 'writable rows % <> expected {e}', n; end if;
end $$;
with u as (
  update crm.ingested_domain d set status = t.old_status from t
  where d.id = t.id and d.status = 'OTHER' returning d.id)
select count(*) as written from u;
do $$
declare n int;
begin
  select count(*) into n from crm.ingested_domain d join t on t.id = d.id where d.status = t.old_status;
  if n <> {e} then raise exception 'restored rows % <> expected {e}', n; end if;
end $$;
{'commit' if mode == 'apply' else 'rollback'};""")
    skipped = sorted(clone[i]["domain"] for i in clone if live[i]["status"] != "OTHER")
    missing = sorted(targets[i]["domain"] for i in targets if i not in clone)
    print(json.dumps({"E": e, "post_incident_rows": sorted(live_all[i]["domain"] for i in newer), "skipped_retriaged": skipped, "missing_in_clone": missing,
                      "sha256": {"clone": h_clone, "live_before": h_live, "targets": h_targets, "intended": h_intended}}), file=sys.stderr)


if __name__ == "__main__":
    main(sys.argv)
