#!/usr/bin/env node
/**
 * GloWell — repo-scan.mjs
 * Creates a clean, cross-platform repo tree at repo-tree.txt
 * Excludes heavy/system folders and dot-caches.
 */

import fs from "fs";
import path from "path";

const CWD = process.cwd();
const OUT = path.join(CWD, "repo-tree.txt");

// Folders to exclude at any level
const EXCLUDE = new Set([
  "node_modules",
  "dist",
  "build",
  ".git",
  ".next",
  ".cache",
  ".turbo",
  ".vscode",
  "coverage",
  ".parcel-cache",
  ".pnpm-store",
  ".DS_Store",
  ".vercel",
  ".firebase",
  ".idea",
]);

function isExcluded(name) {
  return EXCLUDE.has(name);
}

function listDir(dir) {
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  // sort: folders first, then files; by name
  entries.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });
  return entries;
}

function showTree(root, indent = "") {
  const entries = listDir(root).filter(
    (e) => !isExcluded(e.name) && e.name !== "repo-tree.txt"
  );
  const lines = [];
  for (let i = 0; i < entries.length; i++) {
    const it = entries[i];
    const isLast = i === entries.length - 1;
    const branch = indent + (isLast ? "└── " : "├── ");
    const nextIndent = indent + (isLast ? "    " : "│   ");
    const suffix = it.isDirectory() ? "/" : "";
    lines.push(branch + it.name + suffix);
    if (it.isDirectory()) {
      lines.push(...showTree(path.join(root, it.name), nextIndent));
    }
  }
  return lines;
}

function nowIST() {
  try {
    return new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  } catch {
    return new Date().toISOString();
  }
}

const header = `Repo: ${path.basename(CWD)}`;
const tree = showTree(CWD);
const stamp = `\nGenerated: ${nowIST()} (IST)\n`;

try {
  fs.writeFileSync(OUT, header + "\n" + tree.join("\n") + stamp, "utf8");
  console.log("✓ repo-tree.txt written.");
} catch (e) {
  console.error("Failed to write repo-tree.txt:", e?.message || e);
  process.exit(1);
}
