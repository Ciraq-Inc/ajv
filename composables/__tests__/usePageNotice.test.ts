import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { usePageNotice } from '../usePageNotice'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('usePageNotice', () => {
  it('shows a message, defaulting to an error', () => {
    const { notice, notify } = usePageNotice()

    notify('Could not save')

    expect(notice.value).toEqual({ text: 'Could not save', kind: 'error' })
  })

  it('clears the message after the time is up', () => {
    const { notice, notify } = usePageNotice(1000)

    notify('Saved', 'success')
    vi.advanceTimersByTime(999)
    expect(notice.value?.text).toBe('Saved')
    vi.advanceTimersByTime(2)

    expect(notice.value).toBeNull()
  })

  it('lets a newer message live its full time instead of being cut short by the older timer', () => {
    const { notice, notify } = usePageNotice(1000)

    notify('first')
    vi.advanceTimersByTime(800)
    notify('second')
    vi.advanceTimersByTime(800)

    expect(notice.value?.text).toBe('second')
  })

  it('can be dismissed', () => {
    const { notice, notify, dismiss } = usePageNotice()

    notify('x')
    dismiss()

    expect(notice.value).toBeNull()
  })

  it('stops its timer when the page goes away', () => {
    const scope = effectScope()
    const { notice, notify } = scope.run(() => usePageNotice(1000))!

    notify('x')
    scope.stop()
    vi.advanceTimersByTime(2000)

    expect(notice.value?.text).toBe('x')
  })
})
