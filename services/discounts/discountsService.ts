import type { ApiInstance } from '~/composables/useApi'

export interface DiscountCode {
  id: number
  company_id: number | null
  code: string
  description: string | null
  discount_type: 'percentage' | 'flat_amount' | 'free_shipping'
  discount_value: number
  max_discount_amount: number | null
  min_order_amount: number | null
  max_uses: number | null
  max_uses_per_customer: number | null
  times_used: number
  valid_from: string | null
  valid_until: string | null
  is_active: boolean
  audience?: 'all' | 'customer' | 'pharmacy'
  status: 'active' | 'expired' | 'depleted' | 'inactive'
  created_at: string
  updated_at: string
  // from getCode (with stats and scope)
  redemptions?: number
  total_discounted?: number
  allowed_pharmacies?: number[]
}

export interface DiscountStats {
  total: number
  active: number
  expired: number
  depleted: number
  inactive: number
}

export interface CreateDiscountPayload {
  code: string
  discount_type: 'percentage' | 'flat_amount' | 'free_shipping'
  discount_value: number
  description?: string
  min_order_amount?: number | null
  max_discount_amount?: number | null
  max_uses?: number | null
  max_uses_per_customer?: number | null
  valid_from?: string | null
  valid_until?: string | null
  audience?: 'all' | 'customer' | 'pharmacy'
  allowed_pharmacy_ids?: number[]
}

export interface UpdateDiscountPayload {
  is_active?: boolean
  valid_until?: string | null
  max_uses?: number | null
  description?: string | null
}

export const createDiscountsService = (api: ApiInstance) => ({
  list(params: { active_only?: boolean; limit?: number; offset?: number } = {}) {
    const qs = new URLSearchParams()
    if (params.active_only) qs.set('active_only', 'true')
    if (params.limit) qs.set('limit', String(params.limit))
    if (params.offset) qs.set('offset', String(params.offset))
    const q = qs.toString()
    return api.get<DiscountCode[]>(`/api/company-discounts${q ? `?${q}` : ''}`)
  },

  getStats() {
    return api.get<DiscountStats>('/api/company-discounts/stats')
  },

  getById(id: number | string) {
    return api.get<DiscountCode>(`/api/company-discounts/${id}`)
  },

  create(payload: CreateDiscountPayload) {
    return api.post<DiscountCode>('/api/company-discounts', payload)
  },

  update(id: number | string, payload: UpdateDiscountPayload) {
    return api.put<DiscountCode>(`/api/company-discounts/${id}`, payload)
  },

  deactivate(id: number | string) {
    return api.delete(`/api/company-discounts/${id}`)
  },
})
