// services/masterProducts/masterProductsService.ts
//
// Master-products domain service. All HTTP for the admin master-products
// page (pages/admin/masterlist.vue) lives here.
//
// FormData note: the image-upload endpoint expects `multipart/form-data`.
// The service receives a pre-built FormData object from the page. `useApi`
// detects `instanceof FormData` and omits the `Content-Type` header so the
// browser can set the correct multipart boundary automatically.

import type { ApiInstance, ApiEnvelope, MasterProductUploadResult } from '../types';

export const createMasterProductsService = (api: ApiInstance) => ({
  /**
   * Upload a product image for a master product.
   * POST /api/master-products/upload-image
   * Body: FormData with fields: image (File), productId (string), forceUpdate (string)
   * Returns: { success, imageUrl?, error? }
   */
  uploadImage(formData: FormData): Promise<MasterProductUploadResult> {
    return api.request('/api/master-products/upload-image', {
      method: 'POST',
      body: formData,
    });
  },
});
