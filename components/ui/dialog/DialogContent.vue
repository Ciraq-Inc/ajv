<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
} from 'radix-vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { cn } from '~/lib/utils'

const props = defineProps<{
  class?: unknown
  closeDisabled?: boolean
}>()
</script>

<template>
  <DialogPortal>
    <DialogOverlay class="fixed inset-0 z-50 bg-slate-950/45 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <DialogContent
      :class="cn('dialog-content fixed left-1/2 top-1/2 z-50 grid w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:p-6', props.class)"
    >
      <slot />
      <DialogClose :disabled="props.closeDisabled" class="absolute right-4 top-4 rounded-md p-1 text-slate-400 opacity-80 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-40">
        <XMarkIcon class="h-4 w-4" aria-hidden="true" />
        <span class="sr-only">Close</span>
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</template>

<style>
.dialog-content[data-state='open'] {
  animation: dialog-content-in 200ms cubic-bezier(0.16, 1, 0.3, 1) both !important;
}

.dialog-content[data-state='closed'] {
  animation: dialog-content-out 160ms cubic-bezier(0.4, 0, 1, 1) both !important;
}

@keyframes dialog-content-in {
  from {
    opacity: 0;
    transform: translate(-50%, -48%) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes dialog-content-out {
  from {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  to {
    opacity: 0;
    transform: translate(-50%, -48%) scale(0.98);
  }
}

@media (prefers-reduced-motion: reduce) {
  .dialog-content[data-state='open'],
  .dialog-content[data-state='closed'] {
    animation-duration: 1ms !important;
  }
}
</style>
