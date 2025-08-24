// scripts/backup.js

import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Handle __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const now = new Date();
const timestamp = now.toISOString().replace(/[:.]/g, '-');
const outputDir = path.join(__dirname, '../backups');
const outputPath = path.join(outputDir, `mishby-backup-${timestamp}.zip`);

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

const output = fs.createWriteStream(outputPath);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  console.log(`✅ Backup created: ${outputPath} (${archive.pointer()} total bytes)`);
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);

// Add folders and key files
const includePaths = [
  '../src',
  '../public',
  '../docs',
  '../package.json',
  '../vite.config.js',
  '../firebase.json',
  '../netlify.toml'
];

includePaths.forEach((p) => {
  const fullPath = path.join(__dirname, p);
  if (fs.existsSync(fullPath)) {
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      archive.directory(fullPath, path.basename(p));
    } else {
      archive.file(fullPath, { name: path.basename(p) });
    }
  }
});

archive.finalize();
