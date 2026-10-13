import { onScopeDispose, ref } from 'vue'

export interface PageNotice {
  text: string
  kind: 'success' | 'error'
}

// The outcome of something the admin just did (saved, refused, copied), shown on the page and cleared
// after a while. Use it instead of alert(), which blocks the page and cannot be tested or styled.
export const usePageNotice = (ttlMs = 8000) => {
  const notice = ref<PageNotice | null>(null)
  let timer: ReturnType<typeof setTimeout> | undefined

  const dismiss = (): void => {
    clearTimeout(timer)
    notice.value = null
  }

  const notify = (text: string, kind: PageNotice['kind'] = 'error'): void => {
    clearTimeout(timer)
    notice.value = { text, kind }
    timer = setTimeout(dismiss, ttlMs)
  }

  onScopeDispose(() => clearTimeout(timer))

  return { notice, notify, dismiss }
}
