#!/usr/bin/env bash
#
# Zod compatibility tests for @langchain/core and langchain (zod v4 only)
#
# Tests that exported types work correctly with:
#   1. zod@4.x consumer (semver range)
#   2. Two physical zod@4 copies (different patch versions nested under @langchain/core)
#
# Each test exercises public APIs (tool, StructuredOutputParser, createAgent, etc.)
# and runs `tsc --noEmit` in isolation.
#
# The zod4-dup test forces a second zod version into @langchain/core/node_modules
# so TypeScript resolves two distinct .d.ts trees for the same major.
#
# Usage:
#   ./environment_tests/test-zod-compat/run.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MONOREPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CORE_DIR="$MONOREPO_ROOT/libs/langchain-core"
LANGCHAIN_DIR="$MONOREPO_ROOT/libs/langchain"
WORK_DIR=$(mktemp -d)

# Force this version nested inside @langchain/core for the duplicate test
NESTED_ZOD_VERSION="4.1.12"

cleanup() {
  echo "Cleaning up $WORK_DIR"
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT

echo "=== Building packages ==="
cd "$MONOREPO_ROOT"
pnpm build --filter langchain 2>&1 | tail -3

echo "=== Packing @langchain/core ==="
CORE_TARBALL=$(cd "$CORE_DIR" && pnpm pack --pack-destination "$WORK_DIR" 2>/dev/null | tail -1)
if [ ! -f "$CORE_TARBALL" ]; then
  CORE_TARBALL=$(ls "$WORK_DIR"/langchain-core-*.tgz 2>/dev/null | head -1)
fi
echo "Core tarball: $CORE_TARBALL"

echo "=== Packing langchain ==="
LANGCHAIN_TARBALL=$(cd "$LANGCHAIN_DIR" && pnpm pack --pack-destination "$WORK_DIR" 2>/dev/null | tail -1)
if [ ! -f "$LANGCHAIN_TARBALL" ]; then
  LANGCHAIN_TARBALL=$(ls "$WORK_DIR"/langchain-[0-9]*.tgz 2>/dev/null | head -1)
fi
echo "Langchain tarball: $LANGCHAIN_TARBALL"

TESTS=("zod-v4" "zod4-dup")
PASS=0
FAIL=0

for test_name in "${TESTS[@]}"; do
  echo ""
  echo "=== Test: $test_name ==="
  TEST_SRC="$SCRIPT_DIR/$test_name"
  TEST_WORK="$WORK_DIR/$test_name"

  mkdir -p "$TEST_WORK/src"
  cp "$TEST_SRC/tsconfig.json" "$TEST_WORK/"
  cp "$TEST_SRC/src/test.ts" "$TEST_WORK/src/"
  cp "$TEST_SRC/package.json" "$TEST_WORK/"

  cd "$TEST_WORK"

  npm install --no-package-lock "$CORE_TARBALL" "$LANGCHAIN_TARBALL" 2>&1 | tail -3
  npm install --no-package-lock 2>&1 | tail -3

  if [ "$test_name" = "zod4-dup" ]; then
    echo "Forcing second zod@4 copy under @langchain/core..."
    CORE_NESTED="$TEST_WORK/node_modules/@langchain/core/node_modules"
    mkdir -p "$CORE_NESTED"
    npm pack "zod@$NESTED_ZOD_VERSION" --pack-destination "$CORE_NESTED" 2>/dev/null
    ZOD_TGZ=$(ls "$CORE_NESTED"/zod-*.tgz 2>/dev/null | head -1)
    mkdir -p "$CORE_NESTED/zod"
    tar xzf "$ZOD_TGZ" -C "$CORE_NESTED/zod" --strip-components=1
    rm -f "$ZOD_TGZ"
  fi

  echo "Installed zod version(s):"
  node -e "try{const p=require.resolve('zod');const j=require(require('path').join(require('path').dirname(p),'package.json'));console.log('  top-level zod:',j.version)}catch(e){console.log('  top-level zod: not found')}"
  node -e "
    const path = require('path');
    try {
      const coreDir = path.dirname(require.resolve('@langchain/core/package.json'));
      const zodPath = require.resolve('zod', { paths: [coreDir] });
      const zodPkg = require(path.join(path.dirname(zodPath), 'package.json'));
      console.log('  @langchain/core zod:', zodPkg.version);
    } catch(e) { console.log('  @langchain/core zod: not found'); }
  "

  echo "Running tsc --noEmit (timeout 120s, max 512MB heap)..."
  if timeout 120 node --max-old-space-size=512 ./node_modules/.bin/tsc --noEmit 2>&1; then
    echo "PASS: $test_name"
    PASS=$((PASS + 1))
  else
    echo "FAIL: $test_name"
    FAIL=$((FAIL + 1))
  fi
done

echo ""
echo "=== Results ==="
echo "Passed: $PASS / ${#TESTS[@]}"
echo "Failed: $FAIL / ${#TESTS[@]}"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
