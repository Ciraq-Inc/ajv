#!/usr/bin/env node
/**
 * scripts/check-service-layer.mjs
 *
 * Scans stores/ and components/ for direct HTTP calls that should live in
 * services/. This is a TODO report, not a gate — it prints findings and
 * exits 0. The plan is to ratchet this down to zero domain by domain (see
 * docs/architecture/0001-service-layer.md), then flip it to exit 1.
 *
 * Run: node scripts/check-service-layer.mjs
 *
 * Direct dependencies: none. Uses Node 18+ fs and path.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const SCAN_DIRS = ['stores', 'components', 'composables', 'pages'];
// Composables are an allowed home for `useFetch`/`useAsyncData` since they're
// the Nuxt-blessed reactive wrappers; we only flag raw `fetch(` / `$fetch(`
// in composables, plus all three in stores/components/pages.
const PATTERNS = [
  { name: 'fetch(', re: /(^|[^.\w])fetch\s*\(/, scope: ['stores', 'components', 'composables', 'pages'] },
  { name: '$fetch(', re: /\$fetch\s*\(/, scope: ['stores', 'components', 'composables', 'pages'] },
  { name: 'useFetch(', re: /\buseFetch\s*\(/, scope: ['stores', 'components', 'pages'] },
];
const SKIP_FILES = new Set([
  // useApi is the *one* wrapper that's allowed to call fetch directly.
  join('composables', 'useApi.js'),
]);
const SKIP_DIRS = new Set(['node_modules', '.nuxt', '.output', 'dist']);
const EXT = /\.(js|ts|vue|mjs)$/;

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) out.push(...walk(full));
    else if (EXT.test(entry)) out.push(full);
  }
  return out;
}

function scanFile(absPath) {
  const rel = relative(ROOT, absPath);
  const relUnix = rel.split(sep).join('/');
  if (SKIP_FILES.has(rel)) return [];
  const topDir = rel.split(sep)[0];
  const lines = readFileSync(absPath, 'utf8').split(/\r?\n/);
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Strip trivial // comments to cut false positives.
    const code = line.replace(/\/\/.*$/, '');
    for (const p of PATTERNS) {
      if (!p.scope.includes(topDir)) continue;
      if (p.re.test(code)) {
        hits.push({ path: relUnix, line: i + 1, pattern: p.name, text: line.trim() });
      }
    }
  }
  return hits;
}

const allHits = [];
for (const d of SCAN_DIRS) {
  const abs = join(ROOT, d);
  try { statSync(abs); } catch { continue; }
  for (const f of walk(abs)) allHits.push(...scanFile(f));
}

// Group by file for readable output.
const byFile = new Map();
for (const h of allHits) {
  if (!byFile.has(h.path)) byFile.set(h.path, []);
  byFile.get(h.path).push(h);
}

console.log('Service-layer check — direct HTTP calls outside services/');
console.log('-----------------------------------------------------------');
if (allHits.length === 0) {
  console.log('Clean. No direct fetch/$fetch/useFetch found in scanned dirs.');
  process.exit(0);
}
for (const [path, hits] of [...byFile.entries()].sort()) {
  console.log(`\n${path}  (${hits.length})`);
  for (const h of hits) console.log(`  L${h.line}  ${h.pattern}  ${h.text.slice(0, 100)}`);
}
console.log(`\nTotal: ${allHits.length} hit(s) across ${byFile.size} file(s).`);
console.log('Reporting only — exiting 0. See docs/architecture/0001-service-layer.md.');
process.exit(0);
