// services/sms/campaignService.ts
//
// SMS campaigns domain service. Migrated from the legacy `default export
// (apiBase) => ({...})` pattern (which used raw `fetch()` and per-function
// token params) to the standard `createCampaignService(api)` factory pattern.
//
// The token-injection and base-URL concerns now live in `useApi()`, so
// callers no longer pass a token per function.

import type { ApiInstance, ApiEnvelope, SmsCampaign, SmsCampaignStats, SmsCampaignRecipient, SmsCampaignLog } from '../types';

export interface CampaignFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number | string;
  offset?: number | string;
}

export interface CampaignRecipientFilters {
  status?: string;
  limit?: number | string;
  offset?: number | string;
}

export interface CampaignLogFilters {
  log_type?: string;
  limit?: number | string;
}

export interface TestSmsData {
  phone: string;
  message: string;
  [key: string]: unknown;
}

export interface ReuseCampaignData {
  [key: string]: unknown;
}

export interface ResendCampaignData {
  [key: string]: unknown;
}

export const createCampaignService = (api: ApiInstance) => ({
  /** Create a new campaign. POST /api/sms-campaigns */
  createCampaign(data: Partial<SmsCampaign> & Record<string, unknown>): Promise<ApiEnvelope<SmsCampaign>> {
    return api.post<SmsCampaign>('/api/sms-campaigns', data);
  },

  /** Get campaigns with optional filters. GET /api/sms-campaigns */
  getCampaigns(filters: CampaignFilters = {}): Promise<ApiEnvelope<SmsCampaign[]>> {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.offset) params.append('offset', String(filters.offset));
    const qs = params.toString();
    return api.get<SmsCampaign[]>(`/api/sms-campaigns${qs ? `?${qs}` : ''}`);
  },

  /** Get all campaigns for admin (all companies). GET /api/sms-campaigns/admin/all */
  getAllCampaignsAdmin(filters: CampaignFilters = {}): Promise<ApiEnvelope<SmsCampaign[]>> {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.offset) params.append('offset', String(filters.offset));
    const qs = params.toString();
    return api.get<SmsCampaign[]>(`/api/sms-campaigns/admin/all${qs ? `?${qs}` : ''}`);
  },

  /** Get campaign by ID. GET /api/sms-campaigns/:id */
  getCampaignById(campaignId: number | string): Promise<ApiEnvelope<SmsCampaign>> {
    return api.get<SmsCampaign>(`/api/sms-campaigns/${campaignId}`);
  },

  /** Start campaign. POST /api/sms-campaigns/:id/start */
  startCampaign(campaignId: number | string): Promise<ApiEnvelope<SmsCampaign>> {
    return api.post<SmsCampaign>(`/api/sms-campaigns/${campaignId}/start`, {});
  },

  /** Pause campaign. POST /api/sms-campaigns/:id/pause */
  pauseCampaign(campaignId: number | string): Promise<ApiEnvelope<SmsCampaign>> {
    return api.post<SmsCampaign>(`/api/sms-campaigns/${campaignId}/pause`, {});
  },

  /** Resume campaign. POST /api/sms-campaigns/:id/resume */
  resumeCampaign(campaignId: number | string): Promise<ApiEnvelope<SmsCampaign>> {
    return api.post<SmsCampaign>(`/api/sms-campaigns/${campaignId}/resume`, {});
  },

  /** Cancel campaign. POST /api/sms-campaigns/:id/cancel */
  cancelCampaign(campaignId: number | string): Promise<ApiEnvelope<SmsCampaign>> {
    return api.post<SmsCampaign>(`/api/sms-campaigns/${campaignId}/cancel`, {});
  },

  /** Archive campaign. POST /api/sms-campaigns/:id/archive */
  archiveCampaign(campaignId: number | string): Promise<ApiEnvelope<SmsCampaign>> {
    return api.post<SmsCampaign>(`/api/sms-campaigns/${campaignId}/archive`, {});
  },

  /** Restore campaign. POST /api/sms-campaigns/:id/restore */
  restoreCampaign(campaignId: number | string): Promise<ApiEnvelope<SmsCampaign>> {
    return api.post<SmsCampaign>(`/api/sms-campaigns/${campaignId}/restore`, {});
  },

  /** Get campaign statistics. GET /api/sms-campaigns/:id/stats */
  getCampaignStats(campaignId: number | string): Promise<ApiEnvelope<SmsCampaignStats>> {
    return api.get<SmsCampaignStats>(`/api/sms-campaigns/${campaignId}/stats`);
  },

  /** Get campaign recipients. GET /api/sms-campaigns/:id/recipients */
  getCampaignRecipients(campaignId: number | string, filters: CampaignRecipientFilters = {}): Promise<ApiEnvelope<SmsCampaignRecipient[]>> {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.offset) params.append('offset', String(filters.offset));
    const qs = params.toString();
    return api.get<SmsCampaignRecipient[]>(`/api/sms-campaigns/${campaignId}/recipients${qs ? `?${qs}` : ''}`);
  },

  /** Get campaign logs. GET /api/sms-campaigns/:id/logs */
  getCampaignLogs(campaignId: number | string, filters: CampaignLogFilters = {}): Promise<ApiEnvelope<SmsCampaignLog[]>> {
    const params = new URLSearchParams();
    if (filters.log_type) params.append('log_type', filters.log_type);
    if (filters.limit) params.append('limit', String(filters.limit));
    const qs = params.toString();
    return api.get<SmsCampaignLog[]>(`/api/sms-campaigns/${campaignId}/logs${qs ? `?${qs}` : ''}`);
  },

  /** Send test SMS. POST /api/sms-campaigns/test/send */
  sendTestSms(data: TestSmsData): Promise<ApiEnvelope<unknown>> {
    return api.post('/api/sms-campaigns/test/send', data);
  },

  /** Delete campaign. DELETE /api/sms-campaigns/:id */
  deleteCampaign(campaignId: number | string): Promise<ApiEnvelope<unknown>> {
    return api.delete(`/api/sms-campaigns/${campaignId}`);
  },

  /** Update campaign. PUT /api/sms-campaigns/:id */
  updateCampaign(campaignId: number | string, data: Partial<SmsCampaign> & Record<string, unknown>): Promise<ApiEnvelope<SmsCampaign>> {
    return api.put<SmsCampaign>(`/api/sms-campaigns/${campaignId}`, data);
  },

  /** Reuse/Duplicate campaign. POST /api/sms-campaigns/:id/reuse */
  reuseCampaign(campaignId: number | string, data: ReuseCampaignData = {}): Promise<ApiEnvelope<SmsCampaign>> {
    return api.post<SmsCampaign>(`/api/sms-campaigns/${campaignId}/reuse`, data);
  },

  /** Resend campaign. POST /api/sms-campaigns/:id/resend */
  resendCampaign(campaignId: number | string, data: ResendCampaignData = {}): Promise<ApiEnvelope<SmsCampaign>> {
    return api.post<SmsCampaign>(`/api/sms-campaigns/${campaignId}/resend`, data);
  },
});
