import { describe, expect, it, vi } from 'vitest'
import { useConfirmAction } from '../useConfirmAction'

const request = { title: 'Delete it?', message: 'Gone for good.', confirmText: 'Yes, delete' }

describe('useConfirmAction', () => {
  it('holds the action until it is accepted', async () => {
    const run = vi.fn()
    const { pending, ask, accept } = useConfirmAction()

    ask(request, run)
    expect(pending.value?.title).toBe('Delete it?')
    expect(run).not.toHaveBeenCalled()

    await accept()
    expect(run).toHaveBeenCalledTimes(1)
    expect(pending.value).toBeNull()
  })

  it('drops the action when cancelled', async () => {
    const run = vi.fn()
    const { pending, ask, cancel, accept } = useConfirmAction()

    ask(request, run)
    cancel()
    await accept()

    expect(pending.value).toBeNull()
    expect(run).not.toHaveBeenCalled()
  })

  it('closes the dialog before the action finishes, so a slow action cannot be accepted twice', async () => {
    let release!: () => void
    const run = vi.fn(() => new Promise<void>((resolve) => { release = resolve }))
    const { pending, ask, accept } = useConfirmAction()

    ask(request, run)
    const first = accept()
    expect(pending.value).toBeNull()
    await accept()
    release()
    await first

    expect(run).toHaveBeenCalledTimes(1)
  })

  it('only runs the most recent question', async () => {
    const first = vi.fn()
    const second = vi.fn()
    const { ask, accept } = useConfirmAction()

    ask(request, first)
    ask(request, second)
    await accept()

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })
})
