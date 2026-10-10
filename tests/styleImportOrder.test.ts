import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = join(__dirname, '..')

const vueFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) return vueFiles(full)
    return name.endsWith('.vue') ? [full] : []
  })

// A CSS @import is only honoured before every other rule; later ones are dropped
// silently, and the page renders with none of the stylesheet it was meant to load.
const misplacedImports = (source: string): string[] => {
  const found: string[] = []
  for (const [, css] of source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
    const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '')
    const firstRule = stripped.search(/[^\s;]*\s*\{/)
    for (const m of stripped.matchAll(/@import[^;]*;/g)) {
      if (firstRule !== -1 && (m.index ?? 0) > firstRule) found.push(m[0])
    }
  }
  return found
}

describe('Vue style blocks', () => {
  it('place every @import before the first rule', () => {
    const offenders = ['pages', 'components', 'layouts']
      .flatMap((dir) => vueFiles(join(ROOT, dir)))
      .map((file) => ({ file: relative(ROOT, file), imports: misplacedImports(readFileSync(file, 'utf8')) }))
      .filter((o) => o.imports.length > 0)

    expect(offenders).toEqual([])
  })
})
