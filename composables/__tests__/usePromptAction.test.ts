import { describe, expect, it, vi } from 'vitest'
import { usePromptAction } from '../usePromptAction'

const request = { title: 'Receipt', message: 'Enter it', label: 'Receipt number', confirmText: 'Confirm' }

describe('usePromptAction', () => {
  it('holds the action until a value is submitted, then runs it with that value', async () => {
    const run = vi.fn()
    const { pending, ask, submit } = usePromptAction()

    ask(request, run)
    expect(pending.value?.title).toBe('Receipt')
    expect(run).not.toHaveBeenCalled()

    await submit('RCPT-1')

    expect(run).toHaveBeenCalledWith('RCPT-1')
    expect(pending.value).toBeNull()
  })

  it('drops the action on cancel and tells the page, so it can undo what led here', () => {
    const run = vi.fn()
    const onCancel = vi.fn()
    const { pending, ask, cancel } = usePromptAction()

    ask({ ...request, onCancel }, run)
    cancel()

    expect(run).not.toHaveBeenCalled()
    expect(onCancel).toHaveBeenCalledOnce()
    expect(pending.value).toBeNull()
  })

  it('ignores a submit with nothing pending', async () => {
    const { submit } = usePromptAction()
    await expect(submit('x')).resolves.toBeUndefined()
  })
})
