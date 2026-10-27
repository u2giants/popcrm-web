#!/usr/bin/env python3
"""Build the one-transaction status restore for the 447 crm.ingested_domain rows.

Usage: build_restore_sql.py rehearse|apply CLONE.json LIVE_BEFORE.json TARGETS.json [E_OVERRIDE]
Inputs are local evidence files (never committed), lists of {id, domain, status}.
SQL goes to stdout, a summary with input digests to stderr. 'rehearse' ends in
ROLLBACK, 'apply' in COMMIT. The transaction aborts unless the in-transaction
count of writable rows equals E, computed here from the files. E_OVERRIDE
exists only for the negative test and must never be used on live.
"""
import hashlib, json, sys, uuid

EXPECTED_TARGETS = 447
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
    return "'" + s.replace("'", "''") + "'"


def main(argv):
    if len(argv) not in (5, 6) or argv[1] not in ("rehearse", "apply"):
        fail(__doc__)
    mode = argv[1]
    try:
        clone, h_clone = load(argv[2])
        live, h_live = load(argv[3])
        targets, h_targets = load(argv[4])
    except (KeyError, ValueError, TypeError) as e:
        fail(f"malformed input: {e!r}")
    if len(targets) != EXPECTED_TARGETS:
        fail(f"{len(targets)} targets, expected {EXPECTED_TARGETS}")
    if not set(clone) <= set(targets) or set(live) != set(targets):
        fail("clone or live ids do not match the target list")
    for i, r in clone.items():
        if r.get("status") not in VOCAB:
            fail(f"unexpected clone status {r.get('status')!r} for {r.get('domain')}")
    for i, r in live.items():
        if r.get("status") not in VOCAB:
            fail(f"unexpected live status {r.get('status')!r} for {r.get('domain')}")

    writes = sorted(i for i in clone if clone[i]["status"] != "OTHER" and live[i]["status"] == "OTHER")
    if not writes:
        fail("nothing to restore (all clone values OTHER: wrong restore point?)")
    e = len(writes) if len(argv) == 5 else int(argv[5])

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
    print(json.dumps({"E": e, "skipped_retriaged": skipped, "missing_in_clone": missing,
                      "sha256": {"clone": h_clone, "live_before": h_live, "targets": h_targets}}), file=sys.stderr)


if __name__ == "__main__":
    main(sys.argv)
