// scripts/diff-file-tree.mjs
// Usage:
// 1) At session START (captures content hashes):
//    node scripts/diff-file-tree.mjs --hash-snapshot .session-hash-start.json
//
// 2) At session END (produce change report):
//    node scripts/make-file-tree.mjs > repo-tree_START.txt   # (if you forgot to save at start, skip this; but better to save)
//    node scripts/make-file-tree.mjs > repo-tree_END.txt
//    node scripts/diff-file-tree.mjs --report repo-tree_START.txt repo-tree_END.txt --compare-hash .session-hash-start.json > session_changes.txt
//
// Output: ADDED / REMOVED / MODIFIED sections to stdout (redirect to session_changes.txt)

import fs from "fs";
import path from "path";
import crypto from "crypto";

const root = process.cwd();

function readList(file) {
  return new Set(
    fs.readFileSync(file, "utf8")
      .split(/\r?\n/)
      .map(s => s.trim())
      .filter(Boolean)
  );
}

function md5File(abs) {
  try {
    const h = crypto.createHash("md5");
    h.update(fs.readFileSync(abs));
    return h.digest("hex");
  } catch {
    return null;
  }
}

function listAllFilesExcludingNodeModules() {
  const out = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (p.includes(path.sep + "node_modules" + path.sep)) continue;
        walk(p);
      } else {
        if (p.includes(path.sep + "node_modules" + path.sep)) continue;
        out.push(path.relative(root, p).replace(/\\/g, "/"));
      }
    }
  }
  walk(root);
  out.sort();
  return out;
}

function snapshotHashes(outfile) {
  const files = listAllFilesExcludingNodeModules();
  const index = {};
  for (const rel of files) {
    index[rel] = md5File(path.resolve(root, rel));
  }
  fs.writeFileSync(outfile, JSON.stringify(index, null, 2), "utf8");
  console.log(`Wrote hash snapshot → ${outfile} (${Object.keys(index).length} files)`);
}

function diff(startListFile, endListFile, startHashFile) {
  const A = readList(startListFile);
  const B = readList(endListFile);

  const added = [...B].filter(x => !A.has(x));
  const removed = [...A].filter(x => !B.has(x));

  let modified = [];
  if (startHashFile && fs.existsSync(startHashFile)) {
    const startHashes = JSON.parse(fs.readFileSync(startHashFile, "utf8"));
    const common = [...B].filter(x => A.has(x));
    for (const rel of common) {
      const startHash = startHashes[rel] || null;
      const nowHash = md5File(path.resolve(root, rel));
      if (startHash && nowHash && startHash !== nowHash) modified.push(rel);
    }
  }

  function section(title, arr) {
    if (!arr.length) return "";
    return `\n${title}\n${"-".repeat(title.length)}\n` + arr.map(s => `• ${s}`).join("\n") + "\n";
  }

  let out = "";
  out += section("ADDED", added);
  out += section("REMOVED", removed);
  out += section("MODIFIED (content changed)", modified);

  if (!out.trim()) out = "No changes detected.\n";
  process.stdout.write(out);
}

// ---- CLI ----
const args = process.argv.slice(2);
if (args[0] === "--hash-snapshot") {
  const outfile = args[1] || ".session-hash-start.json";
  snapshotHashes(outfile);
  process.exit(0);
}
if (args[0] === "--report") {
  const startList = args[1];
  const endList = args[2];
  if (!startList || !endList) {
    console.error("Usage: node scripts/diff-file-tree.mjs --report <repo-tree_START.txt> <repo-tree_END.txt> [--compare-hash <.session-hash-start.json>]");
    process.exit(1);
  }
  const idx = args.indexOf("--compare-hash");
  const hashFile = idx >= 0 ? args[idx + 1] : null;
  diff(startList, endList, hashFile);
  process.exit(0);
}

console.error(`Usage:
  node scripts/diff-file-tree.mjs --hash-snapshot .session-hash-start.json
  node scripts/diff-file-tree.mjs --report repo-tree_START.txt repo-tree_END.txt --compare-hash .session-hash-start.json
`);
process.exit(1);
