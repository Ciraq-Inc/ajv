<template>
  <div v-if="isOpen" class="fixed inset-0 z-[120] flex items-center justify-center bg-ink-900/50 p-4" @click.self="$emit('close')">
    <div
      ref="dialogRef"
      role="alertdialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      :aria-describedby="message ? descId : ''"
      tabindex="-1"
      class="w-full max-w-sm rounded-3xl bg-white p-6 shadow-lift">
      <div class="flex h-12 w-12 items-center justify-center rounded-2xl" :class="variant === 'danger' ? 'bg-red-100 text-red-700' : 'bg-brand-50 text-brand-700'">
        <i :class="variant === 'danger' ? 'ri-logout-box-line' : 'ri-question-line'" class="text-2xl" aria-hidden="true"></i>
      </div>
      <h3 :id="titleId" class="mt-4 font-display text-xl font-bold text-ink-900">{{ title }}</h3>
      <p :id="descId" class="mt-2 text-base leading-6 text-ink-600">{{ message }}</p>

      <div class="mt-6 flex gap-3">
        <button
          type="button"
          @click="$emit('close')"
          class="flex-1 min-h-[44px] rounded-full border border-ink-200 px-4 py-3 text-base font-semibold text-ink-600 transition hover:bg-ink-50"
        >
          {{ cancelText }}
        </button>
        <button
          type="button"
          @click="$emit('confirm')"
          class="flex-1 min-h-[44px] rounded-full px-4 py-3 text-base font-semibold text-white transition"
          :class="variant === 'danger' ? 'bg-red-700 hover:bg-red-800' : 'bg-brand-700 hover:bg-brand-800'"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useModalA11y } from '~/composables/useModalA11y'

const props = defineProps<{
  isOpen?: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  variant?: string
}>()

const emit = defineEmits<{
  close: []
  confirm: []
}>()

// Stable per-instance IDs so aria-labelledby / aria-describedby never collide.
const _uid = Math.random().toString(36).slice(2, 9)
const titleId = `confirm-dlg-title-${_uid}`
const descId = `confirm-dlg-desc-${_uid}`

const dialogRef = ref<HTMLElement | null>(null)
useModalA11y(dialogRef, () => props.isOpen ?? false, () => emit('close'))
</script>
