<template>
  <teleport to="body">
    <transition name="modal">
      <div 
        v-if="isOpen" 
        class="fixed inset-0 z-50 overflow-y-auto"
        @click.self="handleBackdropClick"
      >
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>
        
        <!-- Modal -->
        <div class="flex min-h-screen items-center justify-center p-4">
          <div 
            class="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            @click.stop
          >
            <!-- Icon -->
            <div
              v-if="type"
              :class="[
                'mx-auto flex h-12 w-12 items-center justify-center rounded-full mb-4',
                iconBgClass
              ]"
            >
              <ExclamationTriangleIcon v-if="type === 'warning'" :class="['h-6 w-6', iconColorClass]" />
              <ExclamationCircleIcon v-else-if="type === 'danger' || type === 'error'" :class="['h-6 w-6', iconColorClass]" />
              <InformationCircleIcon v-else-if="type === 'info'" :class="['h-6 w-6', iconColorClass]" />
              <CheckCircleIcon v-else-if="type === 'success'" :class="['h-6 w-6', iconColorClass]" />
            </div>

            <!-- Title -->
            <h3 class="text-lg font-semibold text-gray-900 text-center mb-2">
              {{ title }}
            </h3>

            <!-- Message -->
            <p class="text-sm text-gray-600 text-center mb-6">
              {{ message }}
            </p>

            <!-- Error Message -->
            <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p class="text-sm text-red-600 font-medium">Error occurred:</p>
              <p class="text-sm text-red-600 mt-1">{{ error }}</p>
            </div>

            <!-- Actions -->
            <div class="flex gap-3">
              <button
                v-if="showCancel && !canRetry"
                @click="handleCancel"
                type="button"
                class="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                {{ cancelText }}
              </button>
              
              <button
                v-if="canRetry"
                @click="handleRetry"
                type="button"
                :class="[
                  'flex-1 px-4 py-2 rounded-lg transition-colors font-medium',
                  'bg-purple-600 text-white hover:bg-purple-700'
                ]"
                :disabled="isRetrying ?? false"
              >
                <span v-if="isRetrying" class="flex items-center justify-center">
                  <ArrowPathIcon class="h-4 w-4 animate-spin mr-2" />
                  Retrying...
                </span>
                <span v-else class="flex items-center justify-center">
                  <ArrowPathIcon class="h-4 w-4 mr-2" />
                  Retry
                </span>
              </button>

              <button
                v-if="canRetry"
                @click="handleCancel"
                type="button"
                class="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              
              <button
                v-if="!canRetry"
                @click="handleConfirm"
                type="button"
                :class="[
                  'flex-1 px-4 py-2 rounded-lg transition-colors font-medium',
                  confirmButtonClass
                ]"
                :disabled="loading ?? false"
              >
                <span v-if="loading" class="flex items-center justify-center">
                  <ArrowPathIcon class="h-4 w-4 animate-spin mr-2" />
                  {{ loadingText }}
                </span>
                <span v-else>{{ confirmText }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
} from '@heroicons/vue/24/outline'

type DialogType = 'warning' | 'danger' | 'info' | 'success' | 'error'

const props = withDefaults(defineProps<{
  isOpen: boolean
  title: string
  message: string
  type?: DialogType
  confirmText?: string
  cancelText?: string
  loadingText?: string
  showCancel?: boolean
  loading?: boolean
  closeOnBackdrop?: boolean
  error?: string | null
  canRetry?: boolean
  isRetrying?: boolean
}>(), {
  showCancel: true,
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  loadingText: 'Processing...',
})

const emit = defineEmits<{
  confirm: []
  cancel: []
  close: []
  retry: []
}>()

const iconBgClass = computed<string>(() => {
  const classes: Record<DialogType, string> = {
    warning: 'bg-yellow-100',
    danger: 'bg-red-100',
    error: 'bg-red-100',
    info: 'bg-purple-100',
    success: 'bg-green-100',
  }
  return classes[props.type ?? 'warning'] ?? 'bg-yellow-100'
})

const iconColorClass = computed<string>(() => {
  const classes: Record<DialogType, string> = {
    warning: 'text-yellow-600',
    danger: 'text-red-600',
    error: 'text-red-600',
    info: 'cs-text',
    success: 'text-green-600',
  }
  return classes[props.type ?? 'warning'] ?? 'text-yellow-600'
})

const confirmButtonClass = computed<string>(() => {
  const classes: Record<DialogType, string> = {
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    error: 'bg-red-600 text-white hover:bg-red-700',
    info: 'bg-purple-600 text-white hover:bg-purple-700',
    success: 'bg-green-600 text-white hover:bg-green-700',
  }
  return classes[props.type ?? 'warning'] ?? 'bg-yellow-600 text-white hover:bg-yellow-700'
})

const handleConfirm = (): void => emit('confirm')

const handleCancel = (): void => {
  emit('cancel')
  emit('close')
}

const handleRetry = (): void => emit('retry')

const handleBackdropClick = (): void => {
  if ((props.closeOnBackdrop !== false) && !props.loading && !props.isRetrying) {
    emit('close')
  }
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .bg-white,
.modal-leave-active .bg-white {
  transition: transform 0.3s ease;
}

.modal-enter-from .bg-white,
.modal-leave-to .bg-white {
  transform: scale(0.95);
}
</style>
