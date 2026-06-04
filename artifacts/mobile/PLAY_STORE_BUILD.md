# Word Hunt — Play Store AAB Build Guide

## Prerequisites (on your local machine)
- Node.js 18+
- pnpm (`npm install -g pnpm`)
- EAS CLI (`npm install -g eas-cli`)
- An Expo account (free at https://expo.dev)

---

## Step 1 — Clone / download the project

Download the project from Replit and open a terminal in `artifacts/mobile/`.

---

## Step 2 — Install dependencies

```bash
pnpm install
```

---

## Step 3 — Log in to Expo

```bash
eas login
```

Enter your Expo account credentials. Create a free account at https://expo.dev if needed.

---

## Step 4 — Link the project to Expo

```bash
eas init
```

This creates a project on expo.dev and writes the `extra.eas.projectId` into `app.json`. Accept the default slug `word-hunt-game`.

---

## Step 5 — Build the signed AAB

```bash
eas build --platform android --profile production
```

EAS will:
1. Auto-generate and manage a signing keystore (stored securely on Expo servers)
2. Build your app in the cloud (~10–15 min)
3. Give you a direct download link for `app-release.aab`

> **Important:** When prompted about the keystore, choose **"Let EAS handle it"** for the easiest flow. EAS stores it securely and reuses it for future builds.

---

## Step 6 — Download the AAB

When the build finishes, the CLI prints:
```
✓ Build finished.
  Download: https://expo.dev/artifacts/eas/...app-release.aab
```

Download it and upload to Google Play Console.

---

## Play Store upload checklist

- [ ] AAB downloaded from EAS
- [ ] Google Play Console account created (one-time $25 fee)
- [ ] New app created in Play Console (package: `com.wordhunt.game`)
- [ ] AAB uploaded to **Internal Testing** track first
- [ ] Store listing filled out (title, description, screenshots)
- [ ] Content rating questionnaire completed
- [ ] Pricing set to Free
- [ ] App reviewed and promoted to **Production**

---

## Future builds (version bumps)

Before each new Play Store release, increment these in `app.json`:
```json
"version": "1.0.1",          // Human-readable
"android": {
  "versionCode": 2            // Must increase every upload
}
```

Then run `eas build --platform android --profile production` again.

---

## Useful EAS commands

| Command | Purpose |
|---|---|
| `eas build --platform android --profile preview` | Build an APK for device testing |
| `eas build --platform android --profile production` | Build AAB for Play Store |
| `eas submit --platform android` | Auto-upload AAB to Play Store |
| `eas build:list` | See all past builds |
| `eas credentials` | Manage signing keys |
