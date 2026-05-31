#!/usr/bin/env bash
# e2e test: starts the Go server with a JS worker, tests with curl
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
antines_DIR="$(cd "$APP_DIR/../.." && pwd)"
CORE_DIR="$(cd "$antines_DIR/../core" && pwd)"

echo "=== Step 1: Generate manifest ==="
cd "$APP_DIR"
bun run scripts/generate-manifest.ts

echo ""
echo "=== Step 2: Build Go server ==="
cd "$CORE_DIR"
go build -o "$APP_DIR/dist/server" ./cmd/antines

echo ""
echo "=== Step 3: Start Go server ==="
cd "$APP_DIR"
mkdir -p dist

SERVER_PORT=3456
./dist/server \
  --port $SERVER_PORT \
  --manifest "$APP_DIR/antines-manifest.json" \
  --workers 1 \
  --timeout 10s \
  --worker-entry "$APP_DIR/worker-entry.ts" \
  --bun "$(which bun)" &
SERVER_PID=$!

# Wait for the server to be ready
echo "Waiting for server to start..."
for i in $(seq 1 20); do
  if curl -s "http://localhost:$SERVER_PORT/health" > /dev/null 2>&1; then
    echo "Server ready!"
    break
  fi
  sleep 0.5
done

cleanup() {
  echo ""
  echo "=== Cleaning up ==="
  kill $SERVER_PID 2>/dev/null || true
  wait $SERVER_PID 2>/dev/null || true
  echo "Done."
}
trap cleanup EXIT INT TERM

echo ""
echo "=== Step 4: Run e2e tests ==="

# Test 1: GET /health (Go-only)
echo "Test 1: GET /health"
RESP=$(curl -s "http://localhost:$SERVER_PORT/health")
echo "  Response: $RESP"
if echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['status']=='ok', f'expected ok, got {d}'; assert 'uptime' in d" 2>/dev/null; then
  echo "  ✓ PASS"
else
  echo "  ✗ FAIL"
  exit 1
fi

# Test 2: GET /hello?name=Alice with query param
echo "Test 2: GET /hello?name=Alice"
RESP=$(curl -s "http://localhost:$SERVER_PORT/hello?name=Alice")
echo "  Response: $RESP"
if echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['message']=='Hello, Alice!', f'expected Hello, Alice!, got {d}'" 2>/dev/null; then
  echo "  ✓ PASS"
else
  echo "  ✗ FAIL"
  exit 1
fi

# Test 3: GET /hello without name (should fail validation — name is required)
echo "Test 3: GET /hello without name"
RESP=$(curl -s "http://localhost:$SERVER_PORT/hello")
echo "  Response: $RESP"
if echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); assert 'error' in d, f'expected validation error, got {d}'" 2>/dev/null; then
  echo "  ✓ PASS (validation rejected)"
else
  echo "  ✗ FAIL"
  exit 1
fi

# Test 4: POST /echo
echo "Test 4: POST /echo"
RESP=$(curl -s -X POST "http://localhost:$SERVER_PORT/echo" -H "Content-Type: application/json" -d '{"message":"Hello World","autor":"Alice"}')
echo "  Response: $RESP"
if echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['echoed']=='Echo: Hello World (by Alice)', f'expected Echo: Hello World (by Alice), got {d}'" 2>/dev/null; then
  echo "  ✓ PASS"
else
  echo "  ✗ FAIL"
  exit 1
fi

# Test 5: 404 for unknown route
echo "Test 5: GET /unknown → 404"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$SERVER_PORT/unknown")
echo "  Status: $STATUS"
if [ "$STATUS" = "404" ]; then
  echo "  ✓ PASS"
else
  echo "  ✗ FAIL (expected 404)"
  exit 1
fi

# Test 6: Validation error for invalid input
echo "Test 6: POST /echo with invalid body"
RESP=$(curl -s -X POST "http://localhost:$SERVER_PORT/echo" -H "Content-Type: application/json" -d '{"message":123}')
echo "  Response: $RESP"
# 123 is a number, not a string, so validation should fail
if echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); assert 'error' in d, f'expected error, got {d}'" 2>/dev/null; then
  echo "  ✓ PASS"
else
  echo "  ✗ FAIL"
  exit 1
fi

echo ""
echo "=== All tests passed! ==="
exit 0
