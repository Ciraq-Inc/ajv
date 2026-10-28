import { createAdminAccessService } from '~/services/admin/accessService'
import { useAdminGuarded } from '~/composables/useAdminGuarded'

/** The platform admin's access-management calls, signed out on an expired session. */
export const useAdminAccess = () => useAdminGuarded(createAdminAccessService(useApi()))
