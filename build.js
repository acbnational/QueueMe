#!/usr/bin/env node
/**
 * Build script that injects the last git commit timestamp into index.html
 * Run with: node build.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'index.html');

// Get the last commit date/time in ISO format
const timestamp = execSync('git log -1 --format=%ci', { encoding: 'utf-8' }).trim();

// Read index.html
let html = fs.readFileSync(indexPath, 'utf-8');

// Replace placeholder OR any existing timestamp (pattern matches both)
// Matches: {{BUILD_TIMESTAMP}} or a git timestamp like "2026-01-20 21:28:37 -0800"
html = html.replace(
  /Code last updated: (\{\{BUILD_TIMESTAMP\}\}|\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} [+-]\d{4})/g,
  `Code last updated: ${timestamp}`
);

// Write back
fs.writeFileSync(indexPath, html, 'utf-8');

console.log(`Build complete. Injected timestamp: ${timestamp}`);
