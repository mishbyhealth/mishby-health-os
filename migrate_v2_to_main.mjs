#!/usr/bin/env node
/**
 * V2 → Main Folders Migration
 * - Moves:  src/features-v2 -> src/features
 *           mho2            -> mho
 * - Updates import paths across the repo.
 * - Backs up existing targets if present.
 * - Supports --dry-run to preview changes.
 *
 * Usage:
 *   node scripts/migrate_v2_to_main.mjs --dry-run
 *   node scripts/migrate_v2_to_main.mjs
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = process.cwd();

const DRY = process.argv.includes("--dry-run");

const MOVE_PAIRS = [
  { from: "src/features-v2", to: "src/features" },
  { from: "mho",            to: "mho" }
];

const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  ".turbo",
]);

const CODE_EXT = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".css"
]);

const REPLACERS = [
  // @ alias and direct paths
  { from: /(['\/\/"`])@features-v2/g, to: "$1@/features/" },
  { from: /(['"`])features-v2(['"`])/g, to: "$1features$2" },
  { from: /(['"`])features-v2\//g, to: "$1features/" },

  { from: /(['\/\/"`])@mho2/g, to: "$1@/mho/" },
  { from: /(['"`])mho2(['"`])/g, to: "$1mho$2" },
  { from: /(['"`])mho2\//g, to: "$1mho/" },
];

const log = (...a) => console.log("[migrate]", ...a);
const warn = (...a) => console.warn("[warn]", ...a);

function ts() {
  const d = new Date();
  const pad = (n)=>String(n).padStart(2,"0");
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

async function exists(p) {
  try { await fs.stat(p); return true; } catch { return false; }
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function moveOrRename(src, dest) {
  if (!(await exists(src))) {
    warn(`Skip: "${src}" not found.`);
    return { moved:false, src, dest, reason:"missing" };
  }

  if (await exists(dest)) {
    const backup = `${dest}.backup-${ts()}`;
    log(`Backup existing "${dest}" -> "${backup}"`);
    if (!DRY) await fs.rename(dest, backup);
  }

  log(`Move "${src}" -> "${dest}"`);
  if (!DRY) {
    // Prefer rename; if cross-device issues occur, fallback to copy
    try {
      await fs.rename(src, dest);
    } catch (e) {
      warn(`rename failed (${e.message}), fallback to copy`);
      await copyDir(src, dest);
      await rmDir(src);
    }
  }
  return { moved:true, src, dest };
}

async function copyDir(src, dest) {
  await ensureDir(dest);
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const ent of entries) {
    const s = path.join(src, ent.name);
    const d = path.join(dest, ent.name);
    if (ent.isDirectory()) {
      await copyDir(s, d);
    } else if (ent.isFile()) {
      await fs.copyFile(s, d);
    }
  }
}

async function rmDir(dir) {
  await fs.rm(dir, { recursive: true, force: true });
}

async function* walk(dir) {
  const rel = path.relative(root, dir);
  if (IGNORE_DIRS.has(path.basename(dir))) return;

  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (!IGNORE_DIRS.has(ent.name)) {
        yield* walk(full);
      }
    } else if (ent.isFile()) {
      const ext = path.extname(ent.name);
      if (CODE_EXT.has(ext)) {
        yield full;
      }
    }
  }
}

async function replaceInFile(file, replacers) {
  const orig = await fs.readFile(file, "utf8");
  let next = orig;
  for (const r of replacers) {
    next = next.replace(r.from, r.to);
  }
  if (next !== orig) {
    log(`Update imports in: ${path.relative(root, file)}`);
    if (!DRY) await fs.writeFile(file, next, "utf8");
    return true;
  }
  return false;
}

async function main() {
  log(`Root: ${root}`);
  log(DRY ? "Mode: DRY-RUN (no changes may be written)" : "Mode: APPLY");

  // 1) Move/Rename Folders
  for (const pair of MOVE_PAIRS) {
    const src = path.join(root, pair.from);
    const dest = path.join(root, pair.to);
    await moveOrRename(src, dest);
  }

  // 2) Update imports across repo
  log("Scanning files to update imports...");
  let changed = 0;
  for await (const file of walk(root)) {
    const did = await replaceInFile(file, REPLACERS);
    if (did) changed++;
  }
  log(`Import updates: ${changed} file(s) modified.`);

  // 3) Final hints
  log("Done.");
  if (DRY) {
    log('If everything looks good, run again without "--dry-run".');
  } else {
    log("Next: npm run dev  (और देखें कि build OK है)");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
