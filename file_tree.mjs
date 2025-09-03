#!/usr/bin/env node
/**
 * GloWell – Repo Tree Generator (clean, safe)
 * Usage:
 *   node file_tree.mjs            // writes repo-tree.txt in project root
 *   node file_tree.mjs --max-depth 6
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = process.cwd();

const argv = process.argv.slice(2);
const getArg = (name, dft) => {
  const i = argv.indexOf(name);
  if (i !== -1 && argv[i + 1]) return argv[i + 1];
  return dft;
};
const MAX_DEPTH = parseInt(getArg("--max-depth", "8"), 10);

const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  ".next",
  ".vercel",
  ".netlify",
  ".cache",
  ".vscode",
  ".idea",
  ".turbo",
  "tmp",
  "temp",
  "out",
  ".gradle",
  ".pnpm-store",
  ".parcel-cache",
  ".eslintcache",
  ".DS_Store",
]);

const IGNORE_FILES = new Set([
  ".DS_Store",
  "Thumbs.db",
]);

function isIgnored(name, fullPath) {
  const base = path.basename(fullPath);
  if (IGNORE_FILES.has(base)) return true;
  if (IGNORE_DIRS.has(base)) return true;
  return false;
}

function readDirSafe(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

function sortEntries(a, b) {
  if (a.isDirectory() && !b.isDirectory()) return -1;
  if (!a.isDirectory() && b.isDirectory()) return 1;
  return a.name.localeCompare(b.name);
}

function tree(dir, prefix = "", depth = 0, lines = []) {
  if (depth > MAX_DEPTH) return lines;

  const entries = readDirSafe(dir)
    .filter(d => !isIgnored(d.name, path.join(dir, d.name)))
    .sort(sortEntries);

  const lastIdx = entries.length - 1;

  entries.forEach((entry, idx) => {
    const isLast = idx === lastIdx;
    const connector = isLast ? "└── " : "├── ";
    const nextPrefix = prefix + (isLast ? "    " : "│   ");
    const fullPath = path.join(dir, entry.name);

    lines.push(prefix + connector + entry.name);

    if (entry.isDirectory()) {
      tree(fullPath, nextPrefix, depth + 1, lines);
    }
  });

  return lines;
}

function generateTree(root) {
  const header = [
    "GloWell Repository Tree",
    `Root: ${root}`,
    `Date: ${new Date().toISOString()}`,
    `Max Depth: ${MAX_DEPTH}`,
    "",
  ];
  const body = tree(root);
  return header.concat(body).join("\n") + "\n";
}

function main() {
  const outPath = path.join(ROOT, "repo-tree.txt");
  const content = generateTree(ROOT);

  process.stdout.write(content);           // print to console
  fs.writeFileSync(outPath, content, "utf8"); // write to file
  console.log(`\nSaved to: ${outPath}`);
}

main();
