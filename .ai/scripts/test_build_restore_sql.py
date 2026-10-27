#!/usr/bin/env python3
"""Fixture tests for build_restore_sql.py: run with python3 -I .ai/scripts/test_build_restore_sql.py"""
import json, os, subprocess, sys, tempfile, uuid

HERE = os.path.dirname(os.path.abspath(__file__))
ids = [str(uuid.uuid4()) for _ in range(447)]


def run(clone, live, targets, *extra):
    d = tempfile.mkdtemp()
    paths = []
    for name, rows in (("c", clone), ("l", live), ("t", targets)):
        p = os.path.join(d, name + ".json")
        with open(p, "w") as f:
            json.dump(rows, f)
        paths.append(p)
    return subprocess.run([sys.executable, "-I", os.path.join(HERE, "build_restore_sql.py"), "apply", *paths, *extra],
                          capture_output=True, text=True)


def rows(status_of):
    return [{"id": i, "domain": f"d{n}.com", "status": status_of(n)} for n, i in enumerate(ids)]


targets = rows(lambda n: "OTHER")
clone = rows(lambda n: "new" if n % 2 else "OTHER")
live = rows(lambda n: "POTENTIAL_CUSTOMER" if n == 1 else "OTHER")

r = run(clone, live, targets)
assert r.returncode == 0, r.stderr
assert json.loads(r.stderr)["E"] == 222 and json.loads(r.stderr)["skipped_retriaged"] == ["d1.com"]
assert "commit;" in r.stdout and "primary key" in r.stdout
assert run(clone, live + live[:3], targets).returncode != 0, "duplicates must abort"
assert run(rows(lambda n: "OTHER"), live, targets).returncode != 0, "E=0 must abort"
assert run(rows(lambda n: "Other "), live, targets).returncode != 0, "unknown vocab must abort"
assert run(clone, live[:-1], targets).returncode != 0, "live id mismatch must abort"
assert run(clone, live, targets[:-1]).returncode != 0, "wrong target count must abort"
assert run(clone, [{"id": "x"}], targets).returncode != 0, "malformed must abort"
print("ok")
