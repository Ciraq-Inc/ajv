import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { installPageZoomGuard } from '../utils/pageZoomGuard'

const ROOT = join(__dirname, '..')

// iOS Safari ignores user-scalable=no for pinch zoom; the only way to stop it is to cancel the
// proprietary gesture events it fires.
describe('installPageZoomGuard', () => {
  const fire = (target: Document, type: string) => {
    const event = new Event(type, { bubbles: true, cancelable: true })
    target.dispatchEvent(event)
    return event.defaultPrevented
  }

  it.each(['gesturestart', 'gesturechange', 'gestureend'])('cancels %s so a pinch cannot zoom the page', (type) => {
    const doc = document.implementation.createHTMLDocument('t')
    installPageZoomGuard(doc)

    expect(fire(doc, type)).toBe(true)
  })

  it('leaves ordinary taps alone', () => {
    const doc = document.implementation.createHTMLDocument('t')
    installPageZoomGuard(doc)

    expect(fire(doc, 'click')).toBe(false)
    expect(fire(doc, 'touchstart')).toBe(false)
  })

  it('does nothing until installed', () => {
    const doc = document.implementation.createHTMLDocument('t')

    expect(fire(doc, 'gesturestart')).toBe(false)
  })
})

describe('page zoom settings', () => {
  it('locks the viewport scale so focusing a field cannot zoom', () => {
    const config = readFileSync(join(ROOT, 'nuxt.config.ts'), 'utf8')
    const viewport = config.match(/viewport:\s*["']([^"']+)["']/)?.[1] ?? ''

    expect(viewport).toContain('width=device-width')
    expect(viewport).toContain('initial-scale=1')
    expect(viewport).toContain('maximum-scale=1')
    expect(viewport).toContain('user-scalable=no')
  })

  it('turns off double-tap zoom on the whole page', () => {
    const css = readFileSync(join(ROOT, 'assets/css/tailwind.css'), 'utf8')

    expect(css).toMatch(/html,\s*body\s*\{[^}]*touch-action:\s*manipulation/)
  })
})
