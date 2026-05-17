// Extracted from pages/admin/fulfillment/order-requests.vue — customer decision logic
import { ref, type Ref, type ComputedRef } from 'vue'

interface DecisionPayloadItem {
  status?: string
  unit_price?: number | null
  quantity?: number
  substitute_option?: {
    marked_up_price?: number
    [key: string]: unknown
  }
  [key: string]: unknown
}

interface Decision {
  id?: number | string
  payload?: {
    decision_items?: DecisionPayloadItem[]
    [key: string]: unknown
  }
  whatsapp_url?: string
  [key: string]: unknown
}

interface RequestRecord {
  id?: number | string
  [key: string]: unknown
}

interface Deps {
  selectedRequest: Ref<RequestRecord | null>
  loading: Ref<boolean>
  canSendPartialAvailabilityDecision: ComputedRef<boolean>
  canSendSplitFulfillmentDecision: ComputedRef<boolean>
  apiCall: (method: string, url: string, data?: Record<string, unknown>) => Promise<{ data: unknown }>
  showMessage: (text: string, type: string) => void
  fetchRequests: () => Promise<void>
  fetchFulfillmentPlans: (options?: { silent?: boolean }) => Promise<void>
}

export const useOrderRequestDecisions = ({
  selectedRequest,
  loading,
  canSendPartialAvailabilityDecision,
  canSendSplitFulfillmentDecision,
  apiCall,
  showMessage,
  fetchRequests,
  fetchFulfillmentPlans,
}: Deps) => {
  const decisionNotifyingId = ref<number | string | null>(null)

  const decisionOrderValue = (dec: Decision): number | null => {
    const items: DecisionPayloadItem[] = Array.isArray(dec.payload?.decision_items)
      ? dec.payload!.decision_items!
      : []
    const total = items.reduce((sum, item) => {
      if (['available', 'substitute_available', 'partially_available'].includes(item.status ?? '')) {
        const price = Number(item.unit_price ?? item.substitute_option?.marked_up_price ?? 0)
        const qty = Number(item.quantity ?? 1)
        return sum + price * qty
      }
      return sum
    }, 0)
    return total > 0 ? total : null
  }

  const decisionDeclineConsequence = (dec: Decision): string | null => {
    const items: DecisionPayloadItem[] = Array.isArray(dec.payload?.decision_items)
      ? dec.payload!.decision_items!
      : []
    if (!items.length) return null
    const sourceable = items.filter((i) =>
      ['available', 'substitute_available', 'partially_available'].includes(i.status ?? '')
    ).length
    const unsourceable = items.filter((i) => i.status === 'not_available').length
    const parts: string[] = []
    if (sourceable > 0) parts.push(`${sourceable} item${sourceable > 1 ? 's' : ''} return to sourcing`)
    if (unsourceable > 0) parts.push(`${unsourceable} item${unsourceable > 1 ? 's' : ''} cannot be sourced`)
    return parts.length ? `If declined: ${parts.join(', ')}.` : null
  }

  const requestCustomerDecision = async (decisionType: string): Promise<void> => {
    if (!selectedRequest.value) return

    if (decisionType === 'partial_availability' && !canSendPartialAvailabilityDecision.value) {
      showMessage('Partial availability only applies when one or more items are unavailable', 'info')
      return
    }

    if (decisionType === 'split_fulfillment' && !canSendSplitFulfillmentDecision.value) {
      showMessage('Split fulfillment only applies when all confirmed items are sourced from multiple pharmacies', 'info')
      return
    }

    loading.value = true
    try {
      const res = await apiCall('POST', `/api/order-requests/admin/${selectedRequest.value.id}/decisions`, {
        decision_type: decisionType,
      })
      const decision = (res?.data ?? {}) as Decision
      await fetchRequests()
      const detailRes = await apiCall('GET', `/api/order-requests/admin/${selectedRequest.value.id}`)
      selectedRequest.value = detailRes.data as RequestRecord
      await fetchFulfillmentPlans({ silent: true })

      if (decision.whatsapp_url && typeof window !== 'undefined') {
        window.open(decision.whatsapp_url, '_blank', 'noopener,noreferrer')
      }

      const successMessage =
        decisionType === 'partial_availability'
          ? 'Partial availability decision prepared'
          : decisionType === 'split_fulfillment'
            ? 'Split fulfillment decision prepared'
            : 'Customer decision request sent'
      showMessage(successMessage, 'success')
    } catch (e) {
      showMessage((e as Error).message || 'Failed to create customer decision', 'error')
    } finally {
      loading.value = false
    }
  }

  const renotifyDecision = async (decisionId: number | string | undefined): Promise<void> => {
    if (!selectedRequest.value || decisionNotifyingId.value || decisionId == null) return
    decisionNotifyingId.value = decisionId
    try {
      await apiCall('POST', `/api/order-requests/admin/${selectedRequest.value.id}/decisions/${decisionId}/notify`)
      const detailRes = await apiCall('GET', `/api/order-requests/admin/${selectedRequest.value.id}`)
      selectedRequest.value = detailRes.data as RequestRecord
      showMessage('Customer notified via SMS', 'success')
    } catch (e) {
      showMessage((e as Error).message || 'Failed to notify customer', 'error')
    } finally {
      decisionNotifyingId.value = null
    }
  }

  const resolveDecisionAsAdmin = async (decisionId: number | string | undefined, response: string): Promise<void> => {
    if (!selectedRequest.value || decisionId == null) return
    const label = response === 'approved' ? 'approve' : 'decline'
    const ok = window.confirm(`${response === 'approved' ? 'Approve' : 'Decline'} this decision on behalf of the customer?`)
    if (!ok) return
    loading.value = true
    try {
      await apiCall('POST', `/api/order-requests/admin/${selectedRequest.value.id}/decisions/${decisionId}/resolve`, { response })
      await fetchRequests()
      const detailRes = await apiCall('GET', `/api/order-requests/admin/${selectedRequest.value.id}`)
      selectedRequest.value = detailRes.data as RequestRecord
      showMessage(`Decision ${label}d on behalf of customer`, 'success')
    } catch (e) {
      showMessage((e as Error).message || `Failed to ${label} decision`, 'error')
    } finally {
      loading.value = false
    }
  }

  return {
    // state
    decisionNotifyingId,
    // helpers (pure)
    decisionOrderValue,
    decisionDeclineConsequence,
    // actions
    requestCustomerDecision,
    renotifyDecision,
    resolveDecisionAsAdmin,
  }
}
