<template>
  <div v-if="isOpen" class="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 p-4" @click.self="$emit('close')">
    <div
      ref="dialogRef"
      role="alertdialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      :aria-describedby="message ? descId : undefined"
      tabindex="-1"
      class="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
      <div class="flex h-12 w-12 items-center justify-center rounded-2xl" :class="variant === 'danger' ? 'bg-red-100 text-red-600' : 'bg-sky-100 text-sky-700'">
        <i :class="variant === 'danger' ? 'ri-logout-box-line' : 'ri-question-line'" class="text-2xl" aria-hidden="true"></i>
      </div>
      <h3 :id="titleId" class="mt-4 text-xl font-bold text-slate-900">{{ title }}</h3>
      <p :id="descId" class="mt-2 text-sm leading-6 text-slate-600">{{ message }}</p>

      <div class="mt-6 flex gap-3">
        <button
          type="button"
          @click="$emit('close')"
          class="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          {{ cancelText }}
        </button>
        <button
          type="button"
          @click="$emit('confirm')"
          class="flex-1 rounded-2xl px-4 py-3 text-sm font-semibold text-white transition"
          :class="variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-sky-600 hover:bg-sky-700'"
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
