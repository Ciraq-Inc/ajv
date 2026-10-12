import { useCompanyStore } from '~/stores/company'
import { createPharmacyPortalService } from '~/services/pharmacyPortal/pharmacyPortalService'

/** The signed-in pharmacy's portal calls, sent with its company headers and staff token. */
export const usePharmacyPortal = () => {
  const companyStore = useCompanyStore()
  return createPharmacyPortalService(useApi(), () => companyStore.getApiHeaders())
}
