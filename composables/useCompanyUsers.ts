import { useCompanyStore } from '~/stores/company'
import { createCompanyUsersService } from '~/services/companyUsers/companyUsersService'

/** The signed-in pharmacy's staff-access calls, sent with its company headers and staff token. */
export const useCompanyUsers = () => {
  const companyStore = useCompanyStore()
  return createCompanyUsersService(useApi(), () => companyStore.getApiHeaders())
}
