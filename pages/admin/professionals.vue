<template>
  <div class="container mx-auto p-4">
    <!-- Header -->
    <div class="bg-white rounded-lg shadow-md p-4 mb-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div class="mb-4 sm:mb-0">
          <h1 class="text-2xl font-bold text-gray-800">Professional Verifications</h1>
          <p class="text-gray-600 mt-1">Review health professional applications from customers</p>
        </div>
        <button
          @click="load"
          :disabled="loading"
          class="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors flex items-center disabled:opacity-50 self-start"
        >
          <svg xmlns="http://www.w3.org/2000/svg" :class="['h-5 w-5 mr-1.5', loading ? 'animate-spin' : '']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 mb-6 border-b border-gray-200">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        @click="switchTab(tab.value)"
        :class="[
          'px-5 py-2.5 text-sm font-medium rounded-t-md transition-colors',
          activeTab === tab.value
            ? 'bg-white border border-b-white border-gray-200 -mb-px text-indigo-700'
            : 'text-gray-500 hover:text-gray-700'
        ]"
      >
        {{ tab.label }}
        <span
          v-if="counts[tab.value] !== null"
          :class="[
            'ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold',
            tab.value === 'pending' ? 'bg-amber-100 text-amber-800' :
            tab.value === 'approved' ? 'bg-emerald-100 text-emerald-800' :
            'bg-red-100 text-red-800'
          ]"
        >
          {{ counts[tab.value] }}
        </span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-16">
      <svg class="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-2">
      <svg class="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
      </svg>
      <p class="text-sm text-red-800">{{ error }}</p>
    </div>

    <!-- Table -->
    <div v-else class="bg-white rounded-lg shadow-md overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profession</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
              <th v-if="activeTab !== 'pending'" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reviewed</th>
              <th v-if="activeTab === 'pending'" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              <th v-else class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="applications.length === 0">
              <td :colspan="activeTab === 'pending' ? 5 : 6" class="px-6 py-10 text-center text-gray-500 text-sm">
                No {{ activeTab }} applications
              </td>
            </tr>
            <tr v-for="app in applications" :key="app.id" class="hover:bg-gray-50 transition-colors">
              <!-- Customer -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-3">
                  <div class="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <span class="text-indigo-700 font-semibold text-sm">{{ initials(app) }}</span>
                  </div>
                  <div>
                    <div class="text-sm font-medium text-gray-900">{{ app.fname }} {{ app.lname }}</div>
                    <div class="text-xs text-gray-500">{{ app.phone }}</div>
                    <div v-if="app.email" class="text-xs text-gray-400">{{ app.email }}</div>
                  </div>
                </div>
              </td>
              <!-- Profession -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="capitalize text-sm text-gray-900">{{ app.profession_type }}</span>
              </td>
              <!-- License -->
              <td class="px-6 py-4">
                <div class="text-sm text-gray-900">{{ app.license_number }}</div>
                <div v-if="app.license_body" class="text-xs text-gray-500 mt-0.5">{{ app.license_body }}</div>
              </td>
              <!-- Submitted -->
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(app.submitted_at) }}
              </td>
              <!-- Reviewed (non-pending tabs) -->
              <td v-if="activeTab !== 'pending'" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div>{{ formatDate(app.reviewed_at) }}</div>
                <div v-if="app.reviewed_by" class="text-xs text-gray-400 mt-0.5">by {{ app.reviewed_by }}</div>
                <div v-if="app.rejection_reason" class="text-xs text-red-600 mt-1 max-w-xs">{{ app.rejection_reason }}</div>
              </td>
              <!-- Actions (pending) -->
              <td v-if="activeTab === 'pending'" class="px-6 py-4 whitespace-nowrap text-right">
                <div v-if="rejectingId === app.id" class="flex flex-col items-end gap-2">
                  <textarea
                    v-model="rejectReason"
                    rows="2"
                    placeholder="Rejection reason (required)"
                    class="text-sm border border-gray-300 rounded-md px-3 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                  />
                  <div class="flex gap-2">
                    <button
                      @click="rejectingId = null; rejectReason = ''"
                      class="px-3 py-1.5 text-xs text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      @click="submitReview(app.id, 'reject')"
                      :disabled="!rejectReason.trim() || actionId === app.id"
                      class="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                      {{ actionId === app.id ? 'Rejecting…' : 'Confirm Reject' }}
                    </button>
                  </div>
                </div>
                <div v-else class="flex gap-2 justify-end">
                  <button
                    @click="submitReview(app.id, 'approve')"
                    :disabled="actionId === app.id"
                    class="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                  >
                    {{ actionId === app.id ? 'Approving…' : 'Approve' }}
                  </button>
                  <button
                    @click="rejectingId = app.id; rejectReason = ''"
                    :disabled="actionId === app.id"
                    class="px-3 py-1.5 text-xs font-medium text-red-700 border border-red-300 rounded-md hover:bg-red-50 disabled:opacity-50 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </td>
              <!-- Status badge (non-pending) -->
              <td v-else class="px-6 py-4 whitespace-nowrap">
                <span :class="[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize',
                  app.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                ]">
                  {{ app.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { createProfessionalsAdminService } from '~/services/professionals/professionalsAdminService';
import type { ProfessionalApplication } from '~/services/professionals/professionalsAdminService';

definePageMeta({
  layout: 'admin-layout',
  middleware: ['admin-auth'],
});

type TabValue = 'pending' | 'approved' | 'rejected';

const tabs: { label: string; value: TabValue }[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

const service = createProfessionalsAdminService(useApi());

const activeTab = ref<TabValue>('pending');
const applications = ref<ProfessionalApplication[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const counts = reactive<Record<TabValue, number | null>>({ pending: null, approved: null, rejected: null });

const actionId = ref<number | null>(null);
const rejectingId = ref<number | null>(null);
const rejectReason = ref('');

const load = async () => {
  loading.value = true;
  error.value = null;
  try {
    const res = await service.list(activeTab.value);
    applications.value = res.data ?? [];
    counts[activeTab.value] = applications.value.length;
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load applications';
  } finally {
    loading.value = false;
  }
};

const switchTab = (tab: TabValue) => {
  activeTab.value = tab;
  rejectingId.value = null;
  rejectReason.value = '';
  void load();
};

const submitReview = async (id: number, action: 'approve' | 'reject') => {
  if (action === 'reject' && !rejectReason.value.trim()) return;
  actionId.value = id;
  try {
    await service.review({
      id,
      action,
      rejection_reason: action === 'reject' ? rejectReason.value.trim() : null,
    });
    applications.value = applications.value.filter(a => a.id !== id);
    counts[activeTab.value] = applications.value.length;
    rejectingId.value = null;
    rejectReason.value = '';
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Action failed';
  } finally {
    actionId.value = null;
  }
};

const initials = (app: ProfessionalApplication) =>
  ((app.fname?.[0] ?? '') + (app.lname?.[0] ?? '')).toUpperCase() || '?';

const formatDate = (d: string | null | undefined) => {
  if (!d) return '-';
  return new Date(d).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

onMounted(() => void load());
</script>
