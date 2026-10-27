#!/usr/bin/env python3
"""Fixture tests for build_restore_sql.py: python3 -I .ai/scripts/test_build_restore_sql.py"""
import json, os, subprocess, sys, tempfile, uuid

HERE = os.path.dirname(os.path.abspath(__file__))
OLD = "2026-10-01T00:00:00Z"
ids = [str(uuid.uuid4()) for _ in range(447)]
ids50 = [str(uuid.uuid4()) for _ in range(50)]


def run(mode, clone, live_all, targets, intended):
    d = tempfile.mkdtemp()
    paths = []
    for name, rows in (("c", clone), ("l", live_all), ("t", targets), ("i", intended)):
        p = os.path.join(d, name + ".json")
        with open(p, "w") as f:
            json.dump(rows, f)
        paths.append(p)
    return subprocess.run([sys.executable, "-I", os.path.join(HERE, "build_restore_sql.py"), mode, *paths],
                          capture_output=True, text=True)


def rows(idl, status_of, seen=OLD):
    return [{"id": i, "domain": f"d{n}.com", "status": status_of(n), "first_seen_at": seen} for n, i in enumerate(idl)]


targets = rows(ids, lambda n: "OTHER")
intended = rows(ids50, lambda n: "OTHER")
clone = rows(ids, lambda n: "new" if n % 2 else "OTHER")
live_all = rows(ids, lambda n: "POTENTIAL_CUSTOMER" if n == 1 else "OTHER") + intended
fresh = [{"id": str(uuid.uuid4()), "domain": "fresh.com", "status": "new", "first_seen_at": "2026-10-27T18:00:00Z"}]

ok = run("apply", clone, live_all, targets, intended)
assert ok.returncode == 0, ok.stderr
summary = json.loads(ok.stderr)
assert summary["E"] == 222 and summary["skipped_retriaged"] == ["d1.com"], summary
assert "commit;" in ok.stdout and "primary key" in ok.stdout

reh = run("rehearse", clone, live_all, targets, intended)
assert reh.returncode == 0 and reh.stdout.rstrip().endswith("rollback;")
neg = run("negative-test", clone, live_all, targets, intended)
assert neg.returncode == 0 and "expected 223" in neg.stdout and neg.stdout.rstrip().endswith("rollback;")

post = run("apply", clone, live_all + fresh, targets, intended)
assert post.returncode == 0 and json.loads(post.stderr)["post_incident_rows"] == ["fresh.com"], post.stderr
assert run("apply", clone[:-1], live_all, targets, intended).returncode != 0
assert run("apply", clone, live_all[:-1] + [dict(live_all[-1], status="new")], targets, intended).returncode != 0

fails = {
    "unexplained extra live row": (clone, live_all + rows([str(uuid.uuid4())], lambda n: "OTHER"), targets, intended),
    "target absent from live": (clone, live_all[1:], targets, intended),
    "duplicate live ids": (clone, live_all + live_all[:3], targets, intended),
    "duplicate clone ids": (clone + clone[:2], live_all, targets, intended),
    "duplicate target ids": (clone, live_all, targets + targets[:1], intended),
    "clone superset": (clone + rows([str(uuid.uuid4())], lambda n: "new"), live_all, targets, intended),
    "E=0": (rows(ids, lambda n: "OTHER"), live_all, targets, intended),
    "unknown vocab": (rows(ids, lambda n: "Other "), live_all, targets, intended),
    "wrong target count": (clone, live_all, targets[:-1], intended),
    "intended overlaps targets": (clone, live_all, targets, intended[:49] + targets[:1]),
    "malformed": (clone, [{"id": "x"}], targets, intended),
    "missing first_seen_at": (clone, [{k: v for k, v in r.items() if k != "first_seen_at"} for r in live_all], targets, intended),
}
for name, args in fails.items():
    r = run("apply", *args)
    assert r.returncode != 0 and "abort:" in r.stderr, name
print("ok")
