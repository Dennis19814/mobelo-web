#!/usr/bin/env node
/**
 * Sync `src/assets/**` -> `public/assets/**`
 *
 * Next.js only serves static files from `public/`.
 * This script copies our curated icon/image assets so they are available at `/assets/...`.
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const srcDir = path.join(projectRoot, 'src', 'assets');
const destDir = path.join(projectRoot, 'public', 'assets');

function rmDirSafe(dirPath) {
  try {
    fs.rmSync(dirPath, { recursive: true, force: true });
  } catch (_) {
    // ignore
  }
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyDirRecursive(fromDir, toDir) {
  ensureDir(toDir);
  const entries = fs.readdirSync(fromDir, { withFileTypes: true });
  for (const entry of entries) {
    const from = path.join(fromDir, entry.name);
    const to = path.join(toDir, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(from, to);
    } else if (entry.isFile()) {
      fs.copyFileSync(from, to);
    }
  }
}

function main() {
  if (!fs.existsSync(srcDir)) {
    console.warn(`[sync-public-assets] Source folder not found: ${srcDir}`);
    process.exit(0);
  }

  // Clean destination to avoid stale renamed/deleted assets.
  rmDirSafe(destDir);
  ensureDir(destDir);
  copyDirRecursive(srcDir, destDir);

  console.log(`[sync-public-assets] Synced assets to ${path.relative(projectRoot, destDir)}`);
}

main();

