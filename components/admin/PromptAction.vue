<template>
  <div v-if="pending" class="fixed inset-0 z-[120] flex items-center justify-center bg-ink-900/50 p-4" @click.self="$emit('cancel')">
    <form
      ref="dialogRef"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      :aria-describedby="descId"
      tabindex="-1"
      data-test="prompt-dialog"
      class="w-full max-w-sm rounded-3xl bg-white p-6 shadow-lift"
      @submit.prevent="$emit('submit', value)"
    >
      <h3 :id="titleId" class="font-display text-xl font-bold text-ink-900">{{ pending.title }}</h3>
      <p :id="descId" class="mt-2 text-base leading-6 text-ink-600">{{ pending.message }}</p>
      <label class="mt-4 block text-sm font-semibold text-ink-700">
        {{ pending.label }}
        <input v-model="value" type="text" autocomplete="off" class="mt-1 w-full rounded-xl border border-ink-200 px-3 py-2 text-base" />
      </label>
      <p v-if="error" role="alert" class="mt-2 text-sm text-red-700">{{ error }}</p>
      <div class="mt-6 flex gap-3">
        <button type="button" class="flex-1 min-h-[44px] rounded-full border border-ink-200 px-4 py-3 text-base font-semibold text-ink-600 transition hover:bg-ink-50" @click="$emit('cancel')">
          Cancel
        </button>
        <button type="submit" class="flex-1 min-h-[44px] rounded-full bg-brand-700 px-4 py-3 text-base font-semibold text-white transition hover:bg-brand-800">
          {{ pending.confirmText }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useModalA11y } from '~/composables/useModalA11y'
import type { PromptRequest } from '~/composables/usePromptAction'

const props = defineProps<{ pending: PromptRequest | null; error?: string }>()
const emit = defineEmits<{ submit: [value: string]; cancel: [] }>()

const _uid = Math.random().toString(36).slice(2, 9)
const titleId = `prompt-dlg-title-${_uid}`
const descId = `prompt-dlg-desc-${_uid}`

const value = ref('')
const dialogRef = ref<HTMLElement | null>(null)
watch(() => props.pending, () => { value.value = '' })
useModalA11y(dialogRef, () => props.pending !== null, () => emit('cancel'))
</script>
