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

# Patch react-native-google-mobile-ads Kotlin source for RN 0.81 compatibility.
# RN 0.81 removed the `currentActivity` property from ReactContext; use getCurrentActivity() instead.
ADMOB_KT_DIR="$MONOREPO_ROOT/artifacts/mobile/node_modules/react-native-google-mobile-ads/android/src/main/java/io/invertase/googlemobileads"
if [ -d "$ADMOB_KT_DIR" ]; then
  echo ">>> Patching react-native-google-mobile-ads Kotlin files for RN 0.81..."
  find "$ADMOB_KT_DIR" -name "*.kt" | while read -r f; do
    sed -i 's/\.currentActivity\b/.getCurrentActivity()/g' "$f"
  done
  echo ">>> Patch applied."
else
  echo ">>> Warning: react-native-google-mobile-ads Kotlin dir not found, skipping patch."
fi
