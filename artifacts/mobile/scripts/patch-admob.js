#!/usr/bin/env node
// Patches react-native-google-mobile-ads Kotlin source for React Native 0.81+ compatibility.
// RN 0.81 removed the `currentActivity` property from ReactContext.
// This replaces `.currentActivity` with `.getCurrentActivity()` in all Kotlin files.

const fs = require("fs");
const path = require("path");

const dir = path.join(
  __dirname,
  "..",
  "node_modules",
  "react-native-google-mobile-ads",
  "android",
  "src",
  "main",
  "java",
  "io",
  "invertase",
  "googlemobileads"
);

if (!fs.existsSync(dir)) {
  console.log("[patch-admob] Directory not found, skipping patch:", dir);
  process.exit(0);
}

let patchedCount = 0;
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".kt"));

files.forEach((filename) => {
  const filePath = path.join(dir, filename);
  const original = fs.readFileSync(filePath, "utf8");
  const patched = original.replace(/\.currentActivity\b/g, ".getCurrentActivity()");
  if (original !== patched) {
    fs.writeFileSync(filePath, patched, "utf8");
    console.log("[patch-admob] Patched:", filename);
    patchedCount++;
  }
});

console.log(`[patch-admob] Done. ${patchedCount} file(s) patched.`);
