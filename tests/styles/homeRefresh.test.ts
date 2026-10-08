import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// The public landing page is flat: no photo/mesh/glass backgrounds, no blur,
// no sub-12px text, and the solid brand-700 accent (see the approved preview).
const FILES = [
  'pages/index.vue',
  'components/home/HomeStats.vue',
  'components/home/HomeHowItWorks.vue',
  'components/home/HomeFaq.vue',
  'components/home/HomeTrust.vue',
]

const DECORATIVE = /\b(mesh-hero|mesh-soft|glass|dot-grid|backdrop-blur[\w-]*|bg-clip-text|text-transparent)\b/
const TINY_REM = /text-\[0?\.\d+rem\]/
const TINY_PX = /text-\[(9|10|11)px\]/
const PALETTE = /\b(zinc|slate|gray|emerald|green|teal|rose|indigo|violet|blue|purple|orange|yellow|stone|neutral)-\d{2,3}\b/

describe.each(FILES)('%s', (file) => {
  const src = readFileSync(resolve(__dirname, '../..', file), 'utf8')
  const end = src.indexOf('<script')
  const tpl = (end > 0 && src.indexOf('<template') > end ? src : src.slice(0, end > 0 && src.indexOf('<template') < end ? end : undefined))
    .replace(/<!--[\s\S]*?-->/g, '')
  const hits = (re: RegExp) => tpl.split('\n').filter(l => re.test(l)).map(l => l.trim().slice(0, 80))

  it('has no mesh, glass, blur or gradient-text decoration', () => expect(hits(DECORATIVE)).toEqual([]))
  it('has no text under 12px', () => expect([...hits(TINY_REM), ...hits(TINY_PX)]).toEqual([]))
  it('uses brand/ink tokens, not stock palettes', () => expect(hits(PALETTE)).toEqual([]))
})
