<template>
  <div>
    <div style="padding: 1.5rem;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 1rem; border-bottom: 1px solid #e5e7eb; margin-bottom: 1.5rem;">
          <div>
            <h1 style="font-size: 1.5rem; font-weight: 600; color: #111827; letter-spacing: -0.025em; margin: 0;">Deliveries</h1>
            <p style="font-size: 0.875rem; color: #6b7280; margin: 0.25rem 0 0 0;">Track and manage all active and completed deliveries</p>
          </div>
          <button @click="fetchDeliveries" :disabled="loading" style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.4rem 0.8rem; border: 1px solid #e5e7eb; border-radius: 6px; background: #fff; font-size: 0.8rem; font-weight: 500; color: #374151; cursor: pointer;">
            <span :style="loading ? 'display:inline-block; animation: spin 1s linear infinite;' : ''">↻</span>
            <span>Refresh</span>
          </button>
        </div>

        <!-- Error -->
        <div v-if="error" style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 0.75rem 1rem; color: #b91c1c; border-radius: 4px; margin-bottom: 1rem; font-size: 0.875rem;">
          {{ error }}
        </div>

        <!-- Status Filters -->
        <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 1.25rem;">
          <button
            v-for="s in statusOptions"
            :key="s.value"
            @click="statusFilter = s.value; fetchDeliveries()"
            :style="statusFilter === s.value
              ? 'background: linear-gradient(135deg, #4F217A, #381659); color: #fff; border: 1px solid transparent;'
              : 'background: #f9fafb; color: #4b5563; border: 1px solid #e5e7eb;'"
            style="padding: 0.35rem 0.9rem; border-radius: 6px; font-size: 0.8rem; font-weight: 500; cursor: pointer;"
          >
            {{ s.label }}
          </button>
        </div>

        <!-- Table -->
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,0.04);">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
            <thead>
              <tr style="background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                <th style="padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Request #</th>
                <th style="padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Delivery Address</th>
                <th style="padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Pharmacy</th>
                <th style="padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Driver</th>
                <th style="padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Fee</th>
                <th style="padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Status</th>
                <th style="padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Created</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="7" style="padding: 3rem; text-align: center; color: #9ca3af;">Loading...</td>
              </tr>
              <tr v-else-if="deliveries.length === 0">
                <td colspan="7" style="padding: 3rem; text-align: center; color: #9ca3af; background: #f9fafb;">No deliveries found.</td>
              </tr>
              <tr
                v-for="d in deliveries"
                :key="d.id"
                style="border-bottom: 1px solid #f3f4f6; transition: background 0.15s;"
                @mouseover="$event.currentTarget.style.background='#f9fafb'"
                @mouseleave="$event.currentTarget.style.background=''"
              >
                <td style="padding: 0.75rem 1rem; font-weight: 500; color: #111827;">{{ d.request_number || `#${d.request_id}` }}</td>
                <td style="padding: 0.75rem 1rem; color: #374151; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ d.delivery_address }}</td>
                <td style="padding: 0.75rem 1rem; color: #374151;">{{ d.pharmacy_name || '—' }}</td>
                <td style="padding: 0.75rem 1rem; color: #374151;">
                  <span v-if="d.driver_name">{{ d.driver_name }}</span>
                  <span v-else style="color:#9ca3af;">Unassigned</span>
                </td>
                <td style="padding: 0.75rem 1rem; color: #374151;">GH₵ {{ Number(d.delivery_fee || 0).toFixed(2) }}</td>
                <td style="padding: 0.75rem 1rem;">
                  <span :style="statusStyle(d.delivery_status)" style="padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600;">
                    {{ formatStatus(d.delivery_status) }}
                  </span>
                </td>
                <td style="padding: 0.75rem 1rem; color: #9ca3af; font-size: 0.8rem; white-space: nowrap;">{{ formatDate(d.created_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
  </div>
</template>

<script setup lang="ts">
interface DeliveryRow {
  id: number
  request_id: number
  request_number: string | null
  delivery_address: string
  pharmacy_name: string | null
  driver_name: string | null
  delivery_fee: number | string | null
  delivery_status: string
  created_at: string | null
}

interface StatusOption {
  value: string
  label: string
}

interface FetchParams {
  limit: number
  status?: string
}

const { get } = useApi()

const deliveries = ref<DeliveryRow[]>([])
const loading = ref<boolean>(false)
const error = ref<string | null>(null)
const statusFilter = ref<string>('')

const statusOptions: StatusOption[] = [
  { value: '', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'picked_up', label: 'Picked Up' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'rider_proposed', label: 'Rider Proposed' },
]

const fetchDeliveries = async (): Promise<void> => {
  loading.value = true
  error.value = null
  try {
    const params: FetchParams = { limit: 50 }
    if (statusFilter.value) params.status = statusFilter.value
    const res = await get('/api/deliveries/', { params }) as { data?: DeliveryRow[] | null }
    deliveries.value = res.data ?? []
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load deliveries'
  } finally {
    loading.value = false
  }
}

const formatStatus = (s: string | undefined): string => {
  const map: Record<string, string> = {
    open: 'Open',
    assigned: 'Assigned',
    picked_up: 'Picked Up',
    delivered: 'Delivered',
    rider_proposed: 'Rider Proposed',
    cancelled: 'Cancelled',
  }
  return (s !== undefined ? map[s] : undefined) ?? s ?? ''
}

const statusStyle = (s: string | undefined): string => {
  const styles: Record<string, string> = {
    open: 'background:#fffbeb; color:#92400e;',
    assigned: 'background:#eff6ff; color:#1d4ed8;',
    picked_up: 'background:#f0fdf4; color:#15803d;',
    delivered: 'background:#ecfdf5; color:#047857;',
    rider_proposed: 'background:#f5f3ff; color:#6d28d9;',
    cancelled: 'background:#fef2f2; color:#b91c1c;',
  }
  return (s !== undefined ? styles[s] : undefined) ?? 'background:#f3f4f6; color:#374151;'
}

const formatDate = (dt: string | null | undefined): string => {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

onMounted(() => { void fetchDeliveries() })

definePageMeta({
  middleware: 'admin-auth',
  layout: 'admin-layout'
})
</script>
