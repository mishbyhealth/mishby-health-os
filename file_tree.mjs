import { readdirSync, statSync, writeFileSync } from "fs";
import { join, basename } from "path";

const EXCLUDE = new Set(["node_modules", ".git", "dist", "build", ".next", ".cache"]);
const MAX_DEPTH = 5;

function walk(dir, prefix = "", depth = 1) {
  if (depth > MAX_DEPTH) return "";
  const entries = readdirSync(dir, { withFileTypes: true })
    .map(e => e.name)
    .filter(n => !EXCLUDE.has(n))
    .sort((a,b)=>a.localeCompare(b));
  let out = "";
  entries.forEach((name, i) => {
    const full = join(dir, name);
    const isDir = statSync(full).isDirectory();
    const last = i === entries.length - 1;
    const connector = last ? "└── " : "├── ";
    out += prefix + connector + name + (isDir ? "/" : "") + "\n";
    if (isDir) {
      const nextPrefix = prefix + (last ? "    " : "│   ");
      out += walk(full, nextPrefix, depth + 1);
    }
  });
  return out;
}

const root = process.cwd();
const header =
  `# Project Tree (${basename(root)})\n` +
  `# Generated: ${new Date().toISOString()}\n` +
  `# Max depth: ${MAX_DEPTH}\n\n` +
  `${basename(root)}/\n`;

const body = walk(root, "", 1);
writeFileSync("file_tree.txt", header + body, { flag: "w" });

console.log("✅ file_tree.txt updated (tree style, 5 levels, with timestamp).");
console.log("Tip: View in VS Code with UTF-8 to see connectors correctly.");
