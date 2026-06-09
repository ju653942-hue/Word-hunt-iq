#!/usr/bin/env bash
set -euo pipefail

echo ">>> EAS pre-install hook: regenerating lockfile with build worker pnpm"
echo ">>> pnpm version: $(pnpm --version)"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ -d "/home/expo/workingdir/build" ]; then
  MONOREPO_ROOT="/home/expo/workingdir/build"
elif [ -f "$SCRIPT_DIR/pnpm-workspace.yaml" ]; then
  MONOREPO_ROOT="$SCRIPT_DIR"
elif [ -f "$SCRIPT_DIR/../../pnpm-workspace.yaml" ]; then
  MONOREPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
else
  MONOREPO_ROOT="$SCRIPT_DIR"
fi

echo ">>> Monorepo root: $MONOREPO_ROOT"
cd "$MONOREPO_ROOT"
pnpm install --no-frozen-lockfile
echo ">>> Lockfile regenerated successfully."
