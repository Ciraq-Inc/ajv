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
              <Icon 
                :name="iconName" 
                :class="['h-6 w-6', iconColorClass]"
              />
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
                  'bg-blue-600 text-white hover:bg-blue-700'
                ]"
                :disabled="isRetrying"
              >
                <span v-if="isRetrying" class="flex items-center justify-center">
                  <Icon name="Loader2" class="h-4 w-4 animate-spin mr-2" />
                  Retrying...
                </span>
                <span v-else class="flex items-center justify-center">
                  <Icon name="RotateCw" class="h-4 w-4 mr-2" />
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
                :disabled="loading"
              >
                <span v-if="loading" class="flex items-center justify-center">
                  <Icon name="Loader2" class="h-4 w-4 animate-spin mr-2" />
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

<script setup>
import { computed } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'warning', // 'warning', 'danger', 'info', 'success', 'error'
    validator: (value) => ['warning', 'danger', 'info', 'success', 'error', null].includes(value)
  },
  confirmText: {
    type: String,
    default: 'Confirm'
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  },
  loadingText: {
    type: String,
    default: 'Processing...'
  },
  showCancel: {
    type: Boolean,
    default: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  closeOnBackdrop: {
    type: Boolean,
    default: true
  },
  error: {
    type: String,
    default: null
  },
  canRetry: {
    type: Boolean,
    default: false
  },
  isRetrying: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['confirm', 'cancel', 'close', 'retry'])

const iconName = computed(() => {
  const icons = {
    warning: 'AlertTriangle',
    danger: 'AlertCircle',
    error: 'AlertCircle',
    info: 'Info',
    success: 'CheckCircle'
  }
  return icons[props.type] || 'AlertTriangle'
})

const iconBgClass = computed(() => {
  const classes = {
    warning: 'bg-yellow-100',
    danger: 'bg-red-100',
    error: 'bg-red-100',
    info: 'bg-blue-100',
    success: 'bg-green-100'
  }
  return classes[props.type] || 'bg-yellow-100'
})

const iconColorClass = computed(() => {
  const classes = {
    warning: 'text-yellow-600',
    danger: 'text-red-600',
    error: 'text-red-600',
    info: 'text-blue-600',
    success: 'text-green-600'
  }
  return classes[props.type] || 'text-yellow-600'
})

const confirmButtonClass = computed(() => {
  const classes = {
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    error: 'bg-red-600 text-white hover:bg-red-700',
    info: 'bg-blue-600 text-white hover:bg-blue-700',
    success: 'bg-green-600 text-white hover:bg-green-700'
  }
  return classes[props.type] || 'bg-yellow-600 text-white hover:bg-yellow-700'
})

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
  emit('close')
}

const handleRetry = () => {
  emit('retry')
}

const handleBackdropClick = () => {
  if (props.closeOnBackdrop && !props.loading && !props.isRetrying) {
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
