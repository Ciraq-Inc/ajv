<template>
  <div v-if="isOpen" class="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 p-4" @click.self="$emit('close')">
    <div class="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
      <div class="flex h-12 w-12 items-center justify-center rounded-2xl" :class="variant === 'danger' ? 'bg-red-100 text-red-600' : 'bg-sky-100 text-sky-700'">
        <i :class="variant === 'danger' ? 'ri-logout-box-line' : 'ri-question-line'" class="text-2xl"></i>
      </div>
      <h3 class="mt-4 text-xl font-bold text-slate-900">{{ title }}</h3>
      <p class="mt-2 text-sm leading-6 text-slate-600">{{ message }}</p>

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

<script setup>
defineProps({
  isOpen: { type: Boolean, default: false },
  title: { type: String, default: 'Are you sure?' },
  message: { type: String, default: '' },
  confirmText: { type: String, default: 'Confirm' },
  cancelText: { type: String, default: 'Cancel' },
  variant: { type: String, default: 'danger' },
})

defineEmits(['close', 'confirm'])
</script>
