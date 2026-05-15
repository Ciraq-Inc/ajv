// composables/useModalA11y.js
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

import { watch, onBeforeUnmount, nextTick } from 'vue'

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

function getFocusable(container) {
  if (!container) return []
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute('disabled') && el.offsetParent !== null
  )
}

export function useModalA11y(containerRef, isOpenGetter, onClose) {
  // Element that had focus right before the modal opened; we restore focus
  // here on close so keyboard users don't get teleported to <body>.
  let previouslyFocused = null

  function onKeydown(e) {
    if (!isOpenGetter()) return

    if (e.key === 'Escape') {
      e.stopPropagation()
      onClose && onClose()
      return
    }

    if (e.key !== 'Tab') return

    const focusables = getFocusable(containerRef.value)
    if (focusables.length === 0) {
      // Nothing focusable -> keep focus on the dialog container itself.
      e.preventDefault()
      containerRef.value && containerRef.value.focus()
      return
    }

    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    const active = document.activeElement

    if (e.shiftKey && active === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && active === last) {
      e.preventDefault()
      first.focus()
    }
  }

  watch(
    () => isOpenGetter(),
    async (open) => {
      if (typeof document === 'undefined') return
      if (open) {
        previouslyFocused = document.activeElement
        document.addEventListener('keydown', onKeydown, true)
        await nextTick()
        const focusables = getFocusable(containerRef.value)
        const target = focusables[0] || containerRef.value
        target && target.focus && target.focus()
      } else {
        document.removeEventListener('keydown', onKeydown, true)
        if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
          previouslyFocused.focus()
        }
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
