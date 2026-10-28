import { computed } from 'vue'
import { useCompanyStore } from '~/stores/company'
import { canBuySmsCredits, canSendSmsCampaigns } from '~/utils/companyAccess'

// Which SMS spend buttons the signed-in staff member gets (the server enforces the same rules).
export const useSmsSpendAccess = () => {
  const companyStore = useCompanyStore()
  return {
    canSendCampaigns: computed(() => canSendSmsCampaigns(companyStore.userRole)),
    canBuyCredits: computed(() => canBuySmsCredits(companyStore.userRole)),
  }
}
