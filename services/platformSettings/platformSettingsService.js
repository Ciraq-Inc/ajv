// services/platformSettings/platformSettingsService.js
//
// Platform settings domain service (admin-only). Factory takes a
// `useApi()` instance and returns plain async verbs.
//
// Auth: `useApi` falls back to `adminToken` from localStorage for
// `/api/platform-settings*` — same Bearer behavior the page had before.
//
// Envelope nuance preserved at the call site (NOT in this service):
// the pre-refactor `apiCall` threw not only on `!response.ok` but also
// when the parsed body had `payload.success === false`. `useApi` only
// throws on the HTTP status, so the page keeps a `success === false`
// guard after awaiting these calls, re-throwing with `payload.message`
// the same way as before. Returning the raw envelope here keeps that
// contract intact.

export const createPlatformSettingsService = (api) => ({
  /**
   * Fetch all platform setting rows.
   * GET /api/platform-settings
   * Resolved envelope: `{ success, data: Array<{ setting_key, setting_value, ... }>, message }`
   */
  listSettings() {
    return api.get('/api/platform-settings');
  },

  /**
   * Bulk-update an array of `{ key, value }` rows. Body shape MUST match
   * the legacy call: `{ settings: [{ key, value }, ...] }`.
   * PUT /api/platform-settings/bulk
   */
  bulkUpdate(settings) {
    return api.put('/api/platform-settings/bulk', { settings });
  }
});
