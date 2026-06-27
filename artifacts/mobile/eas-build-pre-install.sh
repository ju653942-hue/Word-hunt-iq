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

# ── Patch react-native-google-mobile-ads for React Native 0.81 ──────────────
# RN 0.81 removed `.currentActivity` property and changed some thread APIs.
# We patch the Kotlin source right after install so Gradle compiles cleanly.
echo ">>> Applying react-native-google-mobile-ads RN-0.81 patch..."
python3 - <<'PYEOF'
import os, sys

# Search both possible pnpm locations (workspace-local and hoisted root)
MONOREPO_ROOT = os.environ.get("MONOREPO_ROOT", os.getcwd())
search_roots = [
    os.path.join(MONOREPO_ROOT, "artifacts", "mobile", "node_modules"),
    os.path.join(MONOREPO_ROOT, "node_modules"),
]

kt_dir = None
for root in search_roots:
    candidate = os.path.join(
        root,
        "react-native-google-mobile-ads",
        "android", "src", "main", "java",
        "io", "invertase", "googlemobileads",
    )
    if os.path.isdir(candidate):
        kt_dir = candidate
        print(f"[patch-admob] Found Kotlin sources at: {candidate}")
        break

if kt_dir is None:
    print("[patch-admob] WARNING: Kotlin source dir not found — skipping patch.")
    print("[patch-admob] Searched in:", search_roots)
    sys.exit(0)

patched = 0
for fname in os.listdir(kt_dir):
    if not fname.endswith(".kt"):
        continue
    fpath = os.path.join(kt_dir, fname)
    original = open(fpath, "r", encoding="utf-8").read()
    fixed = original

    # Fix 1: .currentActivity property → .getCurrentActivity() method call
    fixed = fixed.replace(".currentActivity", ".getCurrentActivity()")

    # Fix 2: double-fix if patch was already partially applied
    fixed = fixed.replace(".getCurrentActivity()()", ".getCurrentActivity()")

    if fixed != original:
        open(fpath, "w", encoding="utf-8").write(fixed)
        print(f"[patch-admob] Patched: {fname}")
        patched += 1
    else:
        print(f"[patch-admob] No changes needed: {fname}")

print(f"[patch-admob] Done. {patched} file(s) patched.")
PYEOF

echo ">>> Patch complete."
