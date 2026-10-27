#!/usr/bin/env python3
"""Build the one-transaction status restore for the 447 crm.ingested_domain rows.

Inputs (local evidence, never committed): clone_old_values.json and
live_before_restore.json, each a list of {id, domain, status, updated_at}.
Output: SQL on stdout. Mode 'rehearse' ends in ROLLBACK, 'apply' in COMMIT.
The transaction aborts unless the in-transaction count of writable rows equals
E, computed here from the two files without touching the database.
"""
import json, sys, uuid

mode, clone_path, live_path, targets_path = sys.argv[1:5]
assert mode in ("rehearse", "apply")
targets = [r["id"] for r in json.load(open(targets_path))]
assert len(targets) == 447 == len(set(targets))
clone = {r["id"]: r for r in json.load(open(clone_path))}
live = {r["id"]: r for r in json.load(open(live_path))}
assert set(clone) <= set(targets) and set(live) == set(targets)
for r in clone.values():
    assert isinstance(r["status"], str) and r["status"], r

writes = sorted(i for i in clone if clone[i]["status"] != "OTHER" and live[i]["status"] == "OTHER")
E = len(writes)

def q(s):
    return "'" + s.replace("'", "''") + "'"

rows = ",\n".join(f"({q(str(uuid.UUID(i)))}::uuid, {q(clone[i]['status'])})" for i in writes)
print(f"""\\set ON_ERROR_STOP on
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
create temp table t (id uuid primary key, old_status text not null) on commit drop;
insert into t values
{rows};
select 1 from crm.ingested_domain where id in (select id from t) for update;
do $$
declare n int;
begin
  select count(*) into n from crm.ingested_domain d join t on t.id = d.id where d.status = 'OTHER';
  if n <> {E} then raise exception 'writable rows % <> expected {E}', n; end if;
end $$;
with u as (
  update crm.ingested_domain d set status = t.old_status from t
  where d.id = t.id and d.status = 'OTHER' returning d.id)
select count(*) as written from u;
do $$
declare n int;
begin
  select count(*) into n from crm.ingested_domain d join t on t.id = d.id where d.status = t.old_status;
  if n <> {E} then raise exception 'restored rows % <> expected {E}', n; end if;
end $$;
{'commit' if mode == 'apply' else 'rollback'};""")
print(f"-- E={E} skipped_retriaged={sum(1 for i in clone if live[i]['status']!='OTHER')} missing_in_clone={len(targets)-len(clone)}", file=sys.stderr)
