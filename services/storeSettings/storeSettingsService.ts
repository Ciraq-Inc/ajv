// services/storeSettings/storeSettingsService.ts
//
// Store-settings domain service. Owns all HTTP for the company-portal
// "Shopfront Customization" page: the `/api/companies/:id/store-settings`
// GET + PUT, the `/api/companies/:id/ads` CRUD endpoints, and the
// `/api/companies/:id/shop-assets/*` multipart uploads (logo, banner,
// ad image).
//
// Factory shape mirrors `services/companyAuth/companyAuthService.ts`:
// callers pass the `useApi()` wrapper and a `getHeaders` provider so
// the per-request company auth header is recomputed at call time.

import type { ApiInstance, ApiEnvelope, StoreSettings, Ad } from '../types';
import type { HeadersProvider } from '../companyAuth/companyAuthService';

export interface AdPayload {
  title?: string;
  image_url?: string | null;
  link?: string;
  is_active?: boolean;
  type?: string;
  headline?: string;
  body?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  [key: string]: unknown;
}

interface ApiOptions {
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  method?: string;
  body?: BodyInit | null;
  [key: string]: unknown;
}

export const createStoreSettingsService = (api: ApiInstance, getHeaders: HeadersProvider = () => ({})) => {
  const withHeaders = (options: ApiOptions = {}): ApiOptions => ({
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers ?? {}),
    },
  });

  return {
    /**
     * Fetch the authenticated company's full store-settings payload
     * (branding, theme, hide_prices, etc.).
     * GET /api/companies/:companyId/store-settings
     */
    getSettings(companyId: number | string): Promise<ApiEnvelope<StoreSettings>> {
      return api.get(`/api/companies/${companyId}/store-settings`, withHeaders());
    },

    /**
     * Update store-settings (branding/theme/hide_prices).
     * PUT /api/companies/:companyId/store-settings
     */
    updateSettings(companyId: number | string, payload: Partial<StoreSettings> & Record<string, unknown>): Promise<ApiEnvelope<StoreSettings>> {
      return api.put(
        `/api/companies/${companyId}/store-settings`,
        payload,
        withHeaders()
      );
    },

    /**
     * List the company's promotional ads.
     * GET /api/companies/:companyId/ads
     */
    listAds(companyId: number | string): Promise<ApiEnvelope<Ad[]>> {
      return api.get(`/api/companies/${companyId}/ads`, withHeaders());
    },

    /**
     * Create a new ad on the company storefront.
     * POST /api/companies/:companyId/ads
     */
    createAd(companyId: number | string, payload: AdPayload): Promise<ApiEnvelope<Ad>> {
      return api.post(`/api/companies/${companyId}/ads`, payload, withHeaders());
    },

    /**
     * Update an existing ad.
     * PUT /api/companies/:companyId/ads/:adId
     */
    updateAd(companyId: number | string, adId: number | string, payload: AdPayload): Promise<ApiEnvelope<Ad>> {
      return api.put(
        `/api/companies/${companyId}/ads/${adId}`,
        payload,
        withHeaders()
      );
    },

    /**
     * Delete an ad.
     * DELETE /api/companies/:companyId/ads/:adId
     */
    deleteAd(companyId: number | string, adId: number | string): Promise<ApiEnvelope<null>> {
      return api.delete(`/api/companies/${companyId}/ads/${adId}`, withHeaders());
    },

    /**
     * Upload a shop asset (logo, banner, or ad image) via multipart form.
     * `endpointSuffix` is the path tail under the company's shop-assets
     * namespace, e.g. `/shop-assets/logo`, `/shop-assets/banner`,
     * `/shop-assets/ad-image`.
     * POST /api/companies/:companyId<endpointSuffix>
     *
     * NB: relies on the useApi FormData fix — `Content-Type` must NOT
     * be forced to `application/json` here so the browser can emit
     * the correct multipart boundary.
     */
    uploadShopAsset(companyId: number | string, endpointSuffix: string, file: File): Promise<ApiEnvelope<{ url: string }>> {
      const formData = new FormData();
      formData.append('image', file);
      return api.request(
        `/api/companies/${companyId}${endpointSuffix}`,
        withHeaders({
          method: 'POST',
          body: formData,
        })
      );
    },
  };
};
