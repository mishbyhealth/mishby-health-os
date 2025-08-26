// scripts/ci-check.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REQUIRED_PATHS = [
  '../src',
  '../public',
  '../vite.config.js',
  '../firebase.json',
  '../netlify.toml',
  '../package.json'
];

const errors = [];

REQUIRED_PATHS.forEach((relPath) => {
  const fullPath = path.resolve(__dirname, relPath);
  if (!fs.existsSync(fullPath)) {
    errors.push(`❌ Missing required file or folder: ${relPath}`);
  }
});

// Optional: Warn if not in development mode
if (process.env.NODE_ENV === 'production') {
  console.warn('⚠️ NODE_ENV is set to "production". Are you running CI locally?');
}

if (errors.length > 0) {
  console.error('🚨 CI Check Failed:\n');
  errors.forEach((e) => console.error(e));
  process.exit(1); // Exit with failure code
} else {
  console.log('✅ CI Check Passed. All required files are present.');
}
