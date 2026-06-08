<template>
  <div
    class="relative flex flex-col gap-1.5 p-3 rounded-lg transition-all duration-150"
    :class="isChanged ? 'border-l-4 border-amber-400 bg-amber-50/40 pl-4' : 'border-l-4 border-transparent'"
  >
    <!-- Label row -->
    <div class="flex items-center justify-between gap-2">
      <label :for="'field-' + setting.key" class="text-sm font-semibold text-gray-800 leading-tight">
        {{ setting.label }}
      </label>
      <!-- Revert button (shown when changed) -->
      <button
        v-if="isChanged"
        type="button"
        @click="$emit('revert', setting.key)"
        class="shrink-0 flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
        aria-label="Revert this field to saved value"
      >
        <svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/>
        </svg>
        Revert
      </button>
    </div>

    <!-- Boolean toggle switch -->
    <button
      v-if="setting.type === 'boolean'"
      :id="'field-' + setting.key"
      type="button"
      role="switch"
      :aria-checked="editedSettings[setting.key] === 'true'"
      @click="$emit('update', setting.key, editedSettings[setting.key] === 'true' ? 'false' : 'true')"
      class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 self-start mt-0.5"
      :class="editedSettings[setting.key] === 'true' ? 'bg-blue-600' : 'bg-gray-300'"
    >
      <span class="sr-only">{{ setting.label }}</span>
      <span
        class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
        :class="editedSettings[setting.key] === 'true' ? 'translate-x-6' : 'translate-x-1'"
      ></span>
    </button>

    <!-- Select -->
    <select
      v-else-if="setting.type === 'select'"
      :id="'field-' + setting.key"
      :value="editedSettings[setting.key]"
      @change="$emit('update', setting.key, ($event.target as HTMLSelectElement).value)"
      class="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors"
    >
      <option v-for="opt in setting.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
    </select>

    <!-- Text / number input with optional reveal toggle -->
    <div v-else class="relative">
      <input
        :id="'field-' + setting.key"
        :value="editedSettings[setting.key]"
        @input="$emit('update', setting.key, ($event.target as HTMLInputElement).value)"
        :type="resolvedInputType"
        :step="setting.step || '1'"
        :autocomplete="isSensitive ? 'off' : 'on'"
        class="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors"
        :class="isSensitive ? 'pr-10' : ''"
      />
      <!-- Reveal toggle for sensitive fields -->
      <button
        v-if="isSensitive"
        type="button"
        @click="$emit('toggle-reveal', setting.key)"
        class="absolute inset-y-0 right-0 flex items-center px-2.5 text-gray-400 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-r-lg"
        :aria-label="isRevealed ? 'Hide value' : 'Show value'"
      >
        <svg v-if="!isRevealed" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
          <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
        </svg>
        <svg v-else class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd"/>
          <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.064 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/>
        </svg>
      </button>
    </div>

    <!-- Help text -->
    <p class="text-xs text-gray-500 leading-snug mt-0.5">{{ setting.help }}</p>

    <!-- Was: original value indicator -->
    <p v-if="isChanged && originalVal !== undefined && originalVal !== ''" class="text-xs text-amber-700 font-medium flex items-center gap-1 mt-0.5">
      <svg class="w-3 h-3 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fill-rule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/>
      </svg>
      <span>was: <span class="font-mono">{{ originalVal }}</span></span>
    </p>
    <p v-else-if="isChanged && (originalVal === undefined || originalVal === '')" class="text-xs text-amber-700 font-medium mt-0.5">
      Previously empty
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  setting: {
    key: string
    label: string
    help: string
    type: 'number' | 'string' | 'boolean' | 'select'
    inputType?: string
    step?: string
    options?: { value: string; label: string }[]
  }
  editedSettings: Record<string, string>
  originalSettings: Record<string, string>
  revealMap: Record<string, boolean>
}>()

defineEmits<{
  revert: [key: string]
  'toggle-reveal': [key: string]
  update: [key: string, value: string]
}>()

const isChanged = computed(() =>
  props.editedSettings[props.setting.key] !== props.originalSettings[props.setting.key]
)
const originalVal = computed(() => props.originalSettings[props.setting.key])
const isSensitive = computed(() => props.setting.inputType === 'password')
const isRevealed = computed(() => !!props.revealMap[props.setting.key])
const resolvedInputType = computed(() => {
  if (props.setting.inputType === 'password') {
    return isRevealed.value ? 'text' : 'password'
  }
  return props.setting.inputType ?? 'text'
})
</script>
