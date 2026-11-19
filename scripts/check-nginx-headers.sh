#!/usr/bin/env bash
# Build the production image and assert the response headers of the four path
# kinds that matter (popcrm-web issue #70): `/` (index.html, no-cache),
# `/assets/<file>` (single immutable Cache-Control), an SPA fallback route and
# `/version.json` (both no-store) — plus the security-headers snippet and
# server_tokens off on every one of them, and `nginx -t` inside the container.
#
# Run locally before touching nginx.conf or the Dockerfile:
#   scripts/check-nginx-headers.sh
#
# Skips (exit 0) when docker is unavailable: this is a local/CI convenience
# gate, not a blocker — the same headers are asserted on the live site by the
# issue #70 live proof. Builds with placeholder VITE_* values: nginx response
# headers do not depend on the baked bundle.
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v docker >/dev/null 2>&1 || ! docker info >/dev/null 2>&1; then
  echo "SKIP: docker is not available; header check not run."
  exit 0
fi

image="popcrm-web-headers-check:$$"
container="popcrm-web-headers-check-$$"
cleanup() {
  docker rm -f "$container" >/dev/null 2>&1 || true
  docker rmi "$image" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "Building image (placeholder build values; headers do not depend on them)..."
docker build -q -t "$image" \
  --build-arg VITE_SUPABASE_URL=https://placeholder.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=placeholder-anon-key \
  . >/dev/null

port="$(docker run -d --name "$container" -p 127.0.0.1::80 "$image" >/dev/null && docker port "$container" 80 | head -1 | sed 's/.*://')"
trap cleanup EXIT
base="http://127.0.0.1:${port}"
wait_for_nginx() {
  for _ in $(seq 1 30); do
    if curl -fsS -o /dev/null "$base/version.json"; then return 0; fi
    sleep 1
  done
  echo "FAIL: nginx did not come up on ${base}" >&2
  return 1
}
wait_for_nginx

# One hashed asset from the image, so the /assets/ check hits a real file.
asset="$(docker exec "$container" sh -c 'ls /usr/share/nginx/html/assets | head -1')"
if [ -z "$asset" ]; then
  echo "FAIL: no files under /usr/share/nginx/html/assets to test" >&2
  exit 1
fi

status=0
fail() {
  echo "FAIL: $1"
  status=1
}

# assert_headers <label> <path> <cache-control-value-regex>
assert_headers() {
  local label="$1" path="$2" cache_re="$3"
  local headers
  headers="$(curl -sI "${base}${path}")" || { fail "$label: request failed"; return; }
  echo "--- $label (${path})"
  echo "$headers" | tr -d '\r' | grep -Ei '^(HTTP/|Server:|Cache-Control:|X-Content-Type-Options:|X-Frame-Options:|Referrer-Policy:|Strict-Transport-Security:|Content-Security-Policy-Report-Only:)' | sed 's/^/    /'
  echo "$headers" | tr -d '\r' | grep -qi "^Cache-Control: ${cache_re}$" \
    || fail "$label: expected Cache-Control matching '${cache_re}'"
  local h
  for h in 'X-Content-Type-Options: nosniff' \
           'X-Frame-Options: DENY' \
           'Referrer-Policy: strict-origin-when-cross-origin' \
           'Strict-Transport-Security: max-age=31536000' \
           'Content-Security-Policy-Report-Only: default-src' ; do
    echo "$headers" | tr -d '\r' | grep -qiF "$h" \
      || fail "$label: missing security header '${h}'"
  done
  # server_tokens off: the Server header must not carry a version.
  if echo "$headers" | tr -d '\r' | grep -qiE '^Server: nginx/[0-9]'; then
    fail "$label: Server header exposes the nginx version"
  fi
}

assert_headers "index (no-cache)"        "/"                  'no-cache'
assert_headers "hashed asset (immutable)" "/assets/${asset}"  'public, max-age=31536000, immutable'
assert_headers "SPA fallback (no-store)"  "/some/spa/route"   'no-store'
assert_headers "version.json (no-store)"  "/version.json"     'no-store'

echo "--- nginx -t inside the container"
if ! docker exec "$container" nginx -t; then
  fail "nginx -t failed inside the container"
fi

if [ "$status" -eq 0 ]; then
  echo "OK: all four path kinds serve the expected cache and security headers."
fi
exit "$status"
