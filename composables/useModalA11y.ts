// composables/useModalA11y.ts
// Accessibility helper for modal dialogs.
//
// Implements the WAI-ARIA Authoring Practices "dialog (modal)" pattern:
//   - Traps Tab / Shift+Tab focus inside the dialog while it's open
//   - Closes the dialog on Escape
//   - Restores focus to the element that opened the dialog when it closes
//   - Moves initial focus to the first focusable element inside the dialog
//
// Usage in a modal component:
//
//   const dialogRef = ref(null)
//   const props = defineProps({ isOpen: Boolean })
//   const emit  = defineEmits(['close'])
//   useModalA11y(dialogRef, () => props.isOpen, () => emit('close'))
//
//   <template>
//     <div v-if="isOpen" ref="dialogRef" role="dialog" aria-modal="true"
//          aria-labelledby="dlg-title" ...>
//       <h3 id="dlg-title">...</h3>
//     </div>
//   </template>

import { watch, onBeforeUnmount, nextTick, type Ref } from 'vue'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable]',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function getFocusable(container: HTMLElement | null): HTMLElement[] {
  if (!container) return []
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute('disabled') && el.offsetParent !== null
  )
}

export function useModalA11y(
  containerRef: Ref<HTMLElement | null>,
  isOpenGetter: () => boolean,
  onClose?: () => void
): void {
  let previouslyFocused: HTMLElement | null = null

  function onKeydown(e: KeyboardEvent): void {
    if (!isOpenGetter()) return

    if (e.key === 'Escape') {
      e.stopPropagation()
      onClose?.()
      return
    }

    if (e.key !== 'Tab') return

    const focusables = getFocusable(containerRef.value)
    if (focusables.length === 0) {
      e.preventDefault()
      containerRef.value?.focus()
      return
    }

    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    const active = document.activeElement

    if (e.shiftKey && active === first) {
      e.preventDefault()
      last?.focus()
    } else if (!e.shiftKey && active === last) {
      e.preventDefault()
      first?.focus()
    }
  }

  watch(
    () => isOpenGetter(),
    async (open) => {
      if (typeof document === 'undefined') return
      if (open) {
        previouslyFocused = document.activeElement as HTMLElement | null
        document.body.style.overflow = 'hidden'
        document.addEventListener('keydown', onKeydown, true)
        await nextTick()
        const focusables = getFocusable(containerRef.value)
        const target = focusables[0] ?? containerRef.value
        target?.focus()
      } else {
        document.body.style.overflow = ''
        document.removeEventListener('keydown', onKeydown, true)
        previouslyFocused?.focus()
        previouslyFocused = null
      }
    },
    { immediate: true }
  )

  onBeforeUnmount(() => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('keydown', onKeydown, true)
    }
  })
}
