import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const appendedScripts: HTMLScriptElement[] = []

beforeEach(() => {
  appendedScripts.length = 0
  vi.spyOn(document.head, 'appendChild').mockImplementation((node) => {
    appendedScripts.push(node as HTMLScriptElement)
    return node
  })
})

describe('loadPaystackScript', () => {
  afterEach(() => {
    document.head.replaceChildren()
    delete (window as Window & { PaystackPop?: unknown }).PaystackPop
    vi.resetModules()
    vi.restoreAllMocks()
  })

  it('shares one script load between concurrent callers', async () => {
    vi.resetModules()
    const { loadPaystackScript } = await import('~/utils/paystack')
    const first = loadPaystackScript()
    const second = loadPaystackScript()

    expect(appendedScripts).toHaveLength(1)

    const pop = { setup: vi.fn() }
    ;(window as Window & { PaystackPop?: unknown }).PaystackPop = pop
    appendedScripts[0].onload?.(new Event('load'))

    await expect(Promise.all([first, second])).resolves.toEqual([pop, pop])
  })

  it('removes a failed script and allows a later retry', async () => {
    vi.resetModules()
    const { loadPaystackScript } = await import('~/utils/paystack')
    const first = loadPaystackScript()
    const failedScript = appendedScripts[0]
    const remove = vi.spyOn(failedScript, 'remove')

    const rejection = expect(first).rejects.toThrow('Failed to load Paystack script')
    failedScript.onerror?.(new Event('error'))
    await rejection
    expect(remove).toHaveBeenCalledOnce()

    const retry = loadPaystackScript()
    expect(appendedScripts).toHaveLength(2)
    const pop = { setup: vi.fn() }
    ;(window as Window & { PaystackPop?: unknown }).PaystackPop = pop
    appendedScripts[1].onload?.(new Event('load'))
    await expect(retry).resolves.toBe(pop)
  })
})
