// services/masterProducts/masterProductsService.js
//
// Master-products domain service. All HTTP for the admin master-products
// page (pages/admin/masterlist.vue) lives here. Public API: a single factory
// that takes an `api` (the useApi wrapper) and returns a plain object of
// async functions. Pages import the factory, hand it `useApi()`, and call
// the functions.
//
// Why a factory: lets the caller inject `useApi()` once (which itself reads
// runtimeConfig and the auth token) so the service stays framework-agnostic
// and trivially mockable in tests.
//
// FormData note: the image-upload endpoint expects `multipart/form-data`.
// The service receives a pre-built FormData object from the page (which is
// responsible for browser-image-compression before calling this). `useApi`
// detects `instanceof FormData` and omits the `Content-Type` header so the
// browser can set the correct multipart boundary automatically.
//
// Public behavior MUST mirror the legacy in-page fetch calls exactly: same
// paths, same method, same body shape. Response envelope handling
// (`{ success, data, error, imageUrl }`) is performed by the caller (the page).

export const createMasterProductsService = (api) => ({
  /**
   * Upload a product image for a master product.
   * POST /api/master-products/upload-image
   * Body: FormData with fields: image (File), productId (string), forceUpdate (string)
   * Returns: { success, imageUrl?, error? }
   */
  uploadImage(formData) {
    return api.request('/api/master-products/upload-image', {
      method: 'POST',
      body: formData,
    })
  },
})
