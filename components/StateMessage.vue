<template>
  <div class="state-message" :class="`state-message--${state}`" role="status">
    <div class="state-message-inner">
      <div class="state-message-icon-wrap">
        <component :is="resolvedIcon" v-if="resolvedIcon" class="state-message-icon" aria-hidden="true" />
        <span v-else-if="state === 'loading'" class="state-message-spinner" aria-hidden="true" />
      </div>
      <div class="state-message-body">
        <p v-if="heading" class="state-message-heading">{{ heading }}</p>
        <p v-if="message" class="state-message-copy">{{ message }}</p>
      </div>
      <button
        v-if="actionLabel"
        type="button"
        class="state-message-action"
        @click="$emit('action')"
      >
        {{ actionLabel }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  ExclamationCircleIcon,
  InboxIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/vue/24/outline'

const props = defineProps({
  state: {
    type: String,
    default: 'empty',
    validator: (v) => ['error', 'empty', 'loading', 'success'].includes(v)
  },
  icon: { type: [Object, Function], default: null },
  heading: { type: String, default: '' },
  message: { type: String, default: '' },
  actionLabel: { type: String, default: '' }
})

defineEmits(['action'])

const defaultIcons = {
  error: ExclamationCircleIcon,
  empty: InboxIcon,
  loading: ArrowPathIcon,
  success: CheckCircleIcon
}

const resolvedIcon = computed(() => props.icon || defaultIcons[props.state] || null)
</script>

<style scoped>
.state-message {
  padding: 2rem 1.5rem;
  border-radius: 12px;
  background: #f8f9fb;
  border: 1px solid #e5e7eb;
}

.state-message--error {
  background: #fef2f2;
  border-color: #fecaca;
}

.state-message--success {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.state-message--loading {
  background: #f8f9fb;
  border-color: #e5e7eb;
}

.state-message-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  text-align: center;
}

.state-message-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.8);
  flex-shrink: 0;
}

.state-message--error .state-message-icon-wrap {
  background: #fee2e2;
}

.state-message--success .state-message-icon-wrap {
  background: #dcfce7;
}

.state-message-icon {
  width: 24px;
  height: 24px;
  color: #9ca3af;
}

.state-message--error .state-message-icon {
  color: #ef4444;
}

.state-message--success .state-message-icon {
  color: #22c55e;
}

.state-message--loading .state-message-icon {
  color: #6b7280;
  animation: spin 1s linear infinite;
}

.state-message-spinner {
  display: block;
  width: 22px;
  height: 22px;
  border: 2.5px solid #e5e7eb;
  border-top-color: #9ca3af;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.state-message-body {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.state-message-heading {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
  color: #1f2937;
}

.state-message--error .state-message-heading {
  color: #991b1b;
}

.state-message-copy {
  margin: 0;
  font-size: 0.825rem;
  color: #6b7280;
  max-width: 360px;
  line-height: 1.5;
}

.state-message--error .state-message-copy {
  color: #b91c1c;
}

.state-message-action {
  margin-top: 0.25rem;
  padding: 0.45rem 1.1rem;
  border-radius: 8px;
  border: 1px solid currentColor;
  background: transparent;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s ease;
  color: #4F217A;
  border-color: #dfd3ea;
}

.state-message--error .state-message-action {
  color: #dc2626;
  border-color: #fca5a5;
}

.state-message-action:hover {
  background: rgba(79, 33, 122, 0.06);
  transform: translateY(-1px);
}

.state-message--error .state-message-action:hover {
  background: #fee2e2;
}
</style>
