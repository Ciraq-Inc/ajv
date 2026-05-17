// services/platformSettings/platformSettingsService.ts
//
// Platform settings domain service (admin-only). Factory takes a
// `useApi()` instance and returns plain async verbs.
//
// Auth: `useApi` falls back to `adminToken` from localStorage for
// `/api/platform-settings*`.
//
// Envelope nuance preserved at the call site (NOT in this service):
// the pre-refactor `apiCall` threw not only on `!response.ok` but also
// when the parsed body had `payload.success === false`. `useApi` only
// throws on the HTTP status, so the page keeps a `success === false`
// guard after awaiting these calls.

import type { ApiInstance, ApiEnvelope, PlatformSetting, PlatformSettingUpdate } from '../types';

export const createPlatformSettingsService = (api: ApiInstance) => ({
  /**
   * Fetch all platform setting rows.
   * GET /api/platform-settings
   * Resolved envelope: `{ success, data: Array<{ setting_key, setting_value, ... }>, message }`
   */
  listSettings(): Promise<ApiEnvelope<PlatformSetting[]>> {
    return api.get('/api/platform-settings');
  },

  /**
   * Bulk-update an array of `{ key, value }` rows.
   * Body shape MUST match the legacy call: `{ settings: [{ key, value }, ...] }`.
   * PUT /api/platform-settings/bulk
   */
  bulkUpdate(settings: PlatformSettingUpdate[]): Promise<ApiEnvelope<null>> {
    return api.put('/api/platform-settings/bulk', { settings });
  },
});
