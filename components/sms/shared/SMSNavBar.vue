<template>
  <div class="sms-nav-bar">
    <div class="nav-container">
      <!-- Logo/Title -->
      <div class="nav-brand">
        <span class="nav-icon">📱</span>
        <span class="nav-title">SMS Portal</span>
      </div>

      <!-- Navigation Links -->
      <nav class="nav-links">
        <NuxtLink 
          to="/company/sms-campaigns" 
          class="nav-link"
          active-class="active"
        >
          <Icon name="Megaphone" size="18" />
          <span>Campaigns</span>
        </NuxtLink>

        <NuxtLink 
          to="/company/sms-billing" 
          class="nav-link"
          active-class="active"
        >
          <Icon name="CreditCard" size="18" />
          <span>Billing</span>
        </NuxtLink>

        <NuxtLink 
          to="/company/sms-create-campaign" 
          class="nav-link nav-cta"
        >
          <Icon name="Plus" size="18" />
          <span>Create Campaign</span>
        </NuxtLink>
      </nav>

      <!-- Balance Display (optional) -->
      <div v-if="showBalance && balance !== null" class="nav-balance">
        <Icon name="Wallet" size="16" />
        <span class="balance-amount">{{ formatCurrency(balance) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useSMSBilling } from '~/composables/useSMSBilling'
import { formatCurrency } from '~/utils/constants/sms'

// Props
const props = defineProps({
  showBalance: {
    type: Boolean,
    default: true
  }
})

// Composables
const { balance, fetchBalance } = useSMSBilling()

// Lifecycle
onMounted(async () => {
  if (props.showBalance) {
    try {
      await fetchBalance()
    } catch (error) {
      console.error('Failed to load balance:', error)
    }
  }
})
</script>

<style scoped>
.sms-nav-bar {
  background: white;
  border-bottom: 1px solid #E5E7EB;
  padding: 0;
  margin-bottom: 24px;
}

.nav-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-icon {
  font-size: 24px;
}

.nav-title {
  font-size: 18px;
  font-weight: 700;
  color: #1F2937;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: center;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #6B7280;
  text-decoration: none;
  transition: all 0.2s;
}

.nav-link:hover {
  background: #F3F4F6;
  color: #1F2937;
}

.nav-link.active {
  background: #EFF6FF;
  color: #1D4ED8;
}

.nav-link.nav-cta {
  background: #3B82F6;
  color: white;
}

.nav-link.nav-cta:hover {
  background: #2563EB;
}

.nav-balance {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  color: white;
  border-radius: 20px;
  font-weight: 600;
  font-size: 14px;
}

.balance-amount {
  font-weight: 700;
}

/* Responsive */
@media (max-width: 768px) {
  .nav-container {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .nav-brand {
    justify-content: center;
  }

  .nav-links {
    flex-direction: column;
    gap: 8px;
  }

  .nav-link {
    justify-content: center;
    width: 100%;
  }

  .nav-balance {
    justify-content: center;
  }
}
</style>
