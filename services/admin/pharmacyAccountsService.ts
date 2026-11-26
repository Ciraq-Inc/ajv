import type { ApiEnvelope, ApiInstance } from '../types'

export type AdminAccountsRange = '7d' | '30d' | '90d' | 'all'
export type AdminAccountTypeFilter = 'all' | 'cash' | 'bank' | 'mobile_money' | 'pos' | 'petty_cash' | 'loan'

export interface AdminAccountsSummary {
  total_pharmacies: number
  active_pharmacies: number
  accounts_created: number
  ledger_postings: number
  tracked_available_funds: number
}

export interface AdminPharmacyAccountListItem {
  company_id: number
  name: string
  location: string | null
  account_count: number
  available_funds: number
  loans_owed: number
  last_activity_at: string | null
}

export interface AdminAccountsOverviewData {
  range: AdminAccountsRange
  summary: AdminAccountsSummary
  pharmacies: AdminPharmacyAccountListItem[]
}

export interface AdminPharmacyAccountRow {
  id: number
  name: string
  type: Exclude<AdminAccountTypeFilter, 'all'>
  branch: string | null
  current_balance: number
  money_in: number
  money_out: number
  last_movement_at: string | null
  created_at: string | null
}

export interface AdminPharmacyLedgerRow {
  id: number
  account_id: number
  account_name: string
  account_type: Exclude<AdminAccountTypeFilter, 'all'>
  source: string
  direction: 'in' | 'out'
  amount: number
  reference: string | null
  description: string | null
  entered_by: string | null
  posted_at: string
}

export interface AdminPharmacyAccountsDetailData {
  range: AdminAccountsRange
  pharmacy: {
    company_id: number
    name: string
    location: string | null
    available_funds: number
    money_in: number
    money_out: number
    loans_owed: number
    last_activity_at: string | null
  }
  accounts: AdminPharmacyAccountRow[]
  ledger: AdminPharmacyLedgerRow[]
  ledger_pagination: {
    limit: number
    offset: number
    total: number
  }
}

export const createAdminPharmacyAccountsService = (api: ApiInstance) => ({
  getOverview(params: {
    range?: AdminAccountsRange
    search?: string
    accountType?: AdminAccountTypeFilter
  } = {}): Promise<ApiEnvelope<AdminAccountsOverviewData>> {
    return api.get('/api/admin/pharmacy-accounts/overview', {
      params: {
        range: params.range || '30d',
        search: params.search?.trim() || undefined,
        accountType: params.accountType && params.accountType !== 'all' ? params.accountType : undefined,
      },
    })
  },

  getPharmacyDetail(
    companyId: number,
    params: {
      range?: AdminAccountsRange
      accountType?: AdminAccountTypeFilter
      limit?: number
      offset?: number
    } = {},
  ): Promise<ApiEnvelope<AdminPharmacyAccountsDetailData>> {
    return api.get(`/api/admin/pharmacy-accounts/${companyId}`, {
      params: {
        range: params.range || '30d',
        accountType: params.accountType && params.accountType !== 'all' ? params.accountType : undefined,
        limit: params.limit ?? 50,
        offset: params.offset ?? 0,
      },
    })
  },
})
