#!/usr/bin/env bash
set -euo pipefail

echo ">>> EAS pre-install hook"
echo ">>> pnpm version: $(pnpm --version)"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ -d "/home/expo/workingdir/build" ]; then
  MONOREPO_ROOT="/home/expo/workingdir/build"
elif [ -f "$SCRIPT_DIR/../../pnpm-workspace.yaml" ]; then
  MONOREPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
else
  MONOREPO_ROOT="$SCRIPT_DIR"
fi

echo ">>> Monorepo root: $MONOREPO_ROOT"
cd "$MONOREPO_ROOT"
pnpm install --no-frozen-lockfile
echo ">>> Install complete."

# ── Patch react-native-google-mobile-ads for React Native 0.81 ──────────────
# In RN 0.81 the `.currentActivity` Kotlin property was removed from ReactContext.
# We patch every .kt file in the module to use .getCurrentActivity() instead.
echo ">>> Patching react-native-google-mobile-ads for RN 0.81..."
python3 << 'PYEOF'
import glob, os, sys

cwd = os.getcwd()
print("[patch] cwd:", cwd)

# Use glob with the known exact paths (no os.walk complexity)
patterns = [
    os.path.join(cwd, "artifacts", "mobile", "node_modules",
                 "react-native-google-mobile-ads", "android", "src", "main",
                 "java", "io", "invertase", "googlemobileads", "*.kt"),
    os.path.join(cwd, "node_modules",
                 "react-native-google-mobile-ads", "android", "src", "main",
                 "java", "io", "invertase", "googlemobileads", "*.kt"),
]

kt_files = []
for pattern in patterns:
    found = glob.glob(pattern)
    print(f"[patch] Pattern: {pattern}")
    print(f"[patch]   -> {len(found)} file(s) matched")
    kt_files.extend(found)

if not kt_files:
    print("[patch] ERROR: No Kotlin files found! Check the paths above.")
    sys.exit(0)

patched = 0
for fpath in kt_files:
    original = open(fpath, "r", encoding="utf-8").read()
    fixed = original.replace(".currentActivity", ".getCurrentActivity()")
    # Guard: avoid double-patch
    fixed = fixed.replace(".getCurrentActivity()()", ".getCurrentActivity()")
    if fixed != original:
        open(fpath, "w", encoding="utf-8").write(fixed)
        print("[patch] Patched:", os.path.basename(fpath))
        patched += 1
    else:
        print("[patch] No change needed:", os.path.basename(fpath))

print(f"[patch] Done. {patched} file(s) modified.")
PYEOF

echo ">>> Patch step complete."
