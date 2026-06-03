import type { ApiInstance } from '~/composables/useApi'

export interface ApiKey {
  id: number
  key_name: string
  is_active: boolean
  scopes: string[] | null
  rate_limit_tier: string
  description: string | null
  last_used_at: string | null
  expires_at: string | null
  created_at: string
  is_platform_key?: number // 1 = platform key, 0 = company-scoped
  api_key?: string // only present at creation
}

export interface CreateApiKeyPayload {
  key_name: string
  scopes?: string[] | null
  rate_limit_tier?: string
  expires_at?: string | null
  description?: string | null
}

export interface UsageSummaryRow {
  endpoint: string
  method: string
  total_requests: number
  error_count: number
  avg_latency_ms: number
  last_used_at: string
}

export interface UsageTimelineRow {
  day: string
  api_key_id: number
  requests: number
  errors: number
}

export const createDeveloperPortalService = (api: ApiInstance) => ({
  listKeys(companyId: number | string) {
    return api.get<ApiKey[]>(`/api/companies/${companyId}/api-keys`)
  },

  createKey(companyId: number | string, payload: CreateApiKeyPayload) {
    return api.post<ApiKey>(`/api/companies/${companyId}/api-keys`, payload)
  },

  revokeKey(companyId: number | string, keyId: number | string) {
    return api.delete(`/api/companies/${companyId}/api-keys/${keyId}`)
  },

  listPlatformKeys() {
    return api.get<ApiKey[]>('/api/admin/api-keys')
  },

  revokePlatformKey(keyId: number | string) {
    return api.delete(`/api/admin/api-keys/${keyId}`)
  },

  getUsage(companyId: number | string, params: { days?: number; api_key_id?: number | string } = {}) {
    const qs = new URLSearchParams()
    if (params.days) qs.set('days', String(params.days))
    if (params.api_key_id) qs.set('api_key_id', String(params.api_key_id))
    const q = qs.toString()
    return api.get<{ summary: UsageSummaryRow[]; timeline: UsageTimelineRow[] }>(
      `/api/companies/${companyId}/api-keys/usage${q ? `?${q}` : ''}`
    )
  },
})
