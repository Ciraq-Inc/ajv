<template>
  <div v-if="isOpen" class="modal-overlay" @click="close">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Purchase SMS Credits</h3>
        <button @click="close" class="modal-close">
          <Icon name="X" size="24" />
        </button>
      </div>

      <div class="modal-body">
        <!-- Current Balance Info -->
        <div class="info-box">
          <div class="info-row">
            <span>Current SMS Balance:</span>
            <strong>{{ currentBalance }}</strong>
          </div>
          <div class="info-row">
            <span>Available Money:</span>
            <strong>₵{{ formatCurrency(availableBalance) }}</strong>
          </div>
          <div class="info-row">
            <span>SMS Rate:</span>
            <strong>₵{{ formatCurrency(smsRate) }} per SMS</strong>
          </div>
        </div>

        <!-- Purchase Form -->
        <form @submit.prevent="handlePurchase">
          <div class="form-group">
            <label for="sms-count">Number of SMS Credits</label>
            <input
              id="sms-count"
              v-model.number="form.smsCount"
              type="number"
              class="form-control"
              min="1"
              step="100"
              placeholder="Enter number of SMS"
              @input="calculateCost"
              required
            />
            <div class="form-hint">Minimum 1 SMS, typically in increments of 100</div>
          </div>

          <!-- Cost Breakdown -->
          <div v-if="form.smsCount" class="cost-breakdown">
            <div class="breakdown-row">
              <span>SMS Count:</span>
              <span>{{ form.smsCount }}</span>
            </div>
            <div class="breakdown-row">
              <span>Rate per SMS:</span>
              <span>₵{{ formatCurrency(smsRate) }}</span>
            </div>
            <div class="breakdown-divider"></div>
            <div class="breakdown-row total">
              <span>Total Cost:</span>
              <span>₵{{ formatCurrency(calculateTotalCost) }}</span>
            </div>
          </div>

          <!-- Warnings -->
          <div v-if="form.smsCount && calculateTotalCost > availableBalance" class="error-message">
            <Icon name="AlertCircle" size="16" />
            <span>Insufficient balance. You need ₵{{ formatCurrency(calculateTotalCost - availableBalance) }} more.</span>
          </div>

          <!-- Action Buttons -->
          <div class="form-actions">
            <button type="button" @click="close" class="btn-secondary">Cancel</button>
            <button
              type="submit"
              class="btn-primary"
              :disabled="
                isLoading ||
                !form.smsCount ||
                calculateTotalCost > availableBalance
              "
            >
              {{ isLoading ? 'Processing...' : 'Confirm Purchase' }}
            </button>
          </div>
        </form>

        <!-- Success Message -->
        <div v-if="successMessage" class="success-message">
          <Icon name="CheckCircle" size="16" />
          <span>{{ successMessage }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  currentBalance: {
    type: Number,
    default: 0,
  },
  availableBalance: {
    type: Number,
    default: 0,
  },
  smsRate: {
    type: Number,
    default: 0.05,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close', 'purchase'])

const form = ref({
  smsCount: null,
})

const successMessage = ref(null)

const calculateTotalCost = computed(() => {
  return (form.value.smsCount || 0) * props.smsRate
})

const formatCurrency = (value) => {
  if (!value) return '0.00'
  return parseFloat(value).toFixed(2)
}

const calculateCost = () => {
  // Reactive computation happens automatically
}

const handlePurchase = async () => {
  if (!form.value.smsCount) return

  emit('purchase', {
    smsCount: form.value.smsCount,
    totalCost: calculateTotalCost.value,
  })

  // Reset form after successful purchase
  setTimeout(() => {
    form.value.smsCount = null
    successMessage.value = null
  }, 2000)
}

const close = () => {
  form.value.smsCount = null
  successMessage.value = null
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background 0.2s ease;
}

.modal-close:hover {
  background: #f3f4f6;
}

.modal-body {
  padding: 1.5rem;
}

/* Info Box */
.info-box {
  background: #f0f9ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  color: #0c4a6e;
  font-size: 0.875rem;
}

.info-row strong {
  font-weight: 700;
  color: #667eea;
}

/* Form */
form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.form-control {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.form-control:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-hint {
  font-size: 0.75rem;
  color: #9ca3af;
}

/* Cost Breakdown */
.cost-breakdown {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
}

.breakdown-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  font-size: 0.875rem;
}

.breakdown-row.total {
  font-weight: 700;
  font-size: 1rem;
  color: #667eea;
  padding-top: 0.75rem;
}

.breakdown-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 0.5rem 0;
}

/* Messages */
.error-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #991b1b;
  font-size: 0.875rem;
}

.success-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #dcfce7;
  border: 1px solid #86efac;
  border-radius: 8px;
  color: #166534;
  font-size: 0.875rem;
  margin-top: 1rem;
}

/* Actions */
.form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.btn-primary {
  flex: 1;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  flex: 1;
  padding: 0.75rem 1rem;
  background: white;
  color: #6b7280;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

/* Responsive */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>
