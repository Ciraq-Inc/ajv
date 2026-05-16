// services/sms/smsSettingsService.js
//
// SMS settings domain service (admin-only). Factory takes a `useApi()`
// instance and returns plain async verbs the page consumes.
//
// Auth: `useApi` falls back to `adminToken` from localStorage for any
// endpoint that doesn't match a more specific prefix — `/api/sms-settings`
// hits that fallback, so the Bearer header is preserved without the page
// touching the store.
//
// Envelope: backend returns `{ success, data, message }`; we return it
// raw and let the page branch on `result.success` / `result.message`,
// matching the pre-refactor behavior. Non-2xx responses throw via
// `useApi` (same effect as the page's prior `throw new Error('API call
// failed: ' + status)`), and the page's catch block already inspects
// `error.message.includes('404')`, which still works because `useApi`
// includes the status text and the parsed `message` in its thrown error.

export const createSmsSettingsService = (api) => ({
  /**
   * Fetch the currently active SMS settings row (rate + provider).
   * GET /api/sms-settings/active
   */
  getActiveSettings() {
    return api.get('/api/sms-settings/active');
  },

  /**
   * Update the SMS rate only.
   * PUT /api/sms-settings/rate  body: { rate }
   */
  updateRate(rate) {
    return api.put('/api/sms-settings/rate', { rate });
  },

  /**
   * Save the combined global settings payload. The page only includes
   * keys that actually changed (rate and/or provider), so callers must
   * pass the same trimmed object shape they used pre-refactor.
   * PUT /api/sms-settings  body: { rate?, provider? }
   */
  updateGlobalSettings(data) {
    return api.put('/api/sms-settings', data);
  },

  /**
   * Update the active SMS provider only.
   * PUT /api/sms-settings/provider  body: { provider }
   */
  updateProvider(provider) {
    return api.put('/api/sms-settings/provider', { provider });
  }
});
