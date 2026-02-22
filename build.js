#!/usr/bin/env node
/**
 * Build script that injects the last git commit timestamp into index.html
 * Run with: node build.js
 */

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'index.html');

// Get the current date/time formatted like git's %ci output: YYYY-MM-DD HH:MM:SS ±HHMM
function getCurrentTimestamp() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());
  const offsetMinutes = -now.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absOffset = Math.abs(offsetMinutes);
  const offsetHours = pad(Math.floor(absOffset / 60));
  const offsetMins = pad(absOffset % 60);
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} ${sign}${offsetHours}${offsetMins}`;
}
const timestamp = getCurrentTimestamp();

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
