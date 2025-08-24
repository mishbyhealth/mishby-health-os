import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const MAX_DEPTH = Number(process.argv[3] || 6);
const OUTPUT = path.resolve(ROOT, "file_tree.txt");

const IGNORE_DIRS = new Set([
  "node_modules",".git","dist","build",".next",".cache",".turbo",
  ".vercel",".netlify","coverage",".vscode",".idea",".husky",".pnpm-store"
]);
const IGNORE_FILES = new Set([".DS_Store","Thumbs.db"]);

function isHidden(name){
  const keep = new Set([".env",".env.example",".editorconfig",".gitignore",".prettierrc",".eslintrc"]);
  return name.startsWith(".") && !keep.has(name);
}

function listDir(dir, depth=0){
  if (depth > MAX_DEPTH) return [];
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return []; }

  entries.sort((a,b)=>{
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });

  const lines = [];
  for (const entry of entries){
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && (IGNORE_DIRS.has(entry.name) || isHidden(entry.name))) continue;
    if (entry.isFile() && (IGNORE_FILES.has(entry.name) || isHidden(entry.name))) continue;

    const prefix = "│   ".repeat(Math.max(0, depth)) + (depth ? "├── " : "");
    lines.push(`${prefix}${entry.name}`);
    if (entry.isDirectory()) lines.push(...listDir(full, depth+1));
  }
  return lines;
}

const header = [
  `Root: ${ROOT}`,
  `Max Depth: ${MAX_DEPTH}`,
  `Excluded dirs: ${[...IGNORE_DIRS].join(", ")}`,
  `Excluded files: ${[...IGNORE_FILES].join(", ")}`,
  "",
  ".",
];

const body = listDir(ROOT, 0);
const out = header.concat(body).join("\n") + "\n";
fs.writeFileSync(OUTPUT, out, "utf8");
console.log(`✅ Wrote clean tree to: ${OUTPUT}`);
