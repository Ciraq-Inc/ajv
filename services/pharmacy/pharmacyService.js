// services/pharmacy/pharmacyService.js
//
// Pharmacy (company) domain service. All HTTP for public pharmacy lookups
// lives here. Public API: a single factory that takes an `api` (the
// useApi wrapper) and returns a plain object of async functions. Stores
// import the factory, hand it `useApi()`, and call the functions.
//
// Why a factory: lets the caller inject `useApi()` once (which itself
// reads runtimeConfig and the auth token) so the service stays
// framework-agnostic and trivially mockable in tests.
//
// Public behavior MUST mirror the legacy in-store fetch calls exactly:
// same paths, same method, same query shape. Response envelope handling
// (`{ success, data, message }`) is performed by the caller, not here.
// These endpoints are public (no auth required); `useApi` will simply
// omit the Authorization header when no token is present.

export const createPharmacyService = (api) => ({
  /**
   * Fetch a single pharmacy (company) by numeric id.
   * GET /api/companies/:id
   */
  getById(companyId) {
    return api.get(`/api/companies/${companyId}`);
  },

  /**
   * Fetch products for a pharmacy with paging + optional search.
   * GET /api/products?company_id=&page=&limit=&search=
   */
  listProducts({ companyId, page = 1, limit = 50, search = '' } = {}) {
    const params = { company_id: companyId, page, limit };
    if (search) params.search = search;
    return api.get('/api/products', { params });
  },

  /**
   * Resolve a pharmacy by domain slug. Returns the same envelope as
   * getById. The slug must be URL-encoded by the service since the
   * server matches it verbatim.
   * GET /api/companies/domain/:slug
   */
  getByDomainSlug(slug) {
    return api.get(`/api/companies/domain/${encodeURIComponent(slug)}`);
  },

  /**
   * Create or update a product for a pharmacy (used by the drugs/inventory
   * page). The server uses `id` presence to distinguish create vs. update.
   * POST /products
   * Body: { id?, company_id, brand_name, unit, sell_unit, selling_price,
   *          stock_qty, is_active?, imageUrl? }
   * Returns: { success, message? }
   *
   * Note: this endpoint is at `/products` (not `/api/products`) — the path
   * is preserved verbatim from the legacy page call.
   */
  saveProduct(payload) {
    return api.post('/products', payload);
  },
});
