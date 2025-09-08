#!/usr/bin/env node
/**
 * Nonclinical Lint (string/prose only)
 * ------------------------------------
 * Scans only prose files (.md, .txt) entirely, and for code files (.ts/.tsx/.js/.mjs/.cjs)
 * scans only inside string literals ('', "", ``). Ignores identifiers and comments by design.
 *
 * Ignore controls:
 *  - Line: add "nonclinical-ignore-line"
 *  - Next line: add "nonclinical-ignore-next-line"
 *  - Block in prose (.md/.txt): wrap with:
 *      <!-- nonclinical-ignore-start -->
 *      <!-- nonclinical-ignore-end -->
 *
 * Skips: node_modules, build outputs, VCS, compliance sources, tooling scripts.
 *
 * Exit: 0 if no hits, 1 if hits.
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SKIP_DIRS = new Set([
  'node_modules','dist','build','.git','.next','.vercel','coverage','.cache','.turbo',
  '.firebase','.husky','functions/lib','scripts' // ← tooling excluded
]);
const INCLUDE_EXT = new Set(['.ts', '.tsx', '.md', '.txt', '.cjs', '.mjs', '.js']);

const RULES = [
  { re: /\b(prescribe|prescription|rx)\b/i, reason: 'No prescriptions allowed' },
  { re: /\b(diagnose|diagnosis|prognosis)\b/i, reason: 'No assessment language' },
  { re: /\b(treat|treatment|cure|cures|curing|healing|heals|healed)\b/i, reason: 'No support plan/claims' },
  { re: /\b(antibiotic|statin|metformin|insulin|ssri|steroid|ace inhibitor)\b/i, reason: 'No medicine names' },
  { re: /\b(dose|doses|dosage|tablet|tablets|capsule|capsules|pill|pills|injection|injections)\b/i, reason: 'No dosing language' },
  { re: /\b\d+(?:\.\d+)?\s?(mg|mcg|ml)\b/i, reason: 'No dosing language' },
  { re: /\b(guarantees?|will|certainly|100%)\b/i, reason: 'Avoid absolute claims' }
];

const PROSE_EXT = new Set(['.md', '.txt']);
const CODE_EXT = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs']);

function walk(dir, out = []) {
  if (SKIP_DIRS.has(path.basename(dir))) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
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

function extractProseBlocks(txt) {
  const blocks = [];
  const START = '<!-- nonclinical-ignore-start -->';
  const END = '<!-- nonclinical-ignore-end -->';
  let i = 0;
  while (i < txt.length) {
    const s = txt.indexOf(START, i);
    if (s === -1) { blocks.push({ text: txt.slice(i), ignore: false }); break; }
    if (s > i) blocks.push({ text: txt.slice(i, s), ignore: false });
    const e = txt.indexOf(END, s + START.length);
    if (e === -1) { blocks.push({ text: txt.slice(s + START.length), ignore: true }); break; }
    blocks.push({ text: txt.slice(s + START.length, e), ignore: true });
    i = e + END.length;
  }
  return blocks;
}

function scanProse(file, txt) {
  const hits = [];
  const lines = txt.split(/\r?\n/);
  let lineNo = 0;

  const blocks = extractProseBlocks(txt);
  if (blocks.length > 1 || blocks[0]?.ignore) {
    for (const b of blocks) {
      if (b.ignore) { lineNo += b.text.split(/\r?\n/).length; continue; }
      const partLines = b.text.split(/\r?\n/);
      for (const line of partLines) {
        lineNo++;
        if (/\bnonclinical-ignore-line\b/.test(line)) continue;
        for (const rule of RULES) {
          const re = new RegExp(rule.re, rule.re.flags.includes('g') ? rule.re.flags : rule.re.flags + 'g');
          if (re.test(line)) hits.push({ file, lineNo, reason: rule.reason, line: line.trim() });
        }
      }
    }
    return hits;
  }

  for (const line of lines) {
    lineNo++;
    if (/\bnonclinical-ignore-line\b/.test(line)) continue;
    for (const rule of RULES) {
      const re = new RegExp(rule.re, rule.re.flags.includes('g') ? rule.re.flags : rule.re.flags + 'g');
      if (re.test(line)) hits.push({ file, lineNo, reason: rule.reason, line: line.trim() });
    }
  }
  return hits;
}

function scanCodeStrings(file, txt) {
  const hits = [];
  let i = 0, n = txt.length;
  let mode = null; // 'single' | 'double' | 'backtick' | null
  let buf = '';
  let bufStartLine = 1;
  let lineNo = 1;
  let braceDepth = 0;

  function checkBuffer() {
    if (!buf) return;
    const bufLines = buf.split(/\r?\n/);
    for (const [idx, line] of bufLines.entries()) {
      const lno = bufStartLine + idx;
      if (/\bnonclinical-ignore-line\b/.test(line)) continue;
      for (const rule of RULES) {
        const re = new RegExp(rule.re, rule.re.flags.includes('g') ? rule.re.flags : rule.re.flags + 'g');
        if (re.test(line)) hits.push({ file, lineNo: lno, reason: rule.reason, line: line.trim() });
      }
    }
  }

  while (i < n) {
    const ch = txt[i];
    const next = txt[i+1];

    if (!mode) {
      if (ch === "'" || ch === '"' || ch === '`') {
        mode = ch === "'" ? 'single' : ch === '"' ? 'double' : 'backtick';
        buf = ''; bufStartLine = lineNo; i++; continue;
      }
      if (ch === '\n') lineNo++;
      i++; continue;
    }

    if (mode === 'single') {
      if (ch === '\\') { if (next === '\n') lineNo++; i += 2; continue; }
      if (ch === "'") { checkBuffer(); mode = null; i++; continue; }
      if (ch === '\n') lineNo++;
      buf += ch; i++; continue;
    }

    if (mode === 'double') {
      if (ch === '\\') { if (next === '\n') lineNo++; i += 2; continue; }
      if (ch === '"') { checkBuffer(); mode = null; i++; continue; }
      if (ch === '\n') lineNo++;
      buf += ch; i++; continue;
    }

    if (mode === 'backtick') {
      if (ch === '\\') { if (next === '\n') lineNo++; i += 2; continue; }
      if (ch === '$' && next === '{') {
        checkBuffer(); buf = ''; bufStartLine = lineNo;
        i += 2; braceDepth = 1;
        while (i < n && braceDepth > 0) {
          const c = txt[i];
          if (c === '\n') lineNo++;
          if (c === '{') braceDepth++;
          else if (c === '}') braceDepth--;
          i++;
        }
        continue;
      }
      if (ch === '`') { checkBuffer(); mode = null; i++; continue; }
      if (ch === '\n') lineNo++;
      buf += ch; i++; continue;
    }
  }
  if (mode) checkBuffer();
  return hits;
}

function scanFile(file) {
  const ext = path.extname(file).toLowerCase();
  const txt = fs.readFileSync(file, 'utf8');

  if (PROSE_EXT.has(ext)) return scanProse(file, txt);
  if (CODE_EXT.has(ext)) return scanCodeStrings(file, txt);
  return [];
}

const files = walk(ROOT);
let total = 0;
for (const f of files) {
  const hits = scanFile(f);
  if (hits.length) {
    for (const h of hits) {
      total++;
      console.log(`\n❌ ${h.reason}\n   File: ${path.relative(ROOT, h.file)}:${h.lineNo}\n   Line: ${h.line}`);
    }
  }
}

if (total === 0) {
  console.log('✅ Nonclinical lint passed: no disallowed clinical terms found.\n');
  process.exit(0);
} else {
  console.log(`\n⚠️  Nonclinical lint found ${total} issue(s). Please reword to neutral wellness language.`);
  process.exit(1);
}
