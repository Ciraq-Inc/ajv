import type { ApiInstance } from '~/composables/useApi'
import type { DiscountCode, DiscountStats, CreateDiscountPayload, UpdateDiscountPayload } from './discountsService'

export interface AdminCreateDiscountPayload extends CreateDiscountPayload {
  company_id?: number | null // null = global code
}

export interface BatchCreatePayload extends AdminCreateDiscountPayload {
  prefix: string
  suffix_length?: number
  count: number
}

type CompanyId = number | string | null

const companyQs = (companyId: CompanyId) =>
  companyId !== null && companyId !== undefined ? `?company_id=${companyId}` : ''

export const createAdminDiscountsService = (api: ApiInstance) => ({
  list(companyId: CompanyId, params: { active_only?: boolean; limit?: number; offset?: number } = {}) {
    const qs = new URLSearchParams()
    if (companyId !== null && companyId !== undefined) qs.set('company_id', String(companyId))
    if (params.active_only) qs.set('active_only', 'true')
    if (params.limit) qs.set('limit', String(params.limit))
    if (params.offset) qs.set('offset', String(params.offset))
    const q = qs.toString()
    return api.get<DiscountCode[]>(`/api/admin/discounts${q ? `?${q}` : ''}`)
  },

  getStats(companyId: CompanyId) {
    return api.get<DiscountStats>(`/api/admin/discounts/stats${companyQs(companyId)}`)
  },

  getById(companyId: CompanyId, id: number | string) {
    return api.get<DiscountCode>(`/api/admin/discounts/${id}${companyQs(companyId)}`)
  },

  create(payload: AdminCreateDiscountPayload) {
    return api.post<DiscountCode>('/api/admin/discounts', payload)
  },

  update(companyId: CompanyId, id: number | string, payload: UpdateDiscountPayload) {
    return api.put<DiscountCode>(`/api/admin/discounts/${id}${companyQs(companyId)}`, payload)
  },

  deactivate(companyId: CompanyId, id: number | string) {
    return api.delete(`/api/admin/discounts/${id}${companyQs(companyId)}`)
  },

  batchCreate(payload: BatchCreatePayload) {
    return api.post<{ count: number; codes: string[] }>('/api/admin/discounts/batch', payload)
  },
})
