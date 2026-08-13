#!/usr/bin/env bash
# Validate every multi-line `run:` block in .github/workflows/*.yml with `bash -n`.
#
# Why this exists: deploy.yml carried seven orphaned lines (an `exit 0`, an
# unmatched `fi`, an unmatched `done`) left over from a deleted loop. Nothing
# caught it, because bash parses lazily and the step's success path exits long
# before reaching them, so the syntax error only existed on a path nobody hit.
#
# Run locally before touching a workflow:  scripts/check-workflow-shell.sh
set -euo pipefail

cd "$(dirname "$0")/.."

python3 - <<'PY' > /tmp/workflow-shell-blocks.txt
import glob
import os
import re

os.makedirs('/tmp/workflow-shell', exist_ok=True)
blocks = []
for path in sorted(glob.glob('.github/workflows/*.yml')):
    lines = open(path).read().split('\n')
    i = 0
    while i < len(lines):
        if not re.match(r'^\s*-?\s*run:\s*\|\s*$', lines[i]):
            i += 1
            continue
        start = i + 1
        indent = None
        body = []
        j = start
        while j < len(lines):
            line = lines[j]
            if line.strip() == '':
                body.append('')
                j += 1
                continue
            width = len(line) - len(line.lstrip())
            if indent is None:
                indent = width
            if width < indent:
                break
            body.append(line[indent:])
            j += 1
        blocks.append((path, start + 1, '\n'.join(body)))
        i = j

for n, (path, line, body) in enumerate(blocks):
    name = f'/tmp/workflow-shell/block-{n}.sh'
    open(name, 'w').write(body)
    print(f'{name}\t{path}:{line}')
PY

status=0
count=0
while IFS=$'\t' read -r file origin; do
  count=$((count + 1))
  if ! bash -n "$file" 2>/tmp/workflow-shell-error; then
    echo "FAIL $origin"
    sed 's/^/      /' /tmp/workflow-shell-error
    status=1
  fi
done < /tmp/workflow-shell-blocks.txt

if [ "$status" -eq 0 ]; then
  echo "OK: $count workflow shell blocks parse cleanly"
fi
exit "$status"
