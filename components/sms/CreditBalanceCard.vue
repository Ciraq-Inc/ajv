<template>
  <div class="credit-balance-card">
    <div class="card-header">
      <h3 class="card-title">{{ title }}</h3>
      <button v-if="showRefresh" @click="$emit('refresh')" class="refresh-btn" :disabled="isLoading">
        <Icon name="RefreshCw" size="18" :class="{ 'animate-spin': isLoading }" />
      </button>
    </div>

    <div class="card-content">
      <div class="balance-display">
        <span class="balance-label">{{ label }}</span>
        <span class="balance-value">{{ formattedValue }}</span>
      </div>

      <div class="balance-info">
        <p v-if="subtitle" class="info-text">{{ subtitle }}</p>
        <div v-if="trend" class="trend" :class="`trend-${trend.direction}`">
          <Icon :name="trend.direction === 'up' ? 'TrendingUp' : 'TrendingDown'" size="16" />
          <span>{{ trend.text }}</span>
        </div>
      </div>

      <div v-if="lowBalance" class="low-balance-warning">
        <Icon name="AlertTriangle" size="16" />
        <span>Low balance - Consider purchasing more</span>
      </div>

      <slot></slot>
    </div>

    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: 'Credit Balance',
  },
  label: {
    type: String,
    default: 'Available',
  },
  value: {
    type: [Number, String],
    default: 0,
  },
  subtitle: {
    type: String,
    default: null,
  },
  isCurrency: {
    type: Boolean,
    default: false,
  },
  lowBalanceThreshold: {
    type: Number,
    default: 100,
  },
  trend: {
    type: Object,
    default: null,
  },
  showRefresh: {
    type: Boolean,
    default: false,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['refresh'])

const lowBalance = computed(() => {
  return props.value < props.lowBalanceThreshold
})

const formattedValue = computed(() => {
  if (props.isCurrency) {
    return `₵${parseFloat(props.value || 0).toFixed(2)}`
  }
  return props.value || 0
})
</script>

<style scoped>
.credit-balance-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.refresh-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  transition: color 0.2s ease;
}

.refresh-btn:hover:not(:disabled) {
  color: #667eea;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.card-content {
  padding: 1.5rem;
}

.balance-display {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.balance-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.balance-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #667eea;
}

.balance-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-text {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.trend {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.trend-up {
  color: #10b981;
}

.trend-down {
  color: #ef4444;
}

.low-balance-warning {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.75rem;
  background: #fef3c7;
  border-left: 4px solid #fcd34d;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #92400e;
}

.card-footer {
  padding: 1rem 1.5rem;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 0.75rem;
}
</style>
