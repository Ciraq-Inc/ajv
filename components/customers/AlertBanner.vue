<template>
  <Transition name="slide-down">
    <div v-if="event" class="alert-banner" :class="`alert-${event.type}`">
      <div class="alert-content">
        <div class="alert-icon">
          <span class="material-symbols-outlined">{{ alertIcon }}</span>
        </div>
        <div class="alert-text">
          <p class="alert-title">{{ event.title }}</p>
          <p v-if="event.description" class="alert-description">{{ event.description }}</p>
        </div>
        <button class="alert-action" @click="handleAction">
          {{ event.actionLabel || 'View' }}
          <span class="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
      <button class="alert-close" @click="dismiss" aria-label="Close alert">
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  event: {
    type: Object,
    default: null
    // event shape: { type, title, description, actionLabel, actionTab, id }
  }
})

const emit = defineEmits(['dismiss', 'action'])

const alertIcon = computed(() => {
  if (!props.event) return 'info'
  const iconMap = {
    warning: 'warning',
    error: 'error',
    success: 'check_circle',
    info: 'info'
  }
  return iconMap[props.event.type] || 'info'
})

const dismiss = () => {
  emit('dismiss', props.event?.id)
}

const handleAction = () => {
  emit('action', props.event)
}
</script>

<style scoped>
.alert-banner {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 0.75rem;
  border: 1px solid;
  margin-bottom: 16px;
  animation: slideDown 0.3s ease-out;
}

.alert-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.alert-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
}

.alert-text {
  flex: 1;
  min-width: 0;
}

.alert-title {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.25rem;
}

.alert-description {
  margin: 2px 0 0 0;
  font-size: 0.75rem;
  line-height: 1rem;
  opacity: 0.8;
}

.alert-action {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.alert-action span {
  font-size: 16px;
}

.alert-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
  flex-shrink: 0;
}

.alert-close:hover {
  opacity: 1;
}

/* Warning style */
.alert-warning {
  background-color: #fff1d8;
  border-color: #ffd700;
}

.alert-warning .alert-icon {
  background-color: #fff3e5;
  color: #9a620d;
}

.alert-warning .alert-title,
.alert-warning .alert-description {
  color: #9a620d;
}

.alert-warning .alert-action {
  background-color: #fff3e5;
  color: #9a620d;
}

.alert-warning .alert-action:hover {
  background-color: #ffe8b2;
}

.alert-warning .alert-close {
  color: #9a620d;
}

/* Error style */
.alert-error {
  background-color: #ffe7e7;
  border-color: #ff6b6b;
}

.alert-error .alert-icon {
  background-color: #ffecec;
  color: #c03a3a;
}

.alert-error .alert-title,
.alert-error .alert-description {
  color: #c03a3a;
}

.alert-error .alert-action {
  background-color: #ffecec;
  color: #c03a3a;
}

.alert-error .alert-action:hover {
  background-color: #ffdede;
}

.alert-error .alert-close {
  color: #c03a3a;
}

/* Success style */
.alert-success {
  background-color: #e7f7ea;
  border-color: #51cf66;
}

.alert-success .alert-icon {
  background-color: #f0fdf4;
  color: #228847;
}

.alert-success .alert-title,
.alert-success .alert-description {
  color: #228847;
}

.alert-success .alert-action {
  background-color: #f0fdf4;
  color: #228847;
}

.alert-success .alert-action:hover {
  background-color: #e1f8e6;
}

.alert-success .alert-close {
  color: #228847;
}

/* Info style */
.alert-info {
  background-color: #edf4ff;
  border-color: #4299e1;
}

.alert-info .alert-icon {
  background-color: #f7fbff;
  color: #285db8;
}

.alert-info .alert-title,
.alert-info .alert-description {
  color: #285db8;
}

.alert-info .alert-action {
  background-color: #f7fbff;
  color: #285db8;
}

.alert-info .alert-action:hover {
  background-color: #e4f1ff;
}

.alert-info .alert-close {
  color: #285db8;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 640px) {
  .alert-banner {
    padding: 12px 12px;
    gap: 8px;
  }

  .alert-action {
    padding: 6px 10px;
    font-size: 0.7rem;
  }

  .alert-title {
    font-size: 0.8125rem;
  }
}
</style>
