#!/usr/bin/env node
/**
 * GloWell — ensure-scripts.mjs
 * Safely injects npm scripts into package.json if they don't exist:
 * - repo:scan  -> node scripts/repo-scan.mjs
 * - lock       -> PowerShell lock (Windows) or fallback echo on non-Windows
 * - unlock     -> PowerShell unlock (Windows) or fallback echo on non-Windows
 * - lint:nc    -> node scripts/nonclinical-lint.v2.cjs   (only if file exists)
 *
 * No other changes are made. Indentation preserved at 2 spaces.
 */

import fs from "fs";
import path from "path";

const PKG = path.join(process.cwd(), "package.json");
if (!fs.existsSync(PKG)) {
  console.error("package.json not found in repo root.");
  process.exit(1);
}
const raw = fs.readFileSync(PKG, "utf8");
let pkg;
try {
  pkg = JSON.parse(raw);
} catch (e) {
  console.error("Failed to parse package.json:", e?.message || e);
  process.exit(1);
}
pkg.scripts = pkg.scripts || {};

const isWin = process.platform === "win32";

function addScriptIfMissing(name, value) {
  if (!pkg.scripts[name]) {
    pkg.scripts[name] = value;
    return true;
  }
  return false;
}

let changed = false;

// repo:scan
changed = addScriptIfMissing("repo:scan", "node scripts/repo-scan.mjs") || changed;

// lock/unlock (prefer PowerShell scripts if present)
const lockPS = "scripts/Lock.ps1";
const unlockPS = "scripts/Unlock.ps1";
const hasLockPS = fs.existsSync(path.join(process.cwd(), lockPS));
const hasUnlockPS = fs.existsSync(path.join(process.cwd(), unlockPS));

if (isWin && hasLockPS) {
  changed = addScriptIfMissing(
    "lock",
    'powershell -ExecutionPolicy Bypass -File ./scripts/Lock.ps1'
  ) || changed;
} else {
  changed = addScriptIfMissing("lock", "echo \"Lock script is Windows-only or missing.\"") || changed;
}

if (isWin && hasUnlockPS) {
  changed = addScriptIfMissing(
    "unlock",
    'powershell -ExecutionPolicy Bypass -File ./scripts/Unlock.ps1'
  ) || changed;
} else {
  changed = addScriptIfMissing("unlock", "echo \"Unlock script is Windows-only or missing.\"") || changed;
}

// lint:nc → only if file exists
const lintFile = "scripts/nonclinical-lint.v2.cjs";
if (fs.existsSync(path.join(process.cwd(), lintFile))) {
  changed = addScriptIfMissing("lint:nc", "node scripts/nonclinical-lint.v2.cjs") || changed;
}

if (!changed) {
  console.log("No changes needed — scripts already present.");
  process.exit(0);
}

try {
  fs.writeFileSync(PKG, JSON.stringify(pkg, null, 2) + "\n", "utf8");
  console.log("✓ package.json updated with missing scripts.");
} catch (e) {
  console.error("Failed to write package.json:", e?.message || e);
  process.exit(1);
}
