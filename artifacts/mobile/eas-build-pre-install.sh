#!/usr/bin/env bash
set -euo pipefail

echo ">>> EAS pre-install: pnpm $(pnpm --version)"

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
echo ">>> pnpm install done."

# ─── Patch react-native-google-mobile-ads for New Architecture ────────────────
# Root cause: In RN New Architecture, ReactContextBaseJavaModule no longer
# exposes the `currentActivity` Kotlin property. The Java method
# `getCurrentActivity()` still works in both Old and New Architecture.
#
# Files affected in v14.11.0:
#   ReactNativeGoogleMobileAdsFullScreenAdModule.kt  (lines 72, 108)
#   ReactNativeGoogleMobileAdsModule.kt              (lines 114, 139, 167, 168)
#
# Replacement rules (must be context-aware):
#   currentActivity?.  →  getCurrentActivity()?.    (safe call — keep nullable)
#   currentActivity ?: →  getCurrentActivity() ?:   (Elvis — keep nullable)
#   currentActivity!!  →  getCurrentActivity()!!    (already non-null asserted)
#   = currentActivity  →  = getCurrentActivity()!!  (assignment used as non-null)

echo ">>> Searching for react-native-google-mobile-ads Kotlin source..."

# Use find on the entire monorepo — handles pnpm virtual store (.pnpm dir)
ADMOB_JAVA=$(find "$MONOREPO_ROOT" \
  -path "*/react-native-google-mobile-ads/android/src/main/java/io/invertase/googlemobileads" \
  -type d 2>/dev/null | head -1)

if [ -z "$ADMOB_JAVA" ]; then
  echo ">>> ERROR: react-native-google-mobile-ads Kotlin source not found under $MONOREPO_ROOT"
  exit 1
fi

echo ">>> Found admob source: $ADMOB_JAVA"
echo ">>> Patching with Python for precise regex replacement..."

# Write the Python patcher inline
python3 - "$ADMOB_JAVA" <<'PYEOF'
import sys, os, re

directory = sys.argv[1]

for fname in os.listdir(directory):
    if not fname.endswith(".kt"):
        continue
    fpath = os.path.join(directory, fname)

    # Make writable (pnpm store may be read-only)
    os.chmod(fpath, 0o644)

    with open(fpath, "r", encoding="utf-8") as f:
        original = f.read()

    code = original

    # Rule 1: currentActivity?. → getCurrentActivity()?.   (safe-call, keep nullable)
    code = re.sub(r'\bcurrentActivity\?\.', 'getCurrentActivity()?.', code)

    # Rule 2: currentActivity ?: → getCurrentActivity() ?:  (Elvis, keep nullable)
    code = re.sub(r'\bcurrentActivity\s*\?:', 'getCurrentActivity() ?:', code)

    # Rule 3: currentActivity!! → getCurrentActivity()!!    (non-null asserted)
    code = re.sub(r'\bcurrentActivity!!', 'getCurrentActivity()!!', code)

    # Rule 4: = currentActivity (assignment) → = getCurrentActivity()!!
    # The assigned value is used as non-null (e.g. activity.runOnUiThread),
    # so we force non-null here to match the original intent.
    code = re.sub(r'(=\s*)currentActivity\b', r'\1getCurrentActivity()!!', code)

    # Rule 5: any remaining bare currentActivity (e.g. in comments) — safe to leave,
    # but replace to avoid any unexpected compile errors in future lines
    code = re.sub(r'\bcurrentActivity\b', 'getCurrentActivity()', code)

    if code != original:
        with open(fpath, "w", encoding="utf-8") as f:
            f.write(code)
        print(f"  [PATCHED] {fname}")
        # Show what changed
        for i, (a, b) in enumerate(zip(original.splitlines(), code.splitlines()), 1):
            if a != b:
                print(f"    line {i}: {a.strip()!r}")
                print(f"         -> {b.strip()!r}")
    else:
        print(f"  [clean]   {fname}")

print(">>> Patching complete.")
PYEOF
