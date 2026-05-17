// Extracted from pages/admin/fulfillment/order-requests.vue — delivery management logic
import { ref, type Ref, type ComputedRef } from 'vue'
import { phoneUtils } from '~/utils/phone'

interface Delivery {
  id: number | string
  pickup_pharmacy_id?: number | string
  pharmacy_whatsapp_number?: string
  pharmacy_name?: string
  pharmacy_domain?: string
  net_delivery_fee?: number | string
  delivery_fee?: number | string
  [key: string]: unknown
}

interface PaidSnapshotItem {
  item_id?: number
  source_pharmacy_id?: number | string | null
  product_name?: string
  quantity?: number
  unit_price?: number
  line_total?: number
  pharmacy_name?: string | null
  [key: string]: unknown
}

interface RequestRecord {
  id?: number | string
  request_number?: string
  customer_address?: string
  [key: string]: unknown
}

interface ForceAssignModal {
  delivery: Delivery
  driverId: string
}

interface AssignPharmacyModal {
  delivery: Delivery
}

interface Deps {
  selectedRequest: Ref<RequestRecord | null>
  paidSnapshotItems: ComputedRef<PaidSnapshotItem[]>
  apiCall: (method: string, url: string, data?: Record<string, unknown>) => Promise<{ data: unknown; message?: string }>
  showMessage: (text: string, type: string) => void
}

export const useOrderRequestDeliveries = ({ selectedRequest, paidSnapshotItems, apiCall, showMessage }: Deps) => {
  const requestDeliveries = ref<Delivery[]>([])
  const loadingDeliveries = ref(false)
  const forceAssignModal = ref<ForceAssignModal | null>(null)
  const assignPharmacyModal = ref<AssignPharmacyModal | null>(null)
  const assigningPharmacy = ref(false)

  const fetchRequestDeliveries = async (requestId: number | string): Promise<void> => {
    if (!requestId) return
    loadingDeliveries.value = true
    try {
      const res = await apiCall('GET', `/api/order-requests/admin/${requestId}/deliveries`)
      requestDeliveries.value = Array.isArray(res.data) ? (res.data as Delivery[]) : []
    } catch {
      requestDeliveries.value = []
    } finally {
      loadingDeliveries.value = false
    }
  }

  const initiateDeliveries = async (): Promise<void> => {
    if (!selectedRequest.value?.id) return
    loadingDeliveries.value = true
    try {
      const res = await apiCall('POST', `/api/order-requests/admin/${selectedRequest.value.id}/initiate-deliveries`)
      requestDeliveries.value = Array.isArray(res.data) ? (res.data as Delivery[]) : []
      showMessage(res.message ?? 'Deliveries initiated', 'success')
    } catch (e) {
      showMessage((e as Error).message || 'Failed to initiate deliveries', 'error')
    } finally {
      loadingDeliveries.value = false
    }
  }

  const openAssignToPharmacy = (delivery: Delivery): void => {
    assignPharmacyModal.value = { delivery }
  }

  const closeAssignToPharmacy = (): void => {
    assignPharmacyModal.value = null
  }

  const submitAssignToPharmacy = async (): Promise<void> => {
    const modal = assignPharmacyModal.value
    if (!modal) return
    assigningPharmacy.value = true
    try {
      await apiCall('POST', `/api/deliveries/${modal.delivery.id}/assign-pharmacy`, {
        pharmacy_id: modal.delivery.pickup_pharmacy_id as number,
      })
      showMessage('Delivery assigned to pharmacy', 'success')
      assignPharmacyModal.value = null
      if (selectedRequest.value?.id) {
        void fetchRequestDeliveries(selectedRequest.value.id)
      }
    } catch (e) {
      showMessage((e as Error).message || 'Assign to pharmacy failed', 'error')
    } finally {
      assigningPharmacy.value = false
    }
  }

  const buildPharmacyWhatsAppUrl = (delivery: Delivery): string => {
    if (!delivery.pharmacy_whatsapp_number) return '#'
    const phone = phoneUtils.formatWhatsApp(delivery.pharmacy_whatsapp_number)
    const req = selectedRequest.value
    if (!req) return `https://wa.me/${phone}`

    const pharmacyItems = (paidSnapshotItems.value || []).filter(
      (item) => item.source_pharmacy_id === delivery.pickup_pharmacy_id
    )
    const itemLines = pharmacyItems.length
      ? pharmacyItems.map((i) =>
          `• ${i.product_name ?? ''} × ${i.quantity ?? 1} — GHS ${Number(i.line_total ?? 0).toFixed(2)}`
        ).join('\n')
      : '(items on record)'
    const pharmacyTotal = pharmacyItems.reduce((sum, i) => sum + Number(i.line_total ?? 0), 0)
    const netFee = Number(delivery.net_delivery_fee ?? delivery.delivery_fee ?? 0).toFixed(2)
    const deliveriesLink = delivery.pharmacy_domain
      ? `${window.location.origin}/${delivery.pharmacy_domain}/services/deliveries`
      : `${window.location.origin}/services/deliveries`

    const message =
      `Hi ${delivery.pharmacy_name ?? ''},\n\n` +
      `Payment confirmed for Order *${req.request_number ?? ''}* ✓\n\n` +
      `Your items to prepare:\n${itemLines}\n` +
      `Drug earnings: GHS ${pharmacyTotal.toFixed(2)}\n\n` +
      `Delivery to: ${req.customer_address ?? 'customer location'}\n` +
      `Delivery earnings (net): GHS ${netFee}\n\n` +
      `Accept delivery & assign your rider here:\n${deliveriesLink}\n\n` +
      `Reply YES to confirm you will handle delivery.`

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
  }

  const openForceAssign = (delivery: Delivery): void => {
    forceAssignModal.value = { delivery, driverId: '' }
  }

  const closeForceAssign = (): void => {
    forceAssignModal.value = null
  }

  const submitForceAssign = async (): Promise<void> => {
    const modal = forceAssignModal.value
    if (!modal || !modal.driverId) {
      showMessage('Please enter a rider ID', 'error')
      return
    }
    try {
      await apiCall('POST', `/api/deliveries/${modal.delivery.id}/force-assign`, {
        driver_id: Number(modal.driverId),
      })
      showMessage('Rider force-assigned', 'success')
      forceAssignModal.value = null
      if (selectedRequest.value?.id) {
        void fetchRequestDeliveries(selectedRequest.value.id)
      }
    } catch (e) {
      showMessage((e as Error).message || 'Force assign failed', 'error')
    }
  }

  return {
    // state
    requestDeliveries,
    loadingDeliveries,
    forceAssignModal,
    assignPharmacyModal,
    assigningPharmacy,
    // actions
    fetchRequestDeliveries,
    initiateDeliveries,
    openAssignToPharmacy,
    closeAssignToPharmacy,
    submitAssignToPharmacy,
    buildPharmacyWhatsAppUrl,
    openForceAssign,
    closeForceAssign,
    submitForceAssign,
  }
}
