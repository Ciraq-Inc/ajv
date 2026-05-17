// services/sms/smsSettingsService.ts
//
// SMS settings domain service (admin-only). Factory takes a `useApi()`
// instance and returns plain async verbs the page consumes.
//
// Auth: `useApi` falls back to `adminToken` from localStorage for any
// endpoint that doesn't match a more specific prefix — `/api/sms-settings`
// hits that fallback.
//
// Envelope: backend returns `{ success, data, message }`; we return it
// raw and let the page branch on `result.success` / `result.message`.

import type { ApiInstance, ApiEnvelope, SmsSettings, SmsGlobalSettingsUpdate } from '../types';

export const createSmsSettingsService = (api: ApiInstance) => ({
  /**
   * Fetch the currently active SMS settings row (rate + provider).
   * GET /api/sms-settings/active
   */
  getActiveSettings(): Promise<ApiEnvelope<SmsSettings>> {
    return api.get('/api/sms-settings/active');
  },

  /**
   * Update the SMS rate only.
   * PUT /api/sms-settings/rate  body: { rate }
   */
  updateRate(rate: number): Promise<ApiEnvelope<SmsSettings>> {
    return api.put('/api/sms-settings/rate', { rate });
  },

  /**
   * Save the combined global settings payload.
   * PUT /api/sms-settings  body: { rate?, provider? }
   */
  updateGlobalSettings(data: SmsGlobalSettingsUpdate): Promise<ApiEnvelope<SmsSettings>> {
    return api.put('/api/sms-settings', data);
  },

  /**
   * Update the active SMS provider only.
   * PUT /api/sms-settings/provider  body: { provider }
   */
  updateProvider(provider: string): Promise<ApiEnvelope<SmsSettings>> {
    return api.put('/api/sms-settings/provider', { provider });
  },
});
