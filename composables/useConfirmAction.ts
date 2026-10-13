import { ref } from 'vue'

export interface ConfirmRequest {
  title: string
  message: string
  confirmText: string
}

interface PendingConfirm extends ConfirmRequest {
  run: () => unknown
}

// Ask "are you sure?" on the page instead of with the browser's confirm(): ask() holds the action,
// accept() runs it, cancel() drops it. Render with <ConfirmAction :pending="pending" ...>.
export const useConfirmAction = () => {
  const pending = ref<PendingConfirm | null>(null)

  const ask = (request: ConfirmRequest, run: () => unknown): void => {
    pending.value = { ...request, run }
  }

  const accept = async (): Promise<void> => {
    const current = pending.value
    pending.value = null
    if (current) await current.run()
  }

  const cancel = (): void => {
    pending.value = null
  }

  return { pending, ask, accept, cancel }
}
