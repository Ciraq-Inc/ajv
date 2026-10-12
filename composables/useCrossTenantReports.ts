// composables/useCrossTenantReports.ts
//
// The cross-tenant analytics calls for the admin dashboards, with the admin
// session handling applied (see composables/useAdminGuarded.ts).

import { createCrossTenantReportsService } from '~/services/analytics/crossTenantReportsService';
import { useAdminGuarded } from '~/composables/useAdminGuarded';

export const useCrossTenantReports = () => useAdminGuarded(createCrossTenantReportsService(useApi()));
