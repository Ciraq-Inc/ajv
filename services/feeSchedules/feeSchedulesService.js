// services/feeSchedules/feeSchedulesService.js
//
// Fee-schedules domain service. All HTTP for the admin fee-schedules page
// lives here. Public API: a single factory that takes an `api` (the useApi
// wrapper) and returns a plain object of async functions. Pages import the
// factory, hand it `useApi()`, and call the functions.
//
// Why a factory: lets the caller inject `useApi()` once (which itself reads
// runtimeConfig and the auth token) so the service stays framework-agnostic
// and trivially mockable in tests.
//
// Public behavior MUST mirror the legacy in-page `apiCall` helper calls
// exactly: same paths, same method, same body shape. Response envelope
// handling (`{ success, data, message }`) is performed by the caller (the
// page). Error propagation is also the caller's responsibility.

export const createFeeSchedulesService = (api) => ({
  /**
   * List all fee schedules.
   * GET /api/fee-schedules
   * Returns: { data: FeeSchedule[] }
   */
  list() {
    return api.get('/api/fee-schedules')
  },

  /**
   * Fetch a single fee schedule with its tiers.
   * GET /api/fee-schedules/:id
   * Returns: { data: FeeSchedule }
   */
  getById(id) {
    return api.get(`/api/fee-schedules/${id}`)
  },

  /**
   * Create a new draft fee schedule.
   * POST /api/fee-schedules
   * Body: { name, top_tier_per_km, max_billable_km, clone_from_id? }
   * Returns: { data: { id, ... } }
   */
  createDraft({ name, top_tier_per_km, max_billable_km, clone_from_id } = {}) {
    const body = { name, top_tier_per_km, max_billable_km }
    if (clone_from_id != null) body.clone_from_id = clone_from_id
    return api.post('/api/fee-schedules', body)
  },

  /**
   * Update fee schedule header fields.
   * PUT /api/fee-schedules/:id
   * Body: { name, top_tier_per_km, max_billable_km, notes }
   */
  updateHeader(id, { name, top_tier_per_km, max_billable_km, notes } = {}) {
    return api.put(`/api/fee-schedules/${id}`, { name, top_tier_per_km, max_billable_km, notes })
  },

  /**
   * Publish a draft fee schedule (makes it active, supersedes current).
   * POST /api/fee-schedules/:id/publish
   */
  publish(id) {
    return api.post(`/api/fee-schedules/${id}/publish`, {})
  },

  /**
   * Add a tier to a fee schedule.
   * POST /api/fee-schedules/:scheduleId/tiers
   * Body: { from_km, fee_ghs, label? }
   */
  addTier(scheduleId, { from_km, fee_ghs, label } = {}) {
    return api.post(`/api/fee-schedules/${scheduleId}/tiers`, { from_km, fee_ghs, label: label || null })
  },

  /**
   * Update an existing tier.
   * PUT /api/fee-schedules/:scheduleId/tiers/:tierId
   * Body: { from_km, fee_ghs, label }
   */
  updateTier(scheduleId, tierId, { from_km, fee_ghs, label } = {}) {
    return api.put(`/api/fee-schedules/${scheduleId}/tiers/${tierId}`, { from_km, fee_ghs, label })
  },

  /**
   * Delete a tier from a fee schedule.
   * DELETE /api/fee-schedules/:scheduleId/tiers/:tierId
   */
  deleteTier(scheduleId, tierId) {
    return api.delete(`/api/fee-schedules/${scheduleId}/tiers/${tierId}`)
  },
})
