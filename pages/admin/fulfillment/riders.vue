<template>
  <div style="padding: 1.5rem;">

    <!-- Header -->
    <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 1rem; border-bottom: 1px solid #e5e7eb; margin-bottom: 1.5rem;">
      <div>
        <h1 style="font-size: 1.5rem; font-weight: 600; color: #111827; letter-spacing: -0.025em; margin: 0;">Independent Riders</h1>
        <p style="font-size: 0.875rem; color: #6b7280; margin: 0.25rem 0 0 0;">Review and verify riders who self-registered</p>
      </div>
      <button
        @click="fetchRiders"
        :disabled="loading"
        style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.4rem 0.8rem; border: 1px solid #e5e7eb; border-radius: 6px; background: #fff; font-size: 0.8rem; font-weight: 500; color: #374151; cursor: pointer;"
      >
        {{ loading ? '…' : 'Refresh' }}
      </button>
    </div>

    <!-- Filter tabs -->
    <div style="display: flex; gap: 0.25rem; margin-bottom: 1.25rem;">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="activeTab = tab.key"
        :style="`
          padding: 0.35rem 0.85rem; border-radius: 6px; font-size: 0.8rem; font-weight: 500;
          border: 1px solid ${activeTab === tab.key ? '#2563eb' : '#e5e7eb'};
          background: ${activeTab === tab.key ? '#eff6ff' : '#fff'};
          color: ${activeTab === tab.key ? '#1d4ed8' : '#6b7280'};
          cursor: pointer;
        `"
      >
        {{ tab.label }}
        <span :style="`
          display: inline-flex; align-items: center; justify-content: center;
          margin-left: 0.35rem; min-width: 18px; height: 18px; border-radius: 9999px;
          font-size: 0.7rem; font-weight: 600; padding: 0 4px;
          background: ${activeTab === tab.key ? '#dbeafe' : '#f3f4f6'};
          color: ${activeTab === tab.key ? '#1d4ed8' : '#6b7280'};
        `">{{ tabCount(tab.key) }}</span>
      </button>
    </div>

    <!-- Error -->
    <div v-if="error" style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 1rem; color: #b91c1c; border-radius: 4px; margin-bottom: 1rem;">
      <p style="margin: 0; font-size: 0.875rem;">{{ error }}</p>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" style="background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div v-for="i in 5" :key="i" style="display: flex; align-items: center; gap: 1rem; padding: 0.875rem 1rem; border-bottom: 1px solid #f3f4f6;">
        <div style="width: 32px; height: 32px; border-radius: 50%; background: #f3f4f6;"></div>
        <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
          <div style="height: 12px; width: 35%; background: #f3f4f6; border-radius: 4px;"></div>
          <div style="height: 10px; width: 22%; background: #f3f4f6; border-radius: 4px;"></div>
        </div>
        <div style="height: 10px; width: 80px; background: #f3f4f6; border-radius: 4px;"></div>
        <div style="height: 22px; width: 70px; background: #f3f4f6; border-radius: 9999px;"></div>
        <div style="height: 28px; width: 72px; background: #f3f4f6; border-radius: 6px;"></div>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="filteredRiders.length === 0"
      style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 3rem; text-align: center; color: #6b7280;"
    >
      <p style="margin: 0; font-size: 0.9rem;">
        {{ activeTab === 'pending' ? 'No riders pending verification.' : activeTab === 'verified' ? 'No verified riders yet.' : 'No independent riders registered yet.' }}
      </p>
    </div>

    <!-- Table -->
    <div v-else style="background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; min-width: 640px; font-size: 0.875rem;">
          <thead>
            <tr style="background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
              <th style="padding: 0.6rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: #6b7280;">Rider</th>
              <th style="padding: 0.6rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: #6b7280;">Username</th>
              <th style="padding: 0.6rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: #6b7280;">Vehicle</th>
              <th style="padding: 0.6rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: #6b7280;">Registered</th>
              <th style="padding: 0.6rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: #6b7280;">Status</th>
              <th style="padding: 0.6rem 1rem; text-align: right; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: #6b7280;">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="rider in filteredRiders"
              :key="rider.id"
              style="border-bottom: 1px solid #f3f4f6; transition: background 0.1s;"
              @mouseenter="e => e.currentTarget.style.background = '#f9fafb'"
              @mouseleave="e => e.currentTarget.style.background = ''"
            >
              <!-- Rider -->
              <td style="padding: 0.75rem 1rem;">
                <div style="display: flex; align-items: center; gap: 0.625rem;">
                  <div :style="`
                    width: 32px; height: 32px; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 0.7rem; font-weight: 700; color: white; flex-shrink: 0;
                    background: ${avatarColor(rider.name)};
                  `">{{ initials(rider.name) }}</div>
                  <div>
                    <div style="font-weight: 500; color: #111827;">{{ rider.name }}</div>
                    <div style="font-size: 0.75rem; color: #6b7280; margin-top: 1px;">{{ rider.phone }}</div>
                  </div>
                </div>
              </td>

              <!-- Username -->
              <td style="padding: 0.75rem 1rem; color: #6b7280;">@{{ rider.username }}</td>

              <!-- Vehicle -->
              <td style="padding: 0.75rem 1rem; color: #6b7280;">
                {{ rider.vehicle_type ? capitalize(rider.vehicle_type) : '—' }}
                <span v-if="rider.vehicle_registration" style="color: #9ca3af;"> · {{ rider.vehicle_registration }}</span>
              </td>

              <!-- Registered -->
              <td style="padding: 0.75rem 1rem; color: #6b7280; white-space: nowrap;">{{ formatDate(rider.created_at) }}</td>

              <!-- Status -->
              <td style="padding: 0.75rem 1rem;">
                <span :style="`
                  display: inline-flex; align-items: center; gap: 0.25rem;
                  padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500;
                  ${rider.is_verified
                    ? 'background: #ecfdf5; color: #047857;'
                    : 'background: #fefce8; color: #92400e;'}
                `">
                  <span :style="`
                    width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
                    background: ${rider.is_verified ? '#10b981' : '#f59e0b'};
                  `"></span>
                  {{ rider.is_verified ? 'Verified' : 'Pending' }}
                </span>
              </td>

              <!-- Action -->
              <td style="padding: 0.75rem 1rem; text-align: right;">
                <button
                  @click="toggleVerify(rider)"
                  :disabled="savingId === rider.id"
                  :style="`
                    padding: 0.3rem 0.7rem; border-radius: 5px; font-size: 0.8rem; font-weight: 500;
                    cursor: ${savingId === rider.id ? 'not-allowed' : 'pointer'};
                    opacity: ${savingId === rider.id ? '0.6' : '1'};
                    ${rider.is_verified
                      ? 'border: 1px solid #fca5a5; background: #fff; color: #dc2626;'
                      : 'border: none; background: #2563eb; color: #fff;'}
                  `"
                >
                  {{ savingId === rider.id ? '…' : rider.is_verified ? 'Revoke' : 'Verify' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useApi } from '~/composables/useApi'

definePageMeta({
  middleware: 'admin-auth',
  layout: 'admin-layout',
})

interface Rider {
  id: number
  name: string
  phone: string
  username: string
  vehicle_type: string | null
  vehicle_registration: string | null
  is_verified: boolean
  is_active: boolean
  created_at: string
}

const api = useApi()

const riders    = ref<Rider[]>([])
const loading   = ref(true)
const error     = ref('')
const savingId  = ref<number | null>(null)
const activeTab = ref<'all' | 'pending' | 'verified'>('pending')

const tabs = [
  { key: 'pending',  label: 'Pending' },
  { key: 'verified', label: 'Verified' },
  { key: 'all',      label: 'All' },
] as const

const tabCount = (key: string) => {
  if (key === 'pending')  return riders.value.filter(r => !r.is_verified).length
  if (key === 'verified') return riders.value.filter(r => r.is_verified).length
  return riders.value.length
}

const filteredRiders = computed(() => {
  if (activeTab.value === 'pending')  return riders.value.filter(r => !r.is_verified)
  if (activeTab.value === 'verified') return riders.value.filter(r => r.is_verified)
  return riders.value
})

const COLORS = ['#7C3FB4', '#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed']
const avatarColor = (name: string) => {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0x7f
  return COLORS[h % COLORS.length]
}
const initials = (name: string) => {
  const parts = name.trim().split(/\s+/)
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : (parts[0][0] || '?').toUpperCase()
}
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const formatDate = (iso: string) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const fetchRiders = async () => {
  loading.value = true
  error.value   = ''
  try {
    const res = await api.get('/api/deliveries/drivers?rider_type=independent&active=false')
    riders.value = res.data || []
  } catch (e: any) {
    error.value = e.message || 'Failed to load riders. Try again.'
  } finally {
    loading.value = false
  }
}

const toggleVerify = async (rider: Rider) => {
  savingId.value = rider.id
  try {
    await api.put(`/api/deliveries/drivers/${rider.id}/verify`, { is_verified: !rider.is_verified })
    rider.is_verified = !rider.is_verified
  } catch (e: any) {
    error.value = e.message || 'Failed to update rider. Try again.'
  } finally {
    savingId.value = null
  }
}

onMounted(fetchRiders)
</script>
