#!/usr/bin/env node
/**
 * Generate `assets/css/remixicon-slim.css` from `remixicon/fonts/remixicon.css`.
 *
 * Why: the vendor stylesheet ships @font-face rules with src: url(...) pointing
 * to eot, woff2, woff, ttf and svg fonts. Vite/Nuxt emits every referenced
 * asset, which adds ~4.2 MB of unused legacy formats to .output/public/_nuxt.
 * All ajv target browsers (mobile Chrome/Safari, modern WebView) support
 * woff2, so we rewrite the @font-face block to reference only woff2.
 *
 * Output is checked in so dev builds without postinstall (Docker layer caching,
 * `npm ci --omit=optional`, etc.) still pick up the slim variant.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const SRC = resolve(root, 'node_modules/remixicon/fonts/remixicon.css')
const DEST = resolve(root, 'assets/css/remixicon-slim.css')

let css
try {
  css = readFileSync(SRC, 'utf8')
} catch (err) {
  // Allow build to continue if remixicon isn't installed yet — the next
  // postinstall after `npm install` will regenerate.
  console.warn(`[remixicon-slim] ${SRC} not found, skipping (${err.code}).`)
  process.exit(0)
}

const slim = css.replace(
  /@font-face\s*{[\s\S]*?font-family:\s*["']remixicon["'][\s\S]*?}/,
  `@font-face {
  font-family: "remixicon";
  src: url("./remixicon.woff2") format("woff2");
  font-display: swap;
  font-style: normal;
  font-weight: normal;
}`
)

if (slim === css) {
  console.error('[remixicon-slim] @font-face block not found in source CSS — aborting.')
  process.exit(1)
}

mkdirSync(dirname(DEST), { recursive: true })
writeFileSync(DEST, slim, 'utf8')

// Also copy the woff2 font alongside so the relative ./remixicon.woff2 url resolves.
import('node:fs').then(({ copyFileSync }) => {
  copyFileSync(
    resolve(root, 'node_modules/remixicon/fonts/remixicon.woff2'),
    resolve(root, 'assets/css/remixicon.woff2')
  )
  console.log('[remixicon-slim] wrote assets/css/remixicon-slim.css + remixicon.woff2')
})
