// scripts/analyze-bundle.cjs

const { visualizer } = require('rollup-plugin-visualizer');
const { build } = require('vite');
const path = require('path');
const fs = require('fs');

const outputDir = path.resolve(__dirname, '../dist-analysis');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

async function analyze() {
  try {
    await build({
      build: {
        rollupOptions: {
          plugins: [
            visualizer({
              filename: path.resolve(outputDir, 'bundle-report.html'),
              open: true,
              gzipSize: true,
              brotliSize: true,
            }),
          ],
        },
      },
    });
    console.log('✅ Bundle analysis complete. Report at: dist-analysis/bundle-report.html');
  } catch (error) {
    console.error('❌ Bundle analysis failed:', error);
  }
}

analyze();
