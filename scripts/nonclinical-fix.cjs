#!/usr/bin/env node
/**
 * Nonclinical Fix — auto-rewords disallowed clinical terms into neutral wellness language.
 * - Works on .md/.txt globally
 * - In code files (.ts/.tsx/.js/.mjs/.cjs), only rewrites inside string literals ('', "", ``)
 * - Skips node_modules, build folders, VCS, and compliance sources
 *
 * Usage:
 * 1) Dry run:  node scripts/nonclinical-fix.cjs
 * 2) Write:    node scripts/nonclinical-fix.cjs --write
 *
 * Recommended flow:
 *   node scripts/nonclinical-fix.cjs && node scripts/nonclinical-lint.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SKIP_DIRS = new Set([
  'node_modules','dist','build','.git','.next','.vercel','coverage','.cache','.turbo',
  '.firebase','.husky','functions/lib'
]);
const INCLUDE_EXT = new Set(['.ts', '.tsx', '.md', '.txt', '.cjs', '.mjs', '.js']);

const ARGS = new Set(process.argv.slice(2));
const DO_WRITE = ARGS.has('--write');

const GLOSSARY_PATH = path.join(ROOT, 'scripts', 'nonclinical-glossary.json');
if (!fs.existsSync(GLOSSARY_PATH)) {
  console.error('❌ Missing scripts/nonclinical-glossary.json');
  process.exit(2);
}
const glossary = JSON.parse(fs.readFileSync(GLOSSARY_PATH, 'utf8'));

/** Build regex for each term (word boundary, case-insensitive). */
function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function tokenToRegex(token) {
  // support multi-word tokens like "ace inhibitor"
  const parts = token.trim().split(/\s+/).map(escapeRe);
  const body = parts.join('\\s+');
  return new RegExp(`\\b${body}\\b`, 'gi');
}
const REPLACERS = Object.entries(glossary).map(([k, v]) => ({ re: tokenToRegex(k), to: v }));

// Units (e.g., "[units redacted]", "[units redacted]", "[units redacted]")
const RE_UNITS_NUMBERED = /\b\d+(?:\.\d+)?\s?(mg|mcg|ml)\b/gi;
// Lone unit tokens (rare in prose)
const RE_UNITS_LONE = /\b(mg|mcg|ml)\b/gi;
// Absolute claims softener
const RE_ABSOLUTES = /\b(guarantees?|will|certainly|100%)\b/gi;

function walk(dir, out = []) {
  if (SKIP_DIRS.has(path.basename(dir))) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // never touch compliance sources
      if (p.includes(path.join('mho2', 'compliance'))) continue;
      if (p.includes(path.join('mho', 'compliance'))) continue;
      walk(p, out);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (INCLUDE_EXT.has(ext)) out.push(p);
    }
  }
  return out;
}

/** Replace inside plain text (md/txt) — global. */
function replaceInPlainText(txt) {
  let changed = 0;
  let out = txt;

  const before = out;
  for (const { re, to } of REPLACERS) out = out.replace(re, () => { changed++; return to; });
  out = out.replace(RE_UNITS_NUMBERED, () => { changed++; return '[units redacted]'; });
  out = out.replace(RE_UNITS_LONE, () => { changed++; return '[units redacted]'; });
  out = out.replace(RE_ABSOLUTES, () => { changed++; return 'may'; });

  return { text: out, changed, modified: before !== out };
}

/** Replace only inside string literals for code files. */
function replaceInCodeStrings(txt) {
  let i = 0, out = '', changed = 0;
  const n = txt.length;
  let mode = null; // 'single' | 'double' | 'backtick' | null
  let buf = '';
  let braceDepth = 0; // for template literals ${...}
  function flushBuf(process = false) {
    if (!buf) return '';
    if (!process) { const b = buf; buf = ''; return b; }
    // apply replacements in buf
    let local = buf, localChanged = 0;
    for (const { re, to } of REPLACERS) local = local.replace(re, () => { localChanged++; return to; });
    local = local.replace(RE_UNITS_NUMBERED, () => { localChanged++; return '[units redacted]'; });
    local = local.replace(RE_UNITS_LONE, () => { localChanged++; return '[units redacted]'; });
    local = local.replace(RE_ABSOLUTES, () => { localChanged++; return 'may'; });
    changed += localChanged;
    buf = '';
    return local;
  }

  while (i < n) {
    const ch = txt[i];
    const next = txt[i+1];

    if (!mode) {
      if (ch === "'" || ch === '"' || ch === '`') {
        mode = ch === "'" ? 'single' : ch === '"' ? 'double' : 'backtick';
        out += ch; i++; continue;
      } else {
        out += ch; i++; continue;
      }
    }

    // Inside a string
    if (mode === 'single') {
      if (ch === '\\') { out += ch + next; i += 2; continue; }
      if (ch === "'") { out += flushBuf(true) + ch; mode = null; i++; continue; }
      buf += ch; i++; continue;
    }

    if (mode === 'double') {
      if (ch === '\\') { out += ch + next; i += 2; continue; }
      if (ch === '"') { out += flushBuf(true) + ch; mode = null; i++; continue; }
      buf += ch; i++; continue;
    }

    // backtick template
    if (mode === 'backtick') {
      if (ch === '\\') { out += ch + next; i += 2; continue; }
      if (ch === '$' && next === '{') {
        // close current chunk, emit processed, then pass through ${...}
        out += flushBuf(true) + '${'; i += 2; braceDepth = 1;
        // copy template expression verbatim
        while (i < n && braceDepth > 0) {
          const c = txt[i];
          out += c;
          if (c === '{') braceDepth++;
          else if (c === '}') braceDepth--;
          i++;
        }
        continue;
      }
      if (ch === '`') { out += flushBuf(true) + '`'; mode = null; i++; continue; }
      buf += ch; i++; continue;
    }
  }
  // end of file
  if (mode) {
    // unterminated string — still process buffer, but don't add a closing quote
    out += flushBuf(true);
  }

  return { text: out, changed, modified: changed > 0 };
}

function processFile(file) {
  const ext = path.extname(file).toLowerCase();
  const content = fs.readFileSync(file, 'utf8');
  let result;
  if (ext === '.md' || ext === '.txt') result = replaceInPlainText(content);
  else result = replaceInCodeStrings(content);

  if (result.modified && DO_WRITE) fs.writeFileSync(file, result.text, 'utf8');
  return { file, changed: result.changed, modified: result.modified };
}

const files = walk(ROOT);
let totalChanged = 0;
let totalFiles = 0;

for (const f of files) {
  const { changed, modified } = processFile(f);
  if (modified) {
    totalFiles++;
    totalChanged += changed;
    console.log(`${DO_WRITE ? '✍️  changed' : '🔎 would change'}: ${path.relative(ROOT, f)} (${changed} repl)`);
  }
}

if (totalFiles === 0) {
  console.log('✅ No changes needed.\n'\n);
} else {
  console.log(`${DO_WRITE ? '✅ Wrote' : '🧪 Dry run:'} ${totalFiles} file(s), ${totalChanged} replacement(s).`);
  if (!DO_WRITE) console.log('Run with --write to apply changes.');
}
