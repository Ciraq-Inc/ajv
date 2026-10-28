import { ref } from 'vue'

export interface PromptRequest {
  title: string
  message: string
  label: string
  confirmText: string
  // Called when the admin backs out, so the page can undo whatever led to the question.
  onCancel?: () => void
}

interface PendingPrompt extends PromptRequest {
  run: (value: string) => unknown
}

// Ask for one line of text on the page instead of with the browser's prompt(): ask() holds the action,
// submit(value) runs it with what was typed, cancel() drops it. Render with <PromptAction :pending="pending" ...>.
export const usePromptAction = () => {
  const pending = ref<PendingPrompt | null>(null)

  const ask = (request: PromptRequest, run: (value: string) => unknown): void => {
    pending.value = { ...request, run }
  }

  const submit = async (value: string): Promise<void> => {
    const current = pending.value
    pending.value = null
    if (current) await current.run(value)
  }

  const cancel = (): void => {
    const current = pending.value
    pending.value = null
    current?.onCancel?.()
  }

  return { pending, ask, submit, cancel }
}
