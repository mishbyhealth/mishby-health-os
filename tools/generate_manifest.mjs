// tools/generate_manifest.mjs
// Usage: node tools/generate_manifest.mjs
// Outputs into ./_manifest/: file-tree.txt, manifest.csv, duplicates.txt, summary.txt

import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import { join, relative, extname } from "node:path";
import os from "node:os";

const ROOT = process.cwd();
const OUTDIR = join(ROOT, "_manifest");

// Folders and globs to skip (tweak as needed)
const IGNORE_DIRS = new Set([
  "node_modules", "dist", "build", ".git", ".next", ".turbo", "coverage",
  ".cache", ".parcel-cache", ".vite", ".vscode", ".idea", "cypress/videos",
  ".DS_Store", "tmp", "temp"
]);
// Skip binary blobs if you want (still fine to include)
const IGNORE_EXTS = new Set([
  ".png",".jpg",".jpeg",".webp",".gif",".ico",".mp4",".mov",".zip",".gz",".tgz",
  ".woff",".woff2",".ttf",".eot",".pdf" // keep .pdf if you want them hashed too
]);

// Treat these as intentional duplicates (used in header/footer vs PWA icons)
const IGNORE_DUP_PATHS = new Set([
  "public/logo.png",
  "public\\logo.png",
  "public/logo512.png",
  "public\\logo512.png",
]);

function isIgnored(pathRel, dirent) {
  if (dirent.isDirectory() && IGNORE_DIRS.has(dirent.name)) return true;
  const ext = extname(pathRel).toLowerCase();
  if (!dirent.isDirectory() && IGNORE_EXTS.has(ext)) return false; // include by default; set true to skip
  return false;
}

async function* walk(dirAbs, baseRel = "") {
  const entries = await fs.readdir(dirAbs, { withFileTypes: true });
  for (const d of entries) {
    const abs = join(dirAbs, d.name);
    const rel = relative(ROOT, abs);
    if (isIgnored(rel, d)) continue;

    if (d.isDirectory()) {
      yield* walk(abs, join(baseRel, d.name));
    } else if (d.isFile()) {
      yield rel;
    }
  }
}

async function sha256File(absPath) {
  const hash = createHash("sha256");
  const fh = await fs.open(absPath);
  try {
    const stream = fh.createReadStream();
    await new Promise((res, rej) => {
      stream.on("data", (chunk) => hash.update(chunk));
      stream.on("end", res);
      stream.on("error", rej);
    });
    return hash.digest("hex");
  } finally {
    await fh.close();
  }
}

function pad(n, width=6) {
  return String(n).padStart(width, " ");
}

async function main() {
  await fs.mkdir(OUTDIR, { recursive: true });

  const files = [];
  for await (const rel of walk(ROOT)) {
    files.push(rel);
  }
  files.sort((a,b)=> a.localeCompare(b));

  const rows = [];
  const byHash = new Map();
  const byName = new Map();

  // Build rows with metadata + hashes
  for (const rel of files) {
    const abs = join(ROOT, rel);
    const st = await fs.stat(abs);
    const hash = await sha256File(abs);
    const ext = extname(rel).toLowerCase();
    const mtime = st.mtime.toISOString();

    rows.push({ path: rel, size: st.size, sha256: hash, ext, mtime });

    if (!byHash.has(hash)) byHash.set(hash, []);
    byHash.get(hash).push(rel);

    const baseName = rel.split("/").pop();
    if (!byName.has(baseName)) byName.set(baseName, []);
    byName.get(baseName).push(rel);
  }

  // Write file-tree.txt (pretty list)
  const tree = rows.map(r => `${pad(r.size)}  ${r.path}`).join("\n");
  await fs.writeFile(join(OUTDIR, "file-tree.txt"), tree + "\n", "utf8");

  // Write manifest.csv
  const header = "path,size,sha256,ext,mtime";
  const csv = [header, ...rows.map(r =>
    `"${r.path.replace(/"/g,'""')}",${r.size},${r.sha256},${r.ext},"${r.mtime}"`
  )].join("\n");
  await fs.writeFile(join(OUTDIR, "manifest.csv"), csv + "\n", "utf8");

  // Write duplicates.txt (by hash) and also same-name collisions
  const dupLines = [];
  dupLines.push("# Duplicate content (same sha256):");
  for (const [hash, list] of byHash.entries()) {
    const allIgnored = list.every(p => IGNORE_DUP_PATHS.has(p));
    if (list.length > 1 && !allIgnored) {
      dupLines.push(`\nsha256=${hash}`);
      for (const p of list) dupLines.push(`  - ${p}`);
    }
  }
  dupLines.push("\n# Same filename (different paths):");
  for (const [name, list] of byName.entries()) {
    if (list.length > 1) {
      dupLines.push(`\nname=${name}`);
      for (const p of list) dupLines.push(`  - ${p}`);
    }
  }
  await fs.writeFile(join(OUTDIR, "duplicates.txt"), dupLines.join("\n") + "\n", "utf8");

  // Summary
  const dupFileGroups = [...byHash.values()].filter(v => v.length > 1 && !v.every(p => IGNORE_DUP_PATHS.has(p))).length;
  const sameNameGroups = [...byName.values()].filter(v => v.length > 1).length;
  const summary = [
    `OS: ${os.platform()} ${os.release()}`,
    `Scanned files: ${rows.length}`,
    `Duplicate-content groups (same sha256): ${dupFileGroups}`,
    `Same-name groups (different paths): ${sameNameGroups}`,
    `Output:`,
    `  - _manifest/file-tree.txt`,
    `  - _manifest/manifest.csv`,
    `  - _manifest/duplicates.txt`,
    `  - _manifest/summary.txt`
  ].join("\n");
  await fs.writeFile(join(OUTDIR, "summary.txt"), summary + "\n", "utf8");

  console.log("\nManifest generated in ./_manifest");
  console.log(summary);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
