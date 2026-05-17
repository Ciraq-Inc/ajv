// services/feeSchedules/feeSchedulesService.ts
//
// Fee-schedules domain service. All HTTP for the admin fee-schedules page
// lives here. Public API: a single factory that takes an `api` (the useApi
// wrapper) and returns a plain object of async functions.
//
// Public behavior MUST mirror the legacy in-page `apiCall` helper calls
// exactly: same paths, same method, same body shape.

import type { ApiInstance, ApiEnvelope, FeeSchedule, FeeTier } from '../types';

export interface CreateDraftParams {
  name?: string;
  top_tier_per_km?: number;
  max_billable_km?: number;
  clone_from_id?: number | null;
}

export interface UpdateHeaderParams {
  name?: string;
  top_tier_per_km?: number;
  max_billable_km?: number;
  notes?: string;
}

export interface AddTierParams {
  from_km?: number;
  fee_ghs?: number;
  label?: string | null;
}

export interface UpdateTierParams {
  from_km?: number;
  fee_ghs?: number;
  label?: string | null;
}

export const createFeeSchedulesService = (api: ApiInstance) => ({
  /**
   * List all fee schedules.
   * GET /api/fee-schedules
   */
  list(): Promise<ApiEnvelope<FeeSchedule[]>> {
    return api.get('/api/fee-schedules');
  },

  /**
   * Fetch a single fee schedule with its tiers.
   * GET /api/fee-schedules/:id
   */
  getById(id: number | string): Promise<ApiEnvelope<FeeSchedule>> {
    return api.get(`/api/fee-schedules/${id}`);
  },

  /**
   * Create a new draft fee schedule.
   * POST /api/fee-schedules
   * Body: { name, top_tier_per_km, max_billable_km, clone_from_id? }
   */
  createDraft({ name, top_tier_per_km, max_billable_km, clone_from_id }: CreateDraftParams = {}): Promise<ApiEnvelope<FeeSchedule>> {
    const body: Record<string, unknown> = { name, top_tier_per_km, max_billable_km };
    if (clone_from_id != null) body['clone_from_id'] = clone_from_id;
    return api.post('/api/fee-schedules', body);
  },

  /**
   * Update fee schedule header fields.
   * PUT /api/fee-schedules/:id
   */
  updateHeader(id: number | string, { name, top_tier_per_km, max_billable_km, notes }: UpdateHeaderParams = {}): Promise<ApiEnvelope<FeeSchedule>> {
    return api.put(`/api/fee-schedules/${id}`, { name, top_tier_per_km, max_billable_km, notes });
  },

  /**
   * Publish a draft fee schedule (makes it active, supersedes current).
   * POST /api/fee-schedules/:id/publish
   */
  publish(id: number | string): Promise<ApiEnvelope<FeeSchedule>> {
    return api.post(`/api/fee-schedules/${id}/publish`, {});
  },

  /**
   * Add a tier to a fee schedule.
   * POST /api/fee-schedules/:scheduleId/tiers
   */
  addTier(scheduleId: number | string, { from_km, fee_ghs, label }: AddTierParams = {}): Promise<ApiEnvelope<FeeTier>> {
    return api.post(`/api/fee-schedules/${scheduleId}/tiers`, {
      from_km,
      fee_ghs,
      label: label ?? null,
    });
  },

  /**
   * Update an existing tier.
   * PUT /api/fee-schedules/:scheduleId/tiers/:tierId
   */
  updateTier(scheduleId: number | string, tierId: number | string, { from_km, fee_ghs, label }: UpdateTierParams = {}): Promise<ApiEnvelope<FeeTier>> {
    return api.put(`/api/fee-schedules/${scheduleId}/tiers/${tierId}`, { from_km, fee_ghs, label });
  },

  /**
   * Delete a tier from a fee schedule.
   * DELETE /api/fee-schedules/:scheduleId/tiers/:tierId
   */
  deleteTier(scheduleId: number | string, tierId: number | string): Promise<ApiEnvelope<null>> {
    return api.delete(`/api/fee-schedules/${scheduleId}/tiers/${tierId}`);
  },
});
